"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DynamicField } from "@/components/dynamic-field"
import { DynamicChart } from "@/components/dynamic-chart"
import { formatValue } from "@/lib/format"
import type { CalculatorSpec } from "@/lib/calculators/types"

function defaultValues(spec: CalculatorSpec): Record<string, number | string> {
  const values: Record<string, number | string> = {}
  for (const field of spec.fields) values[field.key] = field.default
  return values
}

export function CalculatorEngine({ spec }: { spec: CalculatorSpec }) {
  const [values, setValues] = useState<Record<string, number | string>>(() => defaultValues(spec))

  const result = useMemo(() => {
    try {
      return spec.compute(values)
    } catch {
      return { rows: [{ label: "Error", value: "Check your inputs", format: "text" as const }] }
    }
  }, [spec, values])

  const update = (key: string, value: number | string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const primary = result.rows.find((r) => r.primary)
  const secondary = result.rows.filter((r) => !r.primary)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Inputs */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {spec.fields.map((field) => (
            <DynamicField
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) => update(field.key, v)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex flex-col gap-6">
        {primary ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <p className="text-sm font-medium text-muted-foreground">{primary.label}</p>
              <p
                className={cn(
                  "mt-1 font-mono text-4xl font-semibold tabular-nums tracking-tight text-balance",
                  primary.signed && typeof primary.value === "number"
                    ? primary.value >= 0
                      ? "text-primary"
                      : "text-destructive"
                    : "text-foreground",
                )}
              >
                {formatValue(primary.value, primary.format)}
              </p>
              {primary.hint ? (
                <p className="mt-1 text-xs text-muted-foreground">{primary.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {secondary.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border py-2">
              {secondary.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{row.label}</p>
                    {row.hint ? <p className="text-xs text-muted-foreground/70">{row.hint}</p> : null}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-lg font-medium tabular-nums",
                      row.signed && typeof row.value === "number"
                        ? row.value >= 0
                          ? "text-primary"
                          : "text-destructive"
                        : "text-foreground",
                    )}
                  >
                    {formatValue(row.value, row.format)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {result.note ? (
          <p className="text-sm text-muted-foreground text-pretty">{result.note}</p>
        ) : null}

        {result.chart && result.chart.data.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <DynamicChart chart={result.chart} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
