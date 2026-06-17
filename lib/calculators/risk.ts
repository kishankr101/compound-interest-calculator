import type { CalculatorSpec } from "./types"
import { parseSeries, mean, stdDev, returnsFromPrices, normInv } from "./math"

const valueAtRisk: CalculatorSpec = {
  id: "var",
  name: "Value at Risk (VaR)",
  description: "Estimates the potential worst-case loss at a confidence level.",
  fields: [
    { key: "value", label: "Portfolio Value", type: "currency", default: 100000, min: 0, step: 1000 },
    { key: "vol", label: "Daily Volatility", type: "percent", default: 2, min: 0, step: 0.1, suffix: "%" },
    {
      key: "conf",
      label: "Confidence",
      type: "select",
      default: "0.95",
      options: [
        { label: "90%", value: "0.90" },
        { label: "95%", value: "0.95" },
        { label: "99%", value: "0.99" },
      ],
    },
    { key: "horizon", label: "Horizon", type: "integer", default: 1, min: 1, step: 1, suffix: "days" },
  ],
  compute: (v) => {
    const value = Number(v.value)
    const vol = Number(v.vol) / 100
    const z = normInv(Number(v.conf))
    const horizon = Number(v.horizon)
    const dailyVar = value * vol * z
    const var_ = dailyVar * Math.sqrt(horizon)
    return {
      rows: [
        { label: "Value at Risk", value: var_, format: "currency", primary: true, hint: `${(Number(v.conf) * 100).toFixed(0)}% confidence` },
        { label: "1-Day VaR", value: dailyVar, format: "currency" },
        { label: "VaR % of Portfolio", value: value > 0 ? (var_ / value) * 100 : 0, format: "percent" },
      ],
      note: "Parametric (variance-covariance) VaR assuming normally distributed returns.",
    }
  },
}

const volatility: CalculatorSpec = {
  id: "volatility",
  name: "Volatility",
  description: "Measures the standard deviation of a series of returns or prices.",
  fields: [
    { key: "data", label: "Price / Return Series", type: "series", default: "100, 102, 98, 105, 103, 108", hint: "Enter prices (returns derived automatically)" },
    {
      key: "mode",
      label: "Input Type",
      type: "select",
      default: "prices",
      options: [
        { label: "Prices", value: "prices" },
        { label: "Returns (%)", value: "returns" },
      ],
    },
    { key: "periods", label: "Periods / Year", type: "integer", default: 252, min: 1, step: 1, hint: "252 daily, 12 monthly" },
  ],
  compute: (v) => {
    const raw = parseSeries(v.data)
    const rets = String(v.mode) === "prices" ? returnsFromPrices(raw) : raw.map((r) => r / 100)
    const periodVol = stdDev(rets) * 100
    const annualVol = stdDev(rets) * Math.sqrt(Number(v.periods)) * 100
    return {
      rows: [
        { label: "Annualized Volatility", value: annualVol, format: "percent", primary: true },
        { label: "Per-Period Volatility", value: periodVol, format: "percent" },
        { label: "Mean Return", value: mean(rets) * 100, format: "percent", signed: true },
      ],
    }
  },
}

const drawdown: CalculatorSpec = {
  id: "drawdown",
  name: "Maximum Drawdown",
  description: "Shows the largest peak-to-trough decline in a value series.",
  fields: [
    { key: "data", label: "Equity / Price Series", type: "series", default: "100, 120, 90, 110, 80, 130", hint: "Comma-separated values over time" },
  ],
  compute: (v) => {
    const series = parseSeries(v.data)
    let peak = series[0] ?? 0
    let maxDd = 0
    let troughVal = peak
    let peakVal = peak
    const data = series.map((val, i) => {
      if (val > peak) peak = val
      const dd = peak > 0 ? (val - peak) / peak : 0
      if (dd < maxDd) {
        maxDd = dd
        troughVal = val
        peakVal = peak
      }
      return { point: `${i + 1}`, drawdown: Number((dd * 100).toFixed(2)) }
    })
    return {
      rows: [
        { label: "Max Drawdown", value: maxDd * 100, format: "percent", primary: true, signed: true },
        { label: "Peak Value", value: peakVal, format: "currency" },
        { label: "Trough Value", value: troughVal, format: "currency" },
      ],
      chart: {
        type: "area",
        xKey: "point",
        series: [{ key: "drawdown", label: "Drawdown %", color: 3 }],
        data,
      },
    }
  },
}

