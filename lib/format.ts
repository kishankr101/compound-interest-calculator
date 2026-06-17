import type { ResultFormat } from "./calculators/types"

export function formatValue(value: number | string, format: ResultFormat = "number"): string {
  if (typeof value === "string") return value
  if (!Number.isFinite(value)) return "—"
  switch (format) {
    case "currency":
      return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
      })
    case "percent":
      return `${value.toFixed(2)}%`
    case "integer":
      return Math.round(value).toLocaleString("en-US")
    case "number":
      return value.toLocaleString("en-US", { maximumFractionDigits: 4 })
    default:
      return String(value)
  }
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}
