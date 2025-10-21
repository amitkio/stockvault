import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function formatPercentage(value: number) {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export interface PortfolioData {
  todayPL: number;
  todayPLPercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  portfolioValue: number;
  buyingPower: number;
}

interface PortfolioSummaryProps {
  data: PortfolioData;
}

export function PortfolioSummary({ data }: PortfolioSummaryProps) {
  const isTodayPositive = data.todayPL >= 0;
  const isTotalPositive = data.totalGainLoss >= 0;

  const todayColor = isTodayPositive ? "text-green-600" : "text-red-600";
  const totalColor = isTotalPositive ? "text-green-600" : "text-red-600";

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today's P&L</CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${todayColor}`}
          >
            {formatCurrency(data.todayPL)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={todayColor}>
              {isTodayPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.todayPLPercent)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className={`line-clamp-1 flex gap-2 font-medium ${todayColor}`}>
            {isTodayPositive ? "Trending up today" : "Trending down today"}
            {isTodayPositive ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {isTodayPositive
              ? "Your portfolio is performing well today"
              : "Your portfolio is down today"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Gain/Loss</CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${totalColor}`}
          >
            {formatCurrency(data.totalGainLoss)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={totalColor}>
              {isTotalPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.totalGainLossPercent)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className={`line-clamp-1 flex gap-2 font-medium ${totalColor}`}>
            {isTotalPositive ? "Up" : "Down"}{" "}
            {data.totalGainLossPercent.toFixed(1)}% all time
            {isTotalPositive ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {isTotalPositive
              ? "Your portfolio is performing well all time"
              : "Your portfolio is down all time"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Portfolio Value</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(data.portfolioValue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={todayColor}>
              {isTodayPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.todayPLPercent)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className={`line-clamp-1 flex gap-2 font-medium ${todayColor}`}>
            {isTodayPositive ? "Up" : "Down"} {data.todayPLPercent.toFixed(1)}%
            today
            {isTodayPositive ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Reflecting today's market performance
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Buying Power</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(data.buyingPower)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Ready to invest
          </div>
          <div className="text-muted-foreground">
            You have cash available to trade
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
