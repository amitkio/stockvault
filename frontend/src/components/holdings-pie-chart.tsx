"use client";

import * as React from "react";
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface HoldingsData {
  symbol: string;
  value: number; // Invested value
}

interface HoldingsPieChartProps {
  data: HoldingsData[];
}

// Base colors from shadcn/ui
const CHART_COLORS_HSL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))", // You can add more
];

export function HoldingsPieChart({ data }: HoldingsPieChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const { chartData, chartConfig } = React.useMemo(() => {
    const config: ChartConfig = {};
    const chartDataWithFill = data.map((item, index) => {
      const color = CHART_COLORS_HSL[index % CHART_COLORS_HSL.length];
      config[item.symbol] = {
        label: item.symbol,
        color: color,
      };
      return {
        ...item,
        fill: color,
      };
    });

    return { chartData: chartDataWithFill, chartConfig: config };
  }, [data]);

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[350px] w-full min-h-[300px]"
    >
      <ResponsiveContainer>
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => [
                  `${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "INR",
                  }).format(value as number)} (${(
                    ((value as number) / totalValue) *
                    100
                  ).toFixed(1)}%)`,
                  chartConfig[name as string]?.label || name,
                ]}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="symbol"
            outerRadius={120}
          >
            {chartData.map((entry) => (
              <Cell key={entry.symbol} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="symbol" />}
            className="-translate-y-2"
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
