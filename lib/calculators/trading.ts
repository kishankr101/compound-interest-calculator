import type { CalculatorSpec } from "./types"
import { parseSeries } from "./math"

const profitLoss: CalculatorSpec = {
  id: "profit-loss",
  name: "Profit & Loss",
  description: "Calculates the gain or loss on a trade including position direction.",
  fields: [
    { key: "entry", label: "Entry Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "exit", label: "Exit Price", type: "currency", default: 115, min: 0, step: 0.01 },
    { key: "qty", label: "Quantity", type: "number", default: 100, min: 0, step: 1 },
    {
      key: "side",
      label: "Direction",
      type: "select",
      default: "long",
      options: [
        { label: "Long", value: "long" },
        { label: "Short", value: "short" },
      ],
    },
  ],
  compute: (v) => {
    const entry = Number(v.entry)
    const exit = Number(v.exit)
    const qty = Number(v.qty)
    const dir = String(v.side) === "short" ? -1 : 1
    const pnl = (exit - entry) * qty * dir
    const cost = entry * qty
    const pct = cost !== 0 ? (pnl / cost) * 100 : 0
    return {
      rows: [
        { label: "Profit / Loss", value: pnl, format: "currency", primary: true, signed: true },
        { label: "Return", value: pct, format: "percent", signed: true },
        { label: "Position Cost", value: cost, format: "currency" },
      ],
    }
  },
}

const positionSize: CalculatorSpec = {
  id: "position-size",
  name: "Position Size",
  description: "Determines how many shares to buy based on risk per trade.",
  fields: [
    { key: "account", label: "Account Size", type: "currency", default: 50000, min: 0, step: 100 },
    { key: "riskPct", label: "Risk Per Trade", type: "percent", default: 1, min: 0, max: 100, step: 0.1, suffix: "%" },
    { key: "entry", label: "Entry Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "stop", label: "Stop Loss Price", type: "currency", default: 95, min: 0, step: 0.01 },
  ],
  compute: (v) => {
    const account = Number(v.account)
    const riskAmt = (account * Number(v.riskPct)) / 100
    const perShareRisk = Math.abs(Number(v.entry) - Number(v.stop))
    const shares = perShareRisk > 0 ? Math.floor(riskAmt / perShareRisk) : 0
    const capital = shares * Number(v.entry)
    return {
      rows: [
        { label: "Shares / Units", value: shares, format: "integer", primary: true },
        { label: "Capital Required", value: capital, format: "currency" },
        { label: "Risk Amount", value: riskAmt, format: "currency" },
        { label: "Risk Per Share", value: perShareRisk, format: "currency" },
      ],
    }
  },
}

const riskReward: CalculatorSpec = {
  id: "risk-reward",
  name: "Risk-Reward",
  description: "Compares potential loss versus potential profit on a trade.",
  fields: [
    { key: "entry", label: "Entry Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "stop", label: "Stop Loss", type: "currency", default: 95, min: 0, step: 0.01 },
    { key: "target", label: "Take Profit", type: "currency", default: 115, min: 0, step: 0.01 },
  ],
  compute: (v) => {
    const entry = Number(v.entry)
    const risk = Math.abs(entry - Number(v.stop))
    const reward = Math.abs(Number(v.target) - entry)
    const ratio = risk > 0 ? reward / risk : 0
    const breakeven = ratio > 0 ? (1 / (1 + ratio)) * 100 : 0
    return {
      rows: [
        { label: "Risk : Reward", value: `1 : ${ratio.toFixed(2)}`, format: "text", primary: true },
        { label: "Reward Per Unit", value: reward, format: "currency" },
        { label: "Risk Per Unit", value: risk, format: "currency" },
        { label: "Breakeven Win Rate", value: breakeven, format: "percent" },
      ],
    }
  },
}

const stopLoss: CalculatorSpec = {
  id: "stop-loss",
  name: "Stop Loss",
  description: "Finds the stop-loss price for a chosen risk percentage.",
  fields: [
    { key: "entry", label: "Entry Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "riskPct", label: "Risk %", type: "percent", default: 5, min: 0, max: 100, step: 0.1, suffix: "%" },
    {
      key: "side",
      label: "Direction",
      type: "select",
      default: "long",
      options: [
        { label: "Long", value: "long" },
        { label: "Short", value: "short" },
      ],
    },
  ],
  compute: (v) => {
    const entry = Number(v.entry)
    const pct = Number(v.riskPct) / 100
    const long = String(v.side) === "long"
    const stop = long ? entry * (1 - pct) : entry * (1 + pct)
    return {
      rows: [
        { label: "Stop Loss Price", value: stop, format: "currency", primary: true },
        { label: "Price Move", value: Math.abs(entry - stop), format: "currency" },
      ],
    }
  },
}

const takeProfit: CalculatorSpec = {
  id: "take-profit",
  name: "Take Profit",
  description: "Finds the target exit price for a chosen reward percentage.",
  fields: [
    { key: "entry", label: "Entry Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "rewardPct", label: "Target %", type: "percent", default: 15, min: 0, step: 0.1, suffix: "%" },
    {
      key: "side",
      label: "Direction",
      type: "select",
      default: "long",
      options: [
        { label: "Long", value: "long" },
        { label: "Short", value: "short" },
      ],
    },
  ],
  compute: (v) => {
    const entry = Number(v.entry)
    const pct = Number(v.rewardPct) / 100
    const long = String(v.side) === "long"
    const target = long ? entry * (1 + pct) : entry * (1 - pct)
    return {
      rows: [
        { label: "Take Profit Price", value: target, format: "currency", primary: true },
        { label: "Price Move", value: Math.abs(target - entry), format: "currency" },
      ],
    }
  },
}

const averagePrice: CalculatorSpec = {
  id: "average-price",
  name: "Average Price",
  description: "Calculates the average buy price after multiple entries.",
  fields: [
    { key: "prices", label: "Entry Prices", type: "series", default: "100, 95, 90", hint: "Comma-separated prices" },
    { key: "qtys", label: "Quantities", type: "series", default: "10, 20, 30", hint: "One quantity per price" },
  ],
  compute: (v) => {
    const prices = parseSeries(v.prices)
    const qtys = parseSeries(v.qtys)
    let cost = 0
    let units = 0
    prices.forEach((p, i) => {
      const q = qtys[i] ?? 0
      cost += p * q
      units += q
    })
    const avg = units > 0 ? cost / units : 0
    return {
      rows: [
        { label: "Average Price", value: avg, format: "currency", primary: true },
        { label: "Total Units", value: units, format: "number" },
        { label: "Total Cost", value: cost, format: "currency" },
      ],
    }
  },
}

const breakEvenTrade: CalculatorSpec = {
  id: "break-even-trade",
  name: "Break-even",
  description: "Tells the price where a trade becomes profitable after fees.",
  fields: [
    { key: "entry", label: "Entry Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "qty", label: "Quantity", type: "number", default: 100, min: 0, step: 1 },
    { key: "fees", label: "Total Fees", type: "currency", default: 20, min: 0, step: 1 },
  ],
  compute: (v) => {
    const entry = Number(v.entry)
    const qty = Number(v.qty)
    const fees = Number(v.fees)
    const be = qty > 0 ? entry + fees / qty : entry
    return {
      rows: [
        { label: "Break-even Price", value: be, format: "currency", primary: true },
        { label: "Fee Per Unit", value: qty > 0 ? fees / qty : 0, format: "currency" },
      ],
    }
  },
}

const margin: CalculatorSpec = {
  id: "margin",
  name: "Margin",
  description: "Checks the capital required for a leveraged position.",
  fields: [
    { key: "price", label: "Asset Price", type: "currency", default: 100, min: 0, step: 0.01 },
    { key: "qty", label: "Quantity", type: "number", default: 100, min: 0, step: 1 },
    { key: "marginPct", label: "Margin Requirement", type: "percent", default: 20, min: 0.1, max: 100, step: 0.1, suffix: "%" },
  ],
  compute: (v) => {
    const notional = Number(v.price) * Number(v.qty)
    const required = (notional * Number(v.marginPct)) / 100
    return {
      rows: [
        { label: "Required Margin", value: required, format: "currency", primary: true },
        { label: "Position Notional", value: notional, format: "currency" },
        { label: "Effective Leverage", value: required > 0 ? notional / required : 0, format: "number" },
      ],
    }
  },
}

const leverage: CalculatorSpec = {
  id: "leverage",
  name: "Leverage",
  description: "Shows market exposure gained from borrowed funds.",
  fields: [
    { key: "equity", label: "Your Capital", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "leverage", label: "Leverage", type: "number", default: 5, min: 1, step: 0.5, suffix: "x" },
  ],
  compute: (v) => {
    const equity = Number(v.equity)
    const lev = Number(v.leverage)
    const exposure = equity * lev
    return {
      rows: [
        { label: "Total Exposure", value: exposure, format: "currency", primary: true },
        { label: "Borrowed Funds", value: exposure - equity, format: "currency" },
        { label: "Liquidation Move", value: lev > 0 ? 100 / lev : 0, format: "percent", hint: "Approx. adverse move to wipe equity" },
      ],
    }
  },
}

const pip: CalculatorSpec = {
  id: "pip",
  name: "Pip Value (Forex)",
  description: "Measures the value of a one-pip move for a forex position.",
  fields: [
    { key: "lots", label: "Lots", type: "number", default: 1, min: 0, step: 0.01, hint: "1 standard lot = 100,000 units" },
    { key: "pipSize", label: "Pip Size", type: "number", default: 0.0001, min: 0, step: 0.0001 },
    { key: "rate", label: "Quote Rate", type: "number", default: 1, min: 0, step: 0.0001, hint: "Quote currency to account currency" },
  ],
  compute: (v) => {
    const units = Number(v.lots) * 100000
    const pipValue = units * Number(v.pipSize) * Number(v.rate)
    return {
      rows: [
        { label: "Pip Value", value: pipValue, format: "currency", primary: true },
        { label: "Position Units", value: units, format: "integer" },
        { label: "Value Per 10 Pips", value: pipValue * 10, format: "currency" },
      ],
    }
  },
}

const lotSize: CalculatorSpec = {
  id: "lot-size",
  name: "Lot Size",
  description: "Determines forex lot size from risk and stop distance in pips.",
  fields: [
    { key: "account", label: "Account Size", type: "currency", default: 10000, min: 0, step: 100 },
    { key: "riskPct", label: "Risk %", type: "percent", default: 1, min: 0, max: 100, step: 0.1, suffix: "%" },
    { key: "stopPips", label: "Stop Loss", type: "number", default: 50, min: 1, step: 1, suffix: "pips" },
    { key: "pipValue", label: "Pip Value / Lot", type: "currency", default: 10, min: 0.01, step: 0.01 },
  ],
  compute: (v) => {
    const riskAmt = (Number(v.account) * Number(v.riskPct)) / 100
    const perLotRisk = Number(v.stopPips) * Number(v.pipValue)
    const lots = perLotRisk > 0 ? riskAmt / perLotRisk : 0
    return {
      rows: [
        { label: "Lot Size", value: lots, format: "number", primary: true },
        { label: "Units", value: Math.round(lots * 100000), format: "integer" },
        { label: "Risk Amount", value: riskAmt, format: "currency" },
      ],
    }
  },
}

export const tradingCalculators: CalculatorSpec[] = [
  profitLoss,
  positionSize,
  riskReward,
  stopLoss,
  takeProfit,
  averagePrice,
  breakEvenTrade,
  margin,
  leverage,
  pip,
  lotSize,
]
