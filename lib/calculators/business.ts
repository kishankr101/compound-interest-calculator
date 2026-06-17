import type { CalculatorSpec } from "./types"
import { parseSeries, npv as npvFn, irr as irrFn } from "./math"

const npv: CalculatorSpec = {
  id: "npv",
  name: "Net Present Value (NPV)",
  description: "Checks whether a project adds value at a given discount rate.",
  fields: [
    { key: "rate", label: "Discount Rate", type: "percent", default: 10, min: 0, step: 0.1, suffix: "%" },
    { key: "initial", label: "Initial Investment", type: "currency", default: 50000, min: 0, step: 1000 },
    { key: "flows", label: "Annual Cash Flows", type: "series", default: "15000, 18000, 20000, 22000", hint: "One value per year" },
  ],
  compute: (v) => {
    const flows = [-Math.abs(Number(v.initial)), ...parseSeries(v.flows)]
    const rate = Number(v.rate) / 100
    const value = npvFn(rate, flows)
    return {
      rows: [
        { label: "Net Present Value", value, format: "currency", primary: true, signed: true },
        { label: "Decision", value: value >= 0 ? "Accept project" : "Reject project", format: "text" },
        { label: "Total Cash In", value: flows.slice(1).reduce((a, b) => a + b, 0), format: "currency" },
      ],
    }
  },
}

const irr: CalculatorSpec = {
  id: "irr",
  name: "Internal Rate of Return (IRR)",
  description: "Measures the discount rate where a project's NPV equals zero.",
  fields: [
    { key: "initial", label: "Initial Investment", type: "currency", default: 50000, min: 0, step: 1000 },
    { key: "flows", label: "Annual Cash Flows", type: "series", default: "15000, 18000, 20000, 22000", hint: "One value per year" },
  ],
  compute: (v) => {
    const flows = [-Math.abs(Number(v.initial)), ...parseSeries(v.flows)]
    const rate = irrFn(flows)
    return {
      rows: [
        { label: "Internal Rate of Return", value: Number.isNaN(rate) ? "No solution" : rate * 100, format: Number.isNaN(rate) ? "text" : "percent", primary: true },
        { label: "Total Cash In", value: flows.slice(1).reduce((a, b) => a + b, 0), format: "currency" },
      ],
    }
  },
}

const payback: CalculatorSpec = {
  id: "payback",
  name: "Payback Period",
  description: "Shows how long it takes to recover an initial investment.",
  fields: [
    { key: "initial", label: "Initial Investment", type: "currency", default: 50000, min: 0, step: 1000 },
    { key: "flows", label: "Annual Cash Flows", type: "series", default: "15000, 18000, 20000, 22000", hint: "One value per year" },
  ],
  compute: (v) => {
    const initial = Math.abs(Number(v.initial))
    const flows = parseSeries(v.flows)
    let cumulative = 0
    let period = -1
    let fraction = 0
    for (let i = 0; i < flows.length; i++) {
      if (cumulative + flows[i] >= initial) {
        period = i
        fraction = flows[i] > 0 ? (initial - cumulative) / flows[i] : 0
        break
      }
      cumulative += flows[i]
    }
    const result = period >= 0 ? period + fraction : Number.NaN
    return {
      rows: [
        { label: "Payback Period", value: Number.isNaN(result) ? "Not recovered" : result, format: Number.isNaN(result) ? "text" : "number", primary: true, hint: Number.isNaN(result) ? undefined : "years" },
      ],
    }
  },
}

const dcf: CalculatorSpec = {
  id: "dcf",
  name: "Discounted Cash Flow (DCF)",
  description: "Values an asset using projected cash flows and a terminal value.",
  fields: [
    { key: "rate", label: "Discount Rate (WACC)", type: "percent", default: 10, min: 0.1, step: 0.1, suffix: "%" },
    { key: "growth", label: "Terminal Growth", type: "percent", default: 2.5, min: 0, step: 0.1, suffix: "%" },
    { key: "flows", label: "Projected Cash Flows", type: "series", default: "20000, 24000, 28000, 32000, 36000", hint: "One value per year" },
  ],
  compute: (v) => {
    const rate = Number(v.rate) / 100
    const growth = Number(v.growth) / 100
    const flows = parseSeries(v.flows)
    let pv = 0
    flows.forEach((cf, i) => {
      pv += cf / (1 + rate) ** (i + 1)
    })
    const lastFlow = flows[flows.length - 1] ?? 0
    const terminal = rate > growth ? (lastFlow * (1 + growth)) / (rate - growth) : 0
    const pvTerminal = terminal / (1 + rate) ** flows.length
    return {
      rows: [
        { label: "Enterprise Value", value: pv + pvTerminal, format: "currency", primary: true },
        { label: "PV of Cash Flows", value: pv, format: "currency" },
        { label: "PV of Terminal Value", value: pvTerminal, format: "currency" },
      ],
    }
  },
}

