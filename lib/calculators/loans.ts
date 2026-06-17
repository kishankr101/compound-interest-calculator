import type { CalculatorSpec } from "./types"

function amortize(principal: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12
  const emi = r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1)
  let balance = principal
  let totalInterest = 0
  const schedule: { year: string; principal: number; interest: number; balance: number }[] = []
  let yearPrincipal = 0
  let yearInterest = 0
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const principalPaid = emi - interest
    balance = Math.max(0, balance - principalPaid)
    totalInterest += interest
    yearPrincipal += principalPaid
    yearInterest += interest
    if (m % 12 === 0 || m === months) {
      schedule.push({
        year: `Y${Math.ceil(m / 12)}`,
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: Math.round(balance),
      })
      yearPrincipal = 0
      yearInterest = 0
    }
  }
  return { emi, totalInterest, schedule }
}

const loanEmi: CalculatorSpec = {
  id: "loan-emi",
  name: "Loan EMI",
  description: "Calculates the fixed monthly payment for a loan.",
  fields: [
    { key: "principal", label: "Loan Amount", type: "currency", default: 25000, min: 0, step: 500 },
    { key: "rate", label: "Annual Interest Rate", type: "percent", default: 8, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Tenure", type: "number", default: 5, min: 0.5, step: 0.5, suffix: "yrs" },
  ],
  compute: (v) => {
    const principal = Number(v.principal)
    const months = Math.round(Number(v.years) * 12)
    const { emi, totalInterest, schedule } = amortize(principal, Number(v.rate), months)
    return {
      rows: [
        { label: "Monthly Payment (EMI)", value: emi, format: "currency", primary: true },
        { label: "Total Interest", value: totalInterest, format: "currency" },
        { label: "Total Payable", value: principal + totalInterest, format: "currency" },
      ],
      chart: {
        type: "bar",
        xKey: "year",
        series: [
          { key: "principal", label: "Principal", color: 1, stacked: true },
          { key: "interest", label: "Interest", color: 3, stacked: true },
        ],
        data: schedule,
      },
    }
  },
}

const amortization: CalculatorSpec = {
  id: "amortization",
  name: "Amortization",
  description: "Shows the principal vs interest breakdown over the loan term.",
  fields: [
    { key: "principal", label: "Loan Amount", type: "currency", default: 200000, min: 0, step: 1000 },
    { key: "rate", label: "Annual Interest Rate", type: "percent", default: 6.5, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Tenure", type: "number", default: 30, min: 1, step: 1, suffix: "yrs" },
  ],
  compute: (v) => {
    const principal = Number(v.principal)
    const months = Math.round(Number(v.years) * 12)
    const { emi, totalInterest, schedule } = amortize(principal, Number(v.rate), months)
    return {
      rows: [
        { label: "Monthly Payment", value: emi, format: "currency", primary: true },
        { label: "Total Interest", value: totalInterest, format: "currency" },
        { label: "Interest % of Loan", value: principal > 0 ? (totalInterest / principal) * 100 : 0, format: "percent" },
      ],
      chart: {
        type: "area",
        xKey: "year",
        series: [{ key: "balance", label: "Remaining Balance", color: 1 }],
        data: schedule,
      },
    }
  },
}

const mortgage: CalculatorSpec = {
  id: "mortgage",
  name: "Mortgage",
  description: "Estimates monthly home loan payments including taxes and insurance.",
  fields: [
    { key: "price", label: "Home Price", type: "currency", default: 350000, min: 0, step: 1000 },
    { key: "down", label: "Down Payment", type: "currency", default: 70000, min: 0, step: 1000 },
    { key: "rate", label: "Interest Rate", type: "percent", default: 6.5, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Term", type: "integer", default: 30, min: 1, step: 1, suffix: "yrs" },
    { key: "tax", label: "Annual Property Tax", type: "currency", default: 3600, min: 0, step: 100 },
    { key: "insurance", label: "Annual Insurance", type: "currency", default: 1200, min: 0, step: 100 },
  ],
  compute: (v) => {
    const loan = Math.max(0, Number(v.price) - Number(v.down))
    const months = Number(v.years) * 12
    const { emi, totalInterest } = amortize(loan, Number(v.rate), months)
    const monthlyExtras = (Number(v.tax) + Number(v.insurance)) / 12
    return {
      rows: [
        { label: "Total Monthly Payment", value: emi + monthlyExtras, format: "currency", primary: true },
        { label: "Principal & Interest", value: emi, format: "currency" },
        { label: "Tax + Insurance", value: monthlyExtras, format: "currency" },
        { label: "Loan Amount", value: loan, format: "currency" },
        { label: "Total Interest", value: totalInterest, format: "currency" },
      ],
    }
  },
}

const interest: CalculatorSpec = {
  id: "interest",
  name: "Simple / Compound Interest",
  description: "Calculates interest earned using simple or compound methods.",
  fields: [
    { key: "principal", label: "Principal", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "rate", label: "Annual Rate", type: "percent", default: 6, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years", type: "number", default: 5, min: 0, step: 0.5, suffix: "yrs" },
    {
      key: "mode",
      label: "Method",
      type: "select",
      default: "compound",
      options: [
        { label: "Compound", value: "compound" },
        { label: "Simple", value: "simple" },
      ],
    },
    { key: "freq", label: "Compounds / Year", type: "integer", default: 12, min: 1, max: 365, step: 1 },
  ],
  compute: (v) => {
    const p = Number(v.principal)
    const r = Number(v.rate) / 100
    const t = Number(v.years)
    let amount: number
    if (String(v.mode) === "simple") {
      amount = p * (1 + r * t)
    } else {
      const n = Number(v.freq)
      amount = p * (1 + r / n) ** (n * t)
    }
    return {
      rows: [
        { label: "Final Amount", value: amount, format: "currency", primary: true },
        { label: "Interest Earned", value: amount - p, format: "currency", signed: true },
      ],
    }
  },
}

const creditCard: CalculatorSpec = {
  id: "credit-card",
  name: "Credit Card Payoff",
  description: "Estimates payoff time and interest for a credit card balance.",
  fields: [
    { key: "balance", label: "Current Balance", type: "currency", default: 5000, min: 0, step: 50 },
    { key: "apr", label: "APR", type: "percent", default: 22, min: 0, step: 0.1, suffix: "%" },
    { key: "payment", label: "Monthly Payment", type: "currency", default: 200, min: 1, step: 10 },
  ],
  compute: (v) => {
    const r = Number(v.apr) / 100 / 12
    let balance = Number(v.balance)
    const payment = Number(v.payment)
    let months = 0
    let totalInterest = 0
    const minViable = balance * r
    if (payment <= minViable) {
      return {
        rows: [
          { label: "Payoff Time", value: "Never at this payment", format: "text", primary: true },
          { label: "Minimum Viable Payment", value: minViable + 1, format: "currency" },
        ],
        note: "Your monthly payment only covers interest. Increase it to pay down the balance.",
      }
    }
    while (balance > 0 && months < 1200) {
      const interest = balance * r
      totalInterest += interest
      balance = balance + interest - payment
      months++
    }
    return {
      rows: [
        { label: "Months to Payoff", value: months, format: "integer", primary: true, hint: `${(months / 12).toFixed(1)} years` },
        { label: "Total Interest", value: totalInterest, format: "currency" },
        { label: "Total Paid", value: Number(v.balance) + totalInterest, format: "currency" },
      ],
    }
  },
}

const refinance: CalculatorSpec = {
  id: "refinance",
  name: "Refinance",
  description: "Checks whether refinancing a loan saves money overall.",
  fields: [
    { key: "balance", label: "Remaining Balance", type: "currency", default: 180000, min: 0, step: 1000 },
    { key: "oldRate", label: "Current Rate", type: "percent", default: 7, min: 0, step: 0.1, suffix: "%" },
    { key: "newRate", label: "New Rate", type: "percent", default: 5.5, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Remaining Term", type: "integer", default: 25, min: 1, step: 1, suffix: "yrs" },
    { key: "fees", label: "Closing Costs", type: "currency", default: 4000, min: 0, step: 100 },
  ],
  compute: (v) => {
    const balance = Number(v.balance)
    const months = Number(v.years) * 12
    const oldP = amortize(balance, Number(v.oldRate), months)
    const newP = amortize(balance, Number(v.newRate), months)
    const monthlySaving = oldP.emi - newP.emi
    const lifetimeSaving = oldP.totalInterest - newP.totalInterest - Number(v.fees)
    const breakeven = monthlySaving > 0 ? Number(v.fees) / monthlySaving : 0
    return {
      rows: [
        { label: "Lifetime Savings", value: lifetimeSaving, format: "currency", primary: true, signed: true },
        { label: "Monthly Savings", value: monthlySaving, format: "currency", signed: true },
        { label: "Break-even", value: breakeven, format: "number", hint: "months to recover costs" },
      ],
      note: lifetimeSaving > 0 ? "Refinancing is likely worthwhile." : "Refinancing may not be worth the costs.",
    }
  },
}

export const loanCalculators: CalculatorSpec[] = [
  loanEmi,
  amortization,
  mortgage,
  interest,
  creditCard,
  refinance,
]
