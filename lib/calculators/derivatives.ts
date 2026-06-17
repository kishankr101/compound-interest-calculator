import type { CalculatorSpec } from "./types"
import { normCdf, normPdf } from "./math"

function blackScholes(S: number, K: number, t: number, r: number, sigma: number, isCall: boolean) {
  if (t <= 0 || sigma <= 0) {
    const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S)
    return { price: intrinsic, d1: 0, d2: 0 }
  }
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * t) / (sigma * Math.sqrt(t))
  const d2 = d1 - sigma * Math.sqrt(t)
  const price = isCall
    ? S * normCdf(d1) - K * Math.exp(-r * t) * normCdf(d2)
    : K * Math.exp(-r * t) * normCdf(-d2) - S * normCdf(-d1)
  return { price, d1, d2 }
}

const optionsProfit: CalculatorSpec = {
  id: "options-profit",
  name: "Options Profit",
  description: "Estimates profit or loss for a long option at expiry.",
  fields: [
    {
      key: "type",
      label: "Option Type",
      type: "select",
      default: "call",
      options: [
        { label: "Call", value: "call" },
        { label: "Put", value: "put" },
      ],
    },
    { key: "strike", label: "Strike Price", type: "currency", default: 100, min: 0, step: 0.5 },
    { key: "premium", label: "Premium Paid", type: "currency", default: 3, min: 0, step: 0.05 },
    { key: "spot", label: "Price at Expiry", type: "currency", default: 112, min: 0, step: 0.5 },
    { key: "contracts", label: "Contracts", type: "integer", default: 1, min: 1, step: 1, hint: "100 shares each" },
  ],
  compute: (v) => {
    const isCall = String(v.type) === "call"
    const strike = Number(v.strike)
    const spot = Number(v.spot)
    const premium = Number(v.premium)
    const mult = Number(v.contracts) * 100
    const intrinsic = isCall ? Math.max(0, spot - strike) : Math.max(0, strike - spot)
    const pnl = (intrinsic - premium) * mult
    const breakeven = isCall ? strike + premium : strike - premium
    return {
      rows: [
        { label: "Profit / Loss", value: pnl, format: "currency", primary: true, signed: true },
        { label: "Break-even Price", value: breakeven, format: "currency" },
        { label: "Intrinsic Value", value: intrinsic * mult, format: "currency" },
        { label: "Premium Cost", value: premium * mult, format: "currency" },
      ],
    }
  },
}

const greeks: CalculatorSpec = {
  id: "greeks",
  name: "Options Greeks",
  description: "Calculates Delta, Gamma, Theta, Vega and Rho for an option.",
  fields: [
    {
      key: "type",
      label: "Option Type",
      type: "select",
      default: "call",
      options: [
        { label: "Call", value: "call" },
        { label: "Put", value: "put" },
      ],
    },
    { key: "spot", label: "Spot Price", type: "currency", default: 100, min: 0.01, step: 0.5 },
    { key: "strike", label: "Strike Price", type: "currency", default: 100, min: 0.01, step: 0.5 },
    { key: "days", label: "Days to Expiry", type: "integer", default: 30, min: 1, step: 1 },
    { key: "rate", label: "Risk-Free Rate", type: "percent", default: 4, min: 0, step: 0.1, suffix: "%" },
    { key: "vol", label: "Volatility", type: "percent", default: 25, min: 0.1, step: 0.5, suffix: "%" },
  ],
  compute: (v) => {
    const isCall = String(v.type) === "call"
    const S = Number(v.spot)
    const K = Number(v.strike)
    const t = Number(v.days) / 365
    const r = Number(v.rate) / 100
    const sigma = Number(v.vol) / 100
    const { d1, d2 } = blackScholes(S, K, t, r, sigma, isCall)
    const delta = isCall ? normCdf(d1) : normCdf(d1) - 1
    const gamma = normPdf(d1) / (S * sigma * Math.sqrt(t))
    const vega = (S * normPdf(d1) * Math.sqrt(t)) / 100
    const theta =
      ((-S * normPdf(d1) * sigma) / (2 * Math.sqrt(t)) -
        (isCall ? 1 : -1) * r * K * Math.exp(-r * t) * normCdf((isCall ? 1 : -1) * d2)) /
      365
    const rho = ((isCall ? 1 : -1) * K * t * Math.exp(-r * t) * normCdf((isCall ? 1 : -1) * d2)) / 100
    return {
      rows: [
        { label: "Delta", value: delta, format: "number", primary: true },
        { label: "Gamma", value: gamma, format: "number" },
        { label: "Theta (per day)", value: theta, format: "number", signed: true },
        { label: "Vega (per 1% vol)", value: vega, format: "number" },
        { label: "Rho (per 1% rate)", value: rho, format: "number" },
      ],
    }
  },
}

