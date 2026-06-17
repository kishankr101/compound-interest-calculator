"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CalculatorField } from "@/lib/calculators/types"

interface DynamicFieldProps {
  field: CalculatorField
  value: number | string
  onChange: (value: number | string) => void
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const id = `field-${field.key}`

  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {field.label}
        </Label>
        <Select value={String(value)} onValueChange={(v) => onChange(v ?? "")}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
      </div>
    )
  }

  if (field.type === "series") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {field.label}
        </Label>
        <Textarea
          id={id}
          value={String(value)}
          rows={2}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none font-mono text-sm tabular-nums"
        />
        {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
      </div>
    )
  }

  // Numeric fields (number, currency, percent, integer)
  const numValue = typeof value === "number" ? value : Number(value) || 0
  const isCurrency = field.type === "currency"
  const hasSlider = field.min !== undefined && field.max !== undefined

  const clamp = (n: number) => {
    let next = n
    if (field.min !== undefined) next = Math.max(field.min, next)
    if (field.max !== undefined) next = Math.min(field.max, next)
    return next
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {field.label}
        </Label>
        <div className="relative flex items-center">
          {isCurrency ? (
            <span className="pointer-events-none absolute left-2.5 text-sm text-muted-foreground">
              $
            </span>
          ) : null}
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            value={numValue}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => {
              const parsed = Number.parseFloat(e.target.value)
              onChange(Number.isNaN(parsed) ? (field.min ?? 0) : clamp(parsed))
            }}
            className={`h-9 w-32 text-right tabular-nums ${isCurrency ? "pl-6" : ""} ${field.suffix ? "pr-12" : ""}`}
          />
          {field.suffix ? (
            <span className="pointer-events-none absolute right-2.5 text-xs text-muted-foreground">
              {field.suffix}
            </span>
          ) : null}
        </div>
      </div>
      {hasSlider ? (
        <Slider
          value={[numValue]}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onValueChange={(vals) => onChange((vals as number[])[0])}
          aria-label={field.label}
        />
      ) : null}
      {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
    </div>
  )
}
