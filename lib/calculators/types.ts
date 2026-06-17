export type FieldType = "number" | "currency" | "percent" | "integer" | "select" | "series"

export interface CalculatorField {
  key: string
  label: string
  type: FieldType
  /** Default value. For "series" this is a comma-separated string. */
  default: number | string
  min?: number
  max?: number
  step?: number
  /** Helper text shown under the field. */
  hint?: string
  /** Options for "select" fields. */
  options?: { label: string; value: string }[]
  /** Unit suffix shown inside the input (e.g. "yrs", "%"). */
  suffix?: string
}

export type ResultFormat = "currency" | "percent" | "number" | "integer" | "text"

export interface ResultRow {
  label: string
  value: number | string
  format?: ResultFormat
  /** Emphasize this row as the primary headline result. */
  primary?: boolean
  /** Optional positive/negative coloring driven by the sign of the value. */
  signed?: boolean
  hint?: string
}

export type ChartType = "area" | "line" | "bar"

export interface ChartSeries {
  key: string
  label: string
  /** 1-indexed chart color token (maps to --chart-N). */
  color: number
  stacked?: boolean
}

export interface CalculatorChart {
  type: ChartType
  /** X-axis data key. */
  xKey: string
  xLabel?: string
  series: ChartSeries[]
  data: Record<string, number | string>[]
}

export interface CalculatorResult {
  rows: ResultRow[]
  chart?: CalculatorChart
  /** Optional free-form note rendered under the results. */
  note?: string
}

export interface CalculatorSpec {
  id: string
  name: string
  description: string
  /** Compute results from the raw field values (numbers, or strings for select/series). */
  compute: (values: Record<string, number | string>) => CalculatorResult
  fields: CalculatorField[]
}

export interface CalculatorCategory {
  id: string
  name: string
  /** Short tagline shown under the category title. */
  tagline: string
  calculators: CalculatorSpec[]
}
