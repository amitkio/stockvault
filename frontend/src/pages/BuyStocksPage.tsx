import { useEffect, useState } from "react";
import { columns } from "../components/buy-stocks-table-columns";
import { BuyStocksDataTable } from "../components/BuyStocksDataTable";
import { io } from "socket.io-client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface Stock {
  stock_id: number;
  company_name: string;
  latest_ohlc: {
    close: number;
    date: string;
    high: number;
    low: number;
    open: number;
    volume: number;
  };
  sector: string;
  symbol: string;
}

export function BuyStocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/stocks", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setStocks(data));
  }, []);

  useEffect(() => {
    const socket = io("ws://localhost:5000/stocks");

    socket.on("price_update", (data: { symbol: string; price: number }) => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) =>
          stock.symbol === data.symbol
            ? {
                ...stock,
                latest_ohlc: { ...stock.latest_ohlc, close: data.price },
              }
            : stock
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="container mx-auto py-10">
          <h1 className="scroll-m-20 mb-5 text-4xl tracking-tight text-balance">
            Nifty 50
          </h1>
          <BuyStocksDataTable columns={columns} data={stocks} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
