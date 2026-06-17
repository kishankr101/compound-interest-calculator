"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  formatCompactCurrency,
  type YearlyDataPoint,
} from "@/lib/compound-interest"

const chartConfig = {
  contributions: {
    label: "Contributions",
    color: "var(--chart-2)",
  },
  interest: {
    label: "Interest Earned",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function GrowthChart({ data }: { data: YearlyDataPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[340px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }} stackOffset="none">
        <defs>
          <linearGradient id="fillContributions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-contributions)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-contributions)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillInterest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-interest)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-interest)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `Yr ${value}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={(value) => formatCompactCurrency(Number(value))}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `Year ${label}`}
              formatter={(value, name, item) => {
                const color = item.color
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label}
                      </span>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCompactCurrency(Number(value))}
                    </span>
                  </div>
                )
              }}
            />
          }
        />
        <Area
          dataKey="contributions"
          type="monotone"
          stackId="a"
          stroke="var(--color-contributions)"
          fill="url(#fillContributions)"
          strokeWidth={2}
        />
        <Area
          dataKey="interest"
          type="monotone"
          stackId="a"
          stroke="var(--color-interest)"
          fill="url(#fillInterest)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
