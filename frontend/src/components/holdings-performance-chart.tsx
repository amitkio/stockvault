"use client";

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Data this component expects
export interface PnLData {
  symbol: string;
  pnl: number;
}

interface HoldingsPerformanceChartProps {
  data: PnLData[];
}

// --- Hardcoded Colors ---
const WINNER_COLOR = "hsl(210 90% 70%)"; // Lighter Blue
const LOSER_COLOR = "hsl(210 90% 30%)"; // Darker Blue
// ------------------------

const winnersConfig = {
  pnl: { label: "Profit", color: WINNER_COLOR },
} satisfies ChartConfig;

const losersConfig = {
  pnl: { label: "Loss", color: LOSER_COLOR },
} satisfies ChartConfig;

// A small, reusable chart component
function PerformanceBarChart({
  data,
  config,
  fill,
}: {
  data: PnLData[];
  config: ChartConfig;
  fill: string;
}) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR", // Kept your change to INR
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 10, right: 20 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="symbol"
            type="category"
            axisLine={false}
            tickLine={false}
            tickMargin={5}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Symbol: ${label}`}
                formatter={(value) => formatCurrency(value as number)}
              />
            }
          />
          <Bar dataKey="pnl" radius={4} fill={fill} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function HoldingsPerformanceChart({
  data,
}: HoldingsPerformanceChartProps) {
  const { winners, losers } = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => b.pnl - a.pnl);
    const positive = sorted.filter((d) => d.pnl > 0).slice(0, 5);
    const negative = sorted
      .filter((d) => d.pnl < 0)
      .reverse() // Sort from smallest (most negative) to least negative
      .slice(0, 5)
      .map((d) => ({ ...d, pnl: d.pnl }));

    return { winners: positive, losers: negative };
  }, [data]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Winners (Total P&L)</CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length > 0 ? (
            <PerformanceBarChart
              data={winners}
              config={winnersConfig}
              fill={WINNER_COLOR}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No profits yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
