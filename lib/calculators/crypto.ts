import type { CalculatorSpec } from "./types"

const cryptoProfit: CalculatorSpec = {
  id: "crypto-profit",
  name: "Crypto Profit",
  description: "Calculates gain or loss on a crypto trade including fees.",
  fields: [
    { key: "buy", label: "Buy Price", type: "currency", default: 30000, min: 0, step: 1 },
    { key: "sell", label: "Sell Price", type: "currency", default: 42000, min: 0, step: 1 },
    { key: "qty", label: "Quantity", type: "number", default: 0.5, min: 0, step: 0.01 },
    { key: "feePct", label: "Total Fees", type: "percent", default: 0.5, min: 0, step: 0.1, suffix: "%" },
  ],
  compute: (v) => {
    const buy = Number(v.buy)
    const sell = Number(v.sell)
    const qty = Number(v.qty)
    const cost = buy * qty
    const proceeds = sell * qty
    const fees = ((cost + proceeds) * Number(v.feePct)) / 100
    const pnl = proceeds - cost - fees
    return {
      rows: [
        { label: "Profit / Loss", value: pnl, format: "currency", primary: true, signed: true },
        { label: "Return", value: cost > 0 ? (pnl / cost) * 100 : 0, format: "percent", signed: true },
        { label: "Total Fees", value: fees, format: "currency" },
      ],
    }
  },
}

const mining: CalculatorSpec = {
  id: "mining",
  name: "Mining Profitability",
  description: "Estimates net mining income after electricity costs.",
  fields: [
    { key: "dailyReward", label: "Daily Coin Reward", type: "number", default: 0.001, min: 0, step: 0.0001 },
    { key: "price", label: "Coin Price", type: "currency", default: 30000, min: 0, step: 1 },
    { key: "power", label: "Power Draw", type: "number", default: 1500, min: 0, step: 10, suffix: "W" },
    { key: "cost", label: "Electricity Cost", type: "number", default: 0.12, min: 0, step: 0.01, suffix: "$/kWh" },
  ],
  compute: (v) => {
    const revenue = Number(v.dailyReward) * Number(v.price)
    const kwhPerDay = (Number(v.power) / 1000) * 24
    const elecCost = kwhPerDay * Number(v.cost)
    const profit = revenue - elecCost
    return {
      rows: [
        { label: "Daily Profit", value: profit, format: "currency", primary: true, signed: true },
        { label: "Monthly Profit", value: profit * 30, format: "currency", signed: true },
        { label: "Daily Revenue", value: revenue, format: "currency" },
        { label: "Daily Electricity Cost", value: elecCost, format: "currency" },
      ],
    }
  },
}

const staking: CalculatorSpec = {
  id: "staking",
  name: "Staking Rewards",
  description: "Estimates returns from staking crypto at a given APY.",
  fields: [
    { key: "amount", label: "Staked Amount", type: "currency", default: 5000, min: 0, step: 100 },
    { key: "apy", label: "APY", type: "percent", default: 8, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Duration", type: "number", default: 2, min: 0, step: 0.5, suffix: "yrs" },
    { key: "freq", label: "Compounds / Year", type: "integer", default: 365, min: 1, max: 365, step: 1 },
  ],
  compute: (v) => {
    const amount = Number(v.amount)
    const r = Number(v.apy) / 100
    const n = Number(v.freq)
    const t = Number(v.years)
    const final = amount * (1 + r / n) ** (n * t)
    return {
      rows: [
        { label: "Final Value", value: final, format: "currency", primary: true },
        { label: "Total Rewards", value: final - amount, format: "currency", signed: true },
        { label: "Yearly Rewards", value: amount * r, format: "currency" },
      ],
    }
  },
}

export const cryptoCalculators: CalculatorSpec[] = [cryptoProfit, mining, staking]
