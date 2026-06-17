import type { CalculatorSpec } from "./types"

const tax: CalculatorSpec = {
  id: "tax",
  name: "Income Tax",
  description: "Estimates tax payable using progressive tax brackets.",
  fields: [
    { key: "income", label: "Annual Income", type: "currency", default: 85000, min: 0, step: 1000 },
    { key: "deductions", label: "Deductions", type: "currency", default: 14000, min: 0, step: 500 },
  ],
  compute: (v) => {
    const taxable = Math.max(0, Number(v.income) - Number(v.deductions))
    // Illustrative progressive brackets.
    const brackets = [
      { upTo: 11000, rate: 0.1 },
      { upTo: 44725, rate: 0.12 },
      { upTo: 95375, rate: 0.22 },
      { upTo: 182100, rate: 0.24 },
      { upTo: 231250, rate: 0.32 },
      { upTo: 578125, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ]
    let tax = 0
    let prev = 0
    for (const b of brackets) {
      if (taxable > prev) {
        tax += (Math.min(taxable, b.upTo) - prev) * b.rate
        prev = b.upTo
      } else break
    }
    return {
      rows: [
        { label: "Estimated Tax", value: tax, format: "currency", primary: true },
        { label: "Taxable Income", value: taxable, format: "currency" },
        { label: "Effective Rate", value: Number(v.income) > 0 ? (tax / Number(v.income)) * 100 : 0, format: "percent" },
        { label: "After-Tax Income", value: Number(v.income) - tax, format: "currency" },
      ],
      note: "Uses illustrative U.S. single-filer brackets for estimation only.",
    }
  },
}

const capitalGains: CalculatorSpec = {
  id: "capital-gains",
  name: "Capital Gains Tax",
  description: "Estimates tax owed on investment profits.",
  fields: [
    { key: "buy", label: "Purchase Price", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "sell", label: "Sale Price", type: "currency", default: 16000, min: 0, step: 100 },
    {
      key: "term",
      label: "Holding Period",
      type: "select",
      default: "long",
      options: [
        { label: "Long-term (>1yr)", value: "long" },
        { label: "Short-term (<1yr)", value: "short" },
      ],
    },
    { key: "rate", label: "Tax Rate", type: "percent", default: 15, min: 0, max: 100, step: 1, suffix: "%" },
  ],
  compute: (v) => {
    const gain = Number(v.sell) - Number(v.buy)
    const taxableGain = Math.max(0, gain)
    const tax = (taxableGain * Number(v.rate)) / 100
    return {
      rows: [
        { label: "Capital Gains Tax", value: tax, format: "currency", primary: true },
        { label: "Gross Gain", value: gain, format: "currency", signed: true },
        { label: "Net Profit After Tax", value: gain - tax, format: "currency", signed: true },
      ],
    }
  },
}

const inflation: CalculatorSpec = {
  id: "inflation",
  name: "Inflation",
  description: "Shows how purchasing power changes over time.",
  fields: [
    { key: "amount", label: "Current Amount", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "rate", label: "Inflation Rate", type: "percent", default: 3, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years", type: "integer", default: 20, min: 1, step: 1, suffix: "yrs" },
  ],
  compute: (v) => {
    const amount = Number(v.amount)
    const r = Number(v.rate) / 100
    const years = Number(v.years)
    const futureCost = amount * (1 + r) ** years
    const futureValue = amount / (1 + r) ** years
    const data = []
    for (let y = 0; y <= years; y++) {
      data.push({ year: `Y${y}`, power: Math.round(amount / (1 + r) ** y) })
    }
    return {
      rows: [
        { label: "Future Purchasing Power", value: futureValue, format: "currency", primary: true, hint: `of today's ${amount}` },
        { label: "Future Cost of Today's Goods", value: futureCost, format: "currency" },
        { label: "Value Lost", value: amount - futureValue, format: "currency" },
      ],
      chart: {
        type: "area",
        xKey: "year",
        series: [{ key: "power", label: "Purchasing Power", color: 3 }],
        data,
      },
    }
  },
}

const retirement: CalculatorSpec = {
  id: "retirement",
  name: "Retirement",
  description: "Estimates savings at retirement and whether you're on track.",
  fields: [
    { key: "current", label: "Current Savings", type: "currency", default: 50000, min: 0, step: 1000 },
    { key: "monthly", label: "Monthly Contribution", type: "currency", default: 800, min: 0, step: 50 },
    { key: "rate", label: "Annual Return", type: "percent", default: 7, min: 0, step: 0.1, suffix: "%" },
    { key: "currentAge", label: "Current Age", type: "integer", default: 30, min: 18, max: 80, step: 1 },
    { key: "retireAge", label: "Retirement Age", type: "integer", default: 65, min: 30, max: 90, step: 1 },
  ],
  compute: (v) => {
    const years = Math.max(0, Number(v.retireAge) - Number(v.currentAge))
    const r = Number(v.rate) / 100 / 12
    const months = years * 12
    let balance = Number(v.current)
    const monthly = Number(v.monthly)
    const data = []
    let contributed = Number(v.current)
    for (let m = 1; m <= months; m++) {
      balance = balance * (1 + r) + monthly
      contributed += monthly
      if (m % 12 === 0) data.push({ year: `Age ${Number(v.currentAge) + m / 12}`, invested: Math.round(contributed), value: Math.round(balance) })
    }
    return {
      rows: [
        { label: "Savings at Retirement", value: balance, format: "currency", primary: true },
        { label: "Total Contributed", value: contributed, format: "currency" },
        { label: "Investment Growth", value: balance - contributed, format: "currency", signed: true },
        { label: "Est. Monthly Income (4% rule)", value: (balance * 0.04) / 12, format: "currency" },
      ],
      chart: {
        type: "area",
        xKey: "year",
        series: [
          { key: "invested", label: "Contributed", color: 2, stacked: true },
          { key: "value", label: "Total Value", color: 1 },
        ],
        data,
      },
    }
  },
}

const savingsGoal: CalculatorSpec = {
  id: "savings-goal",
  name: "Savings Goal",
  description: "Calculates the monthly saving needed to reach a target.",
  fields: [
    { key: "goal", label: "Target Amount", type: "currency", default: 30000, min: 0, step: 500 },
    { key: "current", label: "Current Savings", type: "currency", default: 5000, min: 0, step: 100 },
    { key: "rate", label: "Annual Return", type: "percent", default: 4, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Time Frame", type: "number", default: 3, min: 0.5, step: 0.5, suffix: "yrs" },
  ],
  compute: (v) => {
    const goal = Number(v.goal)
    const current = Number(v.current)
    const r = Number(v.rate) / 100 / 12
    const months = Math.round(Number(v.years) * 12)
    const futureCurrent = current * (1 + r) ** months
    const needed = goal - futureCurrent
    const monthly = r === 0 ? needed / months : (needed * r) / ((1 + r) ** months - 1)
    return {
      rows: [
        { label: "Monthly Saving Needed", value: Math.max(0, monthly), format: "currency", primary: true },
        { label: "Growth of Current Savings", value: futureCurrent, format: "currency" },
        { label: "Total to Save", value: Math.max(0, needed), format: "currency" },
      ],
      note: needed <= 0 ? "Your current savings already reach the goal." : undefined,
    }
  },
}

const emergencyFund: CalculatorSpec = {
  id: "emergency-fund",
  name: "Emergency Fund",
  description: "Estimates the safety savings you should keep on hand.",
  fields: [
    { key: "expenses", label: "Monthly Expenses", type: "currency", default: 3000, min: 0, step: 100 },
    { key: "months", label: "Months of Coverage", type: "integer", default: 6, min: 1, max: 24, step: 1 },
    { key: "saved", label: "Already Saved", type: "currency", default: 5000, min: 0, step: 100 },
  ],
  compute: (v) => {
    const target = Number(v.expenses) * Number(v.months)
    const gap = Math.max(0, target - Number(v.saved))
    return {
      rows: [
        { label: "Recommended Fund", value: target, format: "currency", primary: true },
        { label: "Remaining to Save", value: gap, format: "currency" },
        { label: "Coverage Now", value: Number(v.expenses) > 0 ? Number(v.saved) / Number(v.expenses) : 0, format: "number", hint: "months covered" },
      ],
    }
  },
}

export const taxCalculators: CalculatorSpec[] = [
  tax,
  capitalGains,
  inflation,
  retirement,
  savingsGoal,
  emergencyFund,
]