const beta: CalculatorSpec = {
  id: "beta",
  name: "Beta",
  description: "Measures how much an asset moves relative to the market.",
  fields: [
    { key: "asset", label: "Asset Returns (%)", type: "series", default: "1.2, -0.8, 2.1, 0.5, -1.5", hint: "Periodic returns" },
    { key: "market", label: "Market Returns (%)", type: "series", default: "1.0, -0.5, 1.5, 0.4, -1.0", hint: "Matching periods" },
  ],
  compute: (v) => {
    const a = parseSeries(v.asset)
    const m = parseSeries(v.market)
    const n = Math.min(a.length, m.length)
    const am = mean(a.slice(0, n))
    const mm = mean(m.slice(0, n))
    let cov = 0
    let varM = 0
    for (let i = 0; i < n; i++) {
      cov += (a[i] - am) * (m[i] - mm)
      varM += (m[i] - mm) ** 2
    }
    const beta = varM > 0 ? cov / varM : 0
    return {
      rows: [
        { label: "Beta", value: beta, format: "number", primary: true },
        { label: "Interpretation", value: beta > 1 ? "More volatile than market" : beta < 1 ? "Less volatile than market" : "Moves with market", format: "text" },
      ],
    }
  },
}

const sharpe: CalculatorSpec = {
  id: "sharpe",
  name: "Sharpe Ratio",
  description: "Measures excess return per unit of total risk.",
  fields: [
    { key: "returns", label: "Periodic Returns (%)", type: "series", default: "1.2, 0.8, -0.5, 1.5, 0.9, -0.3", hint: "Per-period returns" },
    { key: "rf", label: "Risk-Free Rate", type: "percent", default: 2, min: 0, step: 0.1, suffix: "%" },
    { key: "periods", label: "Periods / Year", type: "integer", default: 12, min: 1, step: 1 },
  ],
  compute: (v) => {
    const rets = parseSeries(v.returns).map((r) => r / 100)
    const periods = Number(v.periods)
    const rfPer = Number(v.rf) / 100 / periods
    const excess = rets.map((r) => r - rfPer)
    const sd = stdDev(rets)
    const sharpe = sd > 0 ? (mean(excess) / sd) * Math.sqrt(periods) : 0
    return {
      rows: [
        { label: "Sharpe Ratio", value: sharpe, format: "number", primary: true },
        { label: "Annualized Return", value: mean(rets) * periods * 100, format: "percent", signed: true },
        { label: "Annualized Volatility", value: sd * Math.sqrt(periods) * 100, format: "percent" },
      ],
    }
  },
}

const sortino: CalculatorSpec = {
  id: "sortino",
  name: "Sortino Ratio",
  description: "Like Sharpe, but penalizes only downside volatility.",
  fields: [
    { key: "returns", label: "Periodic Returns (%)", type: "series", default: "1.2, 0.8, -0.5, 1.5, 0.9, -0.3", hint: "Per-period returns" },
    { key: "rf", label: "Risk-Free Rate", type: "percent", default: 2, min: 0, step: 0.1, suffix: "%" },
    { key: "periods", label: "Periods / Year", type: "integer", default: 12, min: 1, step: 1 },
  ],
  compute: (v) => {
    const rets = parseSeries(v.returns).map((r) => r / 100)
    const periods = Number(v.periods)
    const rfPer = Number(v.rf) / 100 / periods
    const excess = rets.map((r) => r - rfPer)
    const downside = rets.filter((r) => r < rfPer).map((r) => (r - rfPer) ** 2)
    const dd = downside.length > 0 ? Math.sqrt(downside.reduce((a, b) => a + b, 0) / downside.length) : 0
    const sortino = dd > 0 ? (mean(excess) / dd) * Math.sqrt(periods) : 0
    return {
      rows: [
        { label: "Sortino Ratio", value: sortino, format: "number", primary: true },
        { label: "Downside Deviation", value: dd * Math.sqrt(periods) * 100, format: "percent" },
        { label: "Annualized Return", value: mean(rets) * periods * 100, format: "percent", signed: true },
      ],
    }
  },
}

const maxExposure: CalculatorSpec = {
  id: "max-exposure",
  name: "Maximum Exposure",
  description: "Limits how much capital should be at risk across open trades.",
  fields: [
    { key: "account", label: "Account Size", type: "currency", default: 50000, min: 0, step: 100 },
    { key: "maxRiskPct", label: "Max Portfolio Risk", type: "percent", default: 6, min: 0, max: 100, step: 0.5, suffix: "%" },
    { key: "perTradePct", label: "Risk Per Trade", type: "percent", default: 1.5, min: 0.1, max: 100, step: 0.1, suffix: "%" },
  ],
  compute: (v) => {
    const account = Number(v.account)
    const maxRisk = (account * Number(v.maxRiskPct)) / 100
    const perTrade = (account * Number(v.perTradePct)) / 100
    const maxTrades = perTrade > 0 ? Math.floor(maxRisk / perTrade) : 0
    return {
      rows: [
        { label: "Max Capital At Risk", value: maxRisk, format: "currency", primary: true },
        { label: "Risk Per Trade", value: perTrade, format: "currency" },
        { label: "Max Concurrent Trades", value: maxTrades, format: "integer" },
      ],
    }
  },
}

export const riskCalculators: CalculatorSpec[] = [
  valueAtRisk,
  volatility,
  drawdown,
  beta,
  sharpe,
  sortino,
  maxExposure,
]
