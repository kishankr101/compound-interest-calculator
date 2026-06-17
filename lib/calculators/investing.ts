import type { CalculatorSpec } from "./types"
import { parseSeries } from "./math"

const roi: CalculatorSpec = {
  id: "roi",
  name: "Return on Investment (ROI)",
  description: "Measures profit or loss from an investment as a percentage of cost.",
  fields: [
    { key: "cost", label: "Initial Cost", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "final", label: "Final Value", type: "currency", default: 13500, min: 0, step: 100 },
    { key: "years", label: "Holding Period", type: "number", default: 3, min: 0, step: 0.5, suffix: "yrs" },
  ],
  compute: (v) => {
    const cost = Number(v.cost)
    const final = Number(v.final)
    const years = Number(v.years)
    const gain = final - cost
    const roiPct = cost !== 0 ? (gain / cost) * 100 : 0
    const annualized = cost > 0 && years > 0 ? ((final / cost) ** (1 / years) - 1) * 100 : 0
    return {
      rows: [
        { label: "Net Profit / Loss", value: gain, format: "currency", primary: true, signed: true },
        { label: "Total ROI", value: roiPct, format: "percent", signed: true },
        { label: "Annualized ROI", value: annualized, format: "percent", signed: true },
      ],
    }
  },
}

const cagr: CalculatorSpec = {
  id: "cagr",
  name: "Compound Annual Growth Rate (CAGR)",
  description: "Shows the average yearly growth rate of an investment over time.",
  fields: [
    { key: "begin", label: "Beginning Value", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "end", label: "Ending Value", type: "currency", default: 24000, min: 0, step: 100 },
    { key: "years", label: "Number of Years", type: "number", default: 5, min: 0.1, step: 0.5, suffix: "yrs" },
  ],
  compute: (v) => {
    const begin = Number(v.begin)
    const end = Number(v.end)
    const years = Number(v.years)
    const cagrPct = begin > 0 && years > 0 ? ((end / begin) ** (1 / years) - 1) * 100 : 0
    const totalGrowth = begin > 0 ? (end / begin - 1) * 100 : 0
    return {
      rows: [
        { label: "CAGR", value: cagrPct, format: "percent", primary: true, signed: true },
        { label: "Total Growth", value: totalGrowth, format: "percent", signed: true },
        { label: "Absolute Gain", value: end - begin, format: "currency", signed: true },
      ],
    }
  },
}