const grossMargin: CalculatorSpec = {
  id: "gross-margin",
  name: "Gross Margin",
  description: "Measures profit remaining after direct costs.",
  fields: [
    { key: "revenue", label: "Revenue", type: "currency", default: 500000, min: 0, step: 1000 },
    { key: "cogs", label: "Cost of Goods Sold", type: "currency", default: 320000, min: 0, step: 1000 },
  ],
  compute: (v) => {
    const revenue = Number(v.revenue)
    const profit = revenue - Number(v.cogs)
    return {
      rows: [
        { label: "Gross Margin", value: revenue > 0 ? (profit / revenue) * 100 : 0, format: "percent", primary: true },
        { label: "Gross Profit", value: profit, format: "currency", signed: true },
      ],
    }
  },
}

const operatingMargin: CalculatorSpec = {
  id: "operating-margin",
  name: "Operating Margin",
  description: "Shows operating efficiency after operating expenses.",
  fields: [
    { key: "revenue", label: "Revenue", type: "currency", default: 500000, min: 0, step: 1000 },
    { key: "operatingIncome", label: "Operating Income", type: "currency", default: 90000, min: 0, step: 1000 },
  ],
  compute: (v) => {
    const revenue = Number(v.revenue)
    const oi = Number(v.operatingIncome)
    return {
      rows: [
        { label: "Operating Margin", value: revenue > 0 ? (oi / revenue) * 100 : 0, format: "percent", primary: true },
        { label: "Operating Income", value: oi, format: "currency", signed: true },
      ],
    }
  },
}

const netMargin: CalculatorSpec = {
  id: "net-margin",
  name: "Net Profit Margin",
  description: "Shows final profitability after all expenses and taxes.",
  fields: [
    { key: "revenue", label: "Revenue", type: "currency", default: 500000, min: 0, step: 1000 },
    { key: "netIncome", label: "Net Income", type: "currency", default: 60000, min: 0, step: 1000 },
  ],
  compute: (v) => {
    const revenue = Number(v.revenue)
    const ni = Number(v.netIncome)
    return {
      rows: [
        { label: "Net Profit Margin", value: revenue > 0 ? (ni / revenue) * 100 : 0, format: "percent", primary: true },
        { label: "Net Income", value: ni, format: "currency", signed: true },
      ],
    }
  },
}

const breakEvenPoint: CalculatorSpec = {
  id: "break-even-point",
  name: "Break-even Point",
  description: "Tells the sales volume needed to cover all costs.",
  fields: [
    { key: "fixed", label: "Fixed Costs", type: "currency", default: 100000, min: 0, step: 1000 },
    { key: "price", label: "Price Per Unit", type: "currency", default: 50, min: 0.01, step: 0.5 },
    { key: "variable", label: "Variable Cost / Unit", type: "currency", default: 30, min: 0, step: 0.5 },
  ],
  compute: (v) => {
    const contribution = Number(v.price) - Number(v.variable)
    const units = contribution > 0 ? Number(v.fixed) / contribution : Number.NaN
    return {
      rows: [
        { label: "Break-even Units", value: Number.isNaN(units) ? "Not achievable" : Math.ceil(units), format: Number.isNaN(units) ? "text" : "integer", primary: true },
        { label: "Break-even Revenue", value: Number.isNaN(units) ? 0 : units * Number(v.price), format: "currency" },
        { label: "Contribution Margin", value: contribution, format: "currency", hint: "per unit" },
      ],
    }
  },
}

export const businessCalculators: CalculatorSpec[] = [
  npv,
  irr,
  payback,
  dcf,
  grossMargin,
  operatingMargin,
  netMargin,
  breakEvenPoint,
]