const blackScholesCalc: CalculatorSpec = {
  id: "black-scholes",
  name: "Black-Scholes",
  description: "Prices European call and put options.",
  fields: [
    { key: "spot", label: "Spot Price", type: "currency", default: 100, min: 0.01, step: 0.5 },
    { key: "strike", label: "Strike Price", type: "currency", default: 105, min: 0.01, step: 0.5 },
    { key: "days", label: "Days to Expiry", type: "integer", default: 60, min: 1, step: 1 },
    { key: "rate", label: "Risk-Free Rate", type: "percent", default: 4, min: 0, step: 0.1, suffix: "%" },
    { key: "vol", label: "Volatility", type: "percent", default: 30, min: 0.1, step: 0.5, suffix: "%" },
  ],
  compute: (v) => {
    const S = Number(v.spot)
    const K = Number(v.strike)
    const t = Number(v.days) / 365
    const r = Number(v.rate) / 100
    const sigma = Number(v.vol) / 100
    const call = blackScholes(S, K, t, r, sigma, true).price
    const put = blackScholes(S, K, t, r, sigma, false).price
    return {
      rows: [
        { label: "Call Price", value: call, format: "currency", primary: true },
        { label: "Put Price", value: put, format: "currency" },
      ],
    }
  },
}

const impliedVol: CalculatorSpec = {
  id: "implied-vol",
  name: "Implied Volatility",
  description: "Finds the volatility implied by an option's market price.",
  fields: [
    {
      key: "type",
      label: "Option Type",
      type: "select",
      default: "call",
      options: [
        { label: "Call", value: "call" },
        { label: "Put", value: "put" },
      ],
    },
    { key: "price", label: "Market Price", type: "currency", default: 6.5, min: 0.01, step: 0.05 },
    { key: "spot", label: "Spot Price", type: "currency", default: 100, min: 0.01, step: 0.5 },
    { key: "strike", label: "Strike Price", type: "currency", default: 100, min: 0.01, step: 0.5 },
    { key: "days", label: "Days to Expiry", type: "integer", default: 30, min: 1, step: 1 },
    { key: "rate", label: "Risk-Free Rate", type: "percent", default: 4, min: 0, step: 0.1, suffix: "%" },
  ],
  compute: (v) => {
    const isCall = String(v.type) === "call"
    const target = Number(v.price)
    const S = Number(v.spot)
    const K = Number(v.strike)
    const t = Number(v.days) / 365
    const r = Number(v.rate) / 100
    let low = 0.001
    let high = 5
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2
      const p = blackScholes(S, K, t, r, mid, isCall).price
      if (p > target) high = mid
      else low = mid
    }
    const iv = ((low + high) / 2) * 100
    return {
      rows: [
        { label: "Implied Volatility", value: iv, format: "percent", primary: true },
      ],
    }
  },
}

const futuresMargin: CalculatorSpec = {
  id: "futures-margin",
  name: "Futures Margin",
  description: "Checks the margin required for a futures contract.",
  fields: [
    { key: "price", label: "Contract Price", type: "currency", default: 4500, min: 0, step: 1 },
    { key: "size", label: "Contract Multiplier", type: "number", default: 50, min: 0, step: 1 },
    { key: "contracts", label: "Contracts", type: "integer", default: 1, min: 1, step: 1 },
    { key: "marginPct", label: "Margin %", type: "percent", default: 10, min: 0.1, max: 100, step: 0.1, suffix: "%" },
  ],
  compute: (v) => {
    const notional = Number(v.price) * Number(v.size) * Number(v.contracts)
    const margin = (notional * Number(v.marginPct)) / 100
    return {
      rows: [
        { label: "Initial Margin", value: margin, format: "currency", primary: true },
        { label: "Contract Notional", value: notional, format: "currency" },
        { label: "Leverage", value: margin > 0 ? notional / margin : 0, format: "number" },
      ],
    }
  },
}

const breakEvenOptions: CalculatorSpec = {
  id: "break-even-options",
  name: "Break-even Options",
  description: "Tells the underlying price where an option trade breaks even.",
  fields: [
    {
      key: "type",
      label: "Option Type",
      type: "select",
      default: "call",
      options: [
        { label: "Call", value: "call" },
        { label: "Put", value: "put" },
      ],
    },
    { key: "strike", label: "Strike Price", type: "currency", default: 100, min: 0, step: 0.5 },
    { key: "premium", label: "Premium", type: "currency", default: 4, min: 0, step: 0.05 },
  ],
  compute: (v) => {
    const isCall = String(v.type) === "call"
    const strike = Number(v.strike)
    const premium = Number(v.premium)
    const be = isCall ? strike + premium : strike - premium
    return {
      rows: [
        { label: "Break-even Price", value: be, format: "currency", primary: true },
        { label: "Max Loss", value: premium * 100, format: "currency", hint: "per contract" },
      ],
    }
  },
}

export const derivativesCalculators: CalculatorSpec[] = [
  optionsProfit,
  greeks,
  blackScholesCalc,
  impliedVol,
  futuresMargin,
  breakEvenOptions,
]
