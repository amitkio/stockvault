"use client";

import React from "react";
import { io } from "socket.io-client";
import { type UniqueIdentifier } from "@dnd-kit/core";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DataTable } from "@/components/data-table";
import {
  PortfolioSummary,
  type PortfolioData,
} from "@/components/portfolio-summary";

import { HoldingsPieChart } from "@/components/holdings-pie-chart";
import {
  HoldingsPerformanceChart,
  type PnLData,
} from "@/components/holdings-performance-chart";

interface ApiHolding {
  holding_id: number;
  portfolio_id: number;
  stock_id: number;
  quantity: number;
  average_cost_per_share: number;
  last_updated: string;
}

interface ApiStock {
  stock_id: number;
  symbol: string;
  company_name: string;
  latest_ohlc: {
    open: number;
    close: number;
  };
}

interface ApiPortfolio {
  portfolio_id: number;
  user_id: number;
  portfolio_name: string;
  cash_balance: number;
}

export interface EnrichedHolding {
  id: UniqueIdentifier;
  symbol: string;
  company_name: string;
  quantity: number;
  average_cost_per_share: number;
  current_price: number;
  open_price: number;
  last_updated: string;
}

export default function Dashboard() {
  const [holdings, setHoldings] = React.useState<EnrichedHolding[]>([]);
  const [portfolio, setPortfolio] = React.useState<ApiPortfolio | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No auth token found");
      setIsLoading(false);
      return;
    }

    try {
      const [holdingsRes, stocksRes, portfolioRes] = await Promise.all([
        fetch("http://localhost:5000/portfolio/holdings", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch("http://localhost:5000/stocks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/portfolio/", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      if (!holdingsRes.ok || !stocksRes.ok || !portfolioRes.ok) {
        throw new Error("Failed to fetch initial data");
      }

      const holdingsData: ApiHolding[] = await holdingsRes.json();
      const stocksData: ApiStock[] = await stocksRes.json();
      const portfolioData: ApiPortfolio = await portfolioRes.json();

      const stockInfoMap = new Map<
        number,
        {
          symbol: string;
          company_name: string;
          current_price: number;
          open_price: number;
        }
      >();
      stocksData.forEach((stock) => {
        stockInfoMap.set(stock.stock_id, {
          symbol: stock.symbol,
          company_name: stock.company_name,
          current_price: stock.latest_ohlc.close,
          open_price: stock.latest_ohlc.open,
        });
      });

      const enrichedData: EnrichedHolding[] = holdingsData
        .map((holding) => {
          const stockInfo = stockInfoMap.get(holding.stock_id);
          if (!stockInfo) return null;
          return {
            id: holding.holding_id,
            symbol: stockInfo.symbol,
            company_name: stockInfo.company_name,
            quantity: holding.quantity,
            average_cost_per_share: holding.average_cost_per_share,
            current_price: stockInfo.current_price,
            open_price: stockInfo.open_price,
            last_updated: holding.last_updated,
          };
        })
        .filter((h): h is EnrichedHolding => h !== null);

      setHoldings(enrichedData);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    const socket = io("ws://localhost:5000/stocks");

    socket.on("connect", () => {
      console.log("WebSocket connected to /stocks namespace");
    });

    socket.on("price_update", (update: { symbol: string; price: number }) => {
      setHoldings((currentHoldings) =>
        currentHoldings.map((holding) =>
          holding.symbol === update.symbol
            ? { ...holding, current_price: update.price }
            : holding
        )
      );
    });

    socket.on("disconnect", () => console.log("WebSocket disconnected"));
    socket.on("connect_error", (err) =>
      console.error("WebSocket connection error:", err)
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  const summaryData = React.useMemo<PortfolioData | null>(() => {
    if (!portfolio) {
      return null;
    }

    const cashValue = portfolio.cash_balance;
    const today = new Date().toISOString().split("T")[0];

    if (holdings.length === 0) {
      return {
        todayPL: 0,
        todayPLPercent: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        portfolioValue: cashValue,
        buyingPower: cashValue,
      };
    }

    let totalInvestment = 0;
    let holdingsValue = 0;
    let valueBasisForToday = 0;

    for (const holding of holdings) {
      totalInvestment += holding.quantity * holding.average_cost_per_share;
      holdingsValue += holding.quantity * holding.current_price;

      const holdingDate = holding.last_updated.split("T")[0];

      if (holdingDate === today) {
        valueBasisForToday += holding.quantity * holding.average_cost_per_share;
      } else {
        valueBasisForToday += holding.quantity * holding.open_price;
      }
    }

    const todayPL = holdingsValue - valueBasisForToday;
    const totalPortfolioValue = holdingsValue;
    const totalGainLoss = holdingsValue - totalInvestment;
    const totalGainLossPercent =
      totalInvestment === 0 ? 0 : (totalGainLoss / totalInvestment) * 100;

    const costOfSharesBoughtToday = holdings.reduce((sum, holding) => {
      const holdingDate = holding.last_updated.split("T")[0];
      if (holdingDate === today) {
        return sum + holding.quantity * holding.average_cost_per_share;
      }
      return sum;
    }, 0);

    const cashAtOpen = cashValue + costOfSharesBoughtToday;
    const totalPortfolioValueAtOpen = valueBasisForToday + cashAtOpen;

    const todayPLPercent =
      totalPortfolioValueAtOpen === 0
        ? 0
        : (todayPL / totalPortfolioValueAtOpen) * 100;

    return {
      todayPL: todayPL,
      todayPLPercent: todayPLPercent,
      totalGainLoss: totalGainLoss,
      totalGainLossPercent: totalGainLossPercent,
      portfolioValue: totalPortfolioValue,
      buyingPower: cashValue,
    };
  }, [holdings, portfolio]);

  const pieChartData = React.useMemo(() => {
    return holdings.map((holding) => ({
      symbol: holding.symbol,
      value: holding.quantity * holding.average_cost_per_share,
    }));
  }, [holdings]);

  const performanceData = React.useMemo<PnLData[]>(() => {
    return holdings.map((holding) => {
      const pnl =
        (holding.current_price - holding.average_cost_per_share) *
        holding.quantity;
      return {
        symbol: holding.symbol,
        pnl: pnl,
      };
    });
  }, [holdings]);

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {isLoading || !summaryData ? (
              <div className="flex flex-1 items-center justify-center">
                <p>Loading Dashboard...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <PortfolioSummary data={summaryData} />

                <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-2 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio Allocation (by Cost)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HoldingsPieChart data={pieChartData} />
                    </CardContent>
                  </Card>

                  <HoldingsPerformanceChart data={performanceData} />
                </div>

                <DataTable data={holdings} onRefreshData={fetchData} />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
