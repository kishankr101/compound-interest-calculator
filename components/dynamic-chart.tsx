"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
import { formatCompact } from "@/lib/format"
import type { CalculatorChart } from "@/lib/calculators/types"

export function DynamicChart({ chart }: { chart: CalculatorChart }) {
  const config: ChartConfig = {}
  chart.series.forEach((s) => {
    config[s.key] = { label: s.label, color: `var(--chart-${s.color})` }
  })

  const common = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey={chart.xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        width={48}
        tickFormatter={(value) => formatCompact(Number(value))}
      />
      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  )

  return (
    <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
      {chart.type === "bar" ? (
        <BarChart data={chart.data} margin={{ left: 4, right: 8, top: 8 }}>
          {common}
          {chart.series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId={s.stacked ? "a" : undefined}
              fill={`var(--color-${s.key})`}
              radius={s.stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      ) : chart.type === "line" ? (
        <LineChart data={chart.data} margin={{ left: 4, right: 8, top: 8 }}>
          {common}
          {chart.series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      ) : (
        <AreaChart data={chart.data} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            {chart.series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.7} />
                <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          {common}
          {chart.series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stackId={s.stacked ? "a" : undefined}
              stroke={`var(--color-${s.key})`}
              fill={`url(#fill-${s.key})`}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </AreaChart>
      )}
    </ChartContainer>
  )
}