const futureValue: CalculatorSpec = {
  id: "future-value",
  name: "Future Value",
  description: "Estimates how much a present sum plus contributions will grow to.",
  fields: [
    { key: "pv", label: "Present Value", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "pmt", label: "Annual Contribution", type: "currency", default: 2000, min: 0, step: 100 },
    { key: "rate", label: "Annual Return", type: "percent", default: 7, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years", type: "integer", default: 20, min: 1, max: 60, step: 1, suffix: "yrs" },
  ],
  compute: (v) => {
    const pv = Number(v.pv)
    const pmt = Number(v.pmt)
    const r = Number(v.rate) / 100
    const years = Math.round(Number(v.years))
    const data = []
    let balance = pv
    let contributed = pv
    for (let y = 0; y <= years; y++) {
      if (y > 0) {
        balance = balance * (1 + r) + pmt
        contributed += pmt
      }
      data.push({
        year: `Y${y}`,
        contributions: Math.round(contributed),
        value: Math.round(balance),
      })
    }
    return {
      rows: [
        { label: "Future Value", value: balance, format: "currency", primary: true },
        { label: "Total Contributed", value: contributed, format: "currency" },
        { label: "Total Growth", value: balance - contributed, format: "currency", signed: true },
      ],
      chart: {
        type: "area",
        xKey: "year",
        series: [
          { key: "contributions", label: "Contributions", color: 2, stacked: true },
          { key: "value", label: "Total Value", color: 1 },
        ],
        data,
      },
    }
  },
}

const presentValue: CalculatorSpec = {
  id: "present-value",
  name: "Present Value",
  description: "Finds today's value of a sum of money to be received in the future.",
  fields: [
    { key: "fv", label: "Future Value", type: "currency", default: 50000, min: 0, step: 100 },
    { key: "rate", label: "Discount Rate", type: "percent", default: 6, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years", type: "number", default: 10, min: 0, step: 1, suffix: "yrs" },
  ],
  compute: (v) => {
    const fv = Number(v.fv)
    const r = Number(v.rate) / 100
    const years = Number(v.years)
    const pv = fv / (1 + r) ** years
    return {
      rows: [
        { label: "Present Value", value: pv, format: "currency", primary: true },
        { label: "Discount Amount", value: fv - pv, format: "currency" },
      ],
    }
  },
}

const sip: CalculatorSpec = {
  id: "sip",
  name: "SIP Calculator",
  description: "Calculates the growth of regular monthly mutual fund investments.",
  fields: [
    { key: "monthly", label: "Monthly Investment", type: "currency", default: 500, min: 0, step: 50 },
    { key: "rate", label: "Expected Annual Return", type: "percent", default: 12, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years", type: "integer", default: 15, min: 1, max: 50, step: 1, suffix: "yrs" },
  ],
  compute: (v) => {
    const m = Number(v.monthly)
    const r = Number(v.rate) / 100 / 12
    const years = Math.round(Number(v.years))
    const months = years * 12
    const data = []
    let balance = 0
    let invested = 0
    for (let i = 1; i <= months; i++) {
      balance = balance * (1 + r) + m
      invested += m
      if (i % 12 === 0) {
        data.push({
          year: `Y${i / 12}`,
          invested: Math.round(invested),
          value: Math.round(balance),
        })
      }
    }
    return {
      rows: [
        { label: "Maturity Value", value: balance, format: "currency", primary: true },
        { label: "Total Invested", value: invested, format: "currency" },
        { label: "Estimated Returns", value: balance - invested, format: "currency", signed: true },
      ],
      chart: {
        type: "area",
        xKey: "year",
        series: [
          { key: "invested", label: "Invested", color: 2, stacked: true },
          { key: "value", label: "Value", color: 1 },
        ],
        data,
      },
    }
  },
}

const lumpSum: CalculatorSpec = {
  id: "lump-sum",
  name: "Lump Sum Investment",
  description: "Estimates the growth of a single one-time investment.",
  fields: [
    { key: "amount", label: "Investment Amount", type: "currency", default: 25000, min: 0, step: 100 },
    { key: "rate", label: "Expected Annual Return", type: "percent", default: 10, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years", type: "integer", default: 12, min: 1, max: 50, step: 1, suffix: "yrs" },
  ],
  compute: (v) => {
    const amount = Number(v.amount)
    const r = Number(v.rate) / 100
    const years = Math.round(Number(v.years))
    const data = []
    for (let y = 0; y <= years; y++) {
      data.push({ year: `Y${y}`, value: Math.round(amount * (1 + r) ** y) })
    }
    const fv = amount * (1 + r) ** years
    return {
      rows: [
        { label: "Future Value", value: fv, format: "currency", primary: true },
        { label: "Total Gain", value: fv - amount, format: "currency", signed: true },
        { label: "Growth Multiple", value: amount > 0 ? fv / amount : 0, format: "number" },
      ],
      chart: {
        type: "area",
        xKey: "year",
        series: [{ key: "value", label: "Value", color: 1 }],
        data,
      },
    }
  },
}

const portfolioAllocation: CalculatorSpec = {
  id: "portfolio-allocation",
  name: "Portfolio Allocation",
  description: "Divides a total amount across assets by weight and shows dollar splits.",
  fields: [
    { key: "total", label: "Total Capital", type: "currency", default: 100000, min: 0, step: 1000 },
    { key: "weights", label: "Asset Weights (%)", type: "series", default: "50, 30, 15, 5", hint: "Comma-separated weights, e.g. 50, 30, 15, 5" },
  ],
  compute: (v) => {
    const total = Number(v.total)
    const weights = parseSeries(v.weights)
    const sum = weights.reduce((a, b) => a + b, 0)
    const rows = weights.map((w, i) => ({
      label: `Asset ${i + 1} (${w}%)`,
      value: sum > 0 ? (total * w) / sum : 0,
      format: "currency" as const,
    }))
    return {
      rows: [
        { label: "Allocated Total", value: total, format: "currency", primary: true },
        ...rows,
        { label: "Weights Sum", value: sum, format: "percent", hint: sum !== 100 ? "Normalized to 100%" : undefined },
      ],
    }
  },
}

const assetAllocation: CalculatorSpec = {
  id: "asset-allocation",
  name: "Asset Allocation (Age-Based)",
  description: "Suggests a stock/bond/cash split based on age and risk appetite.",
  fields: [
    { key: "total", label: "Total Capital", type: "currency", default: 100000, min: 0, step: 1000 },
    { key: "age", label: "Your Age", type: "integer", default: 35, min: 18, max: 90, step: 1, suffix: "yrs" },
    {
      key: "risk",
      label: "Risk Profile",
      type: "select",
      default: "balanced",
      options: [
        { label: "Conservative", value: "conservative" },
        { label: "Balanced", value: "balanced" },
        { label: "Aggressive", value: "aggressive" },
      ],
    },
  ],
  compute: (v) => {
    const total = Number(v.total)
    const age = Number(v.age)
    const risk = String(v.risk)
    const offset = risk === "aggressive" ? 10 : risk === "conservative" ? -10 : 0
    let stocks = Math.max(10, Math.min(90, 110 - age + offset))
    let bonds = Math.max(5, (100 - stocks) * 0.8)
    let cash = Math.max(0, 100 - stocks - bonds)
    const norm = stocks + bonds + cash
    stocks = (stocks / norm) * 100
    bonds = (bonds / norm) * 100
    cash = (cash / norm) * 100
    return {
      rows: [
        { label: "Stocks", value: (total * stocks) / 100, format: "currency", primary: true, hint: `${stocks.toFixed(0)}%` },
        { label: "Bonds", value: (total * bonds) / 100, format: "currency", hint: `${bonds.toFixed(0)}%` },
        { label: "Cash", value: (total * cash) / 100, format: "currency", hint: `${cash.toFixed(0)}%` },
      ],
    }
  },
}

const rebalancing: CalculatorSpec = {
  id: "rebalancing",
  name: "Rebalancing",
  description: "Shows trades needed to restore a target weight for one asset.",
  fields: [
    { key: "portfolio", label: "Total Portfolio Value", type: "currency", default: 100000, min: 0, step: 1000 },
    { key: "current", label: "Current Asset Value", type: "currency", default: 38000, min: 0, step: 500 },
    { key: "target", label: "Target Weight", type: "percent", default: 30, min: 0, max: 100, step: 1, suffix: "%" },
  ],
  compute: (v) => {
    const portfolio = Number(v.portfolio)
    const current = Number(v.current)
    const target = Number(v.target) / 100
    const targetValue = portfolio * target
    const delta = targetValue - current
    const currentWeight = portfolio > 0 ? (current / portfolio) * 100 : 0
    return {
      rows: [
        { label: delta >= 0 ? "Buy" : "Sell", value: Math.abs(delta), format: "currency", primary: true },
        { label: "Target Value", value: targetValue, format: "currency" },
        { label: "Current Weight", value: currentWeight, format: "percent" },
      ],
      note: delta >= 0 ? "Add to this position to reach the target weight." : "Trim this position to reach the target weight.",
    }
  },
}

export const investingCalculators: CalculatorSpec[] = [
  roi,
  cagr,
  futureValue,
  presentValue,
  sip,
  lumpSum,
  portfolioAllocation,
  assetAllocation,
  rebalancing,
]
