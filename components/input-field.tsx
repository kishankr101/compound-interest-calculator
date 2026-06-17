"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

interface InputFieldProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
}

export function InputField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: InputFieldProps) {
  const handleInputChange = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    if (Number.isNaN(parsed)) {
      onChange(min)
      return
    }
    onChange(Math.min(max, Math.max(min, parsed)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <div className="relative flex items-center">
          {prefix ? (
            <span className="pointer-events-none absolute left-2.5 text-sm text-muted-foreground">
              {prefix}
            </span>
          ) : null}
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`h-9 w-28 text-right tabular-nums ${prefix ? "pl-6" : ""} ${suffix ? "pr-7" : ""}`}
          />
          {suffix ? (
            <span className="pointer-events-none absolute right-2.5 text-sm text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0])}
        aria-label={label}
      />
    </div>
  )
}
