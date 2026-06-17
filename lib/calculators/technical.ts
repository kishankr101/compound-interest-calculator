import type { CalculatorSpec } from "./types"
import { parseSeries, mean, stdDev } from "./math"

const movingAverage: CalculatorSpec = {
  id: "moving-average",
  name: "Moving Average",
  description: "Smooths a price series with a simple moving average.",
  fields: [
    { key: "prices", label: "Price Series", type: "series", default: "10, 12, 13, 12, 15, 16, 14, 18, 19, 17", hint: "Comma-separated closing prices" },
    { key: "period", label: "Period", type: "integer", default: 3, min: 1, step: 1 },
  ],
  compute: (v) => {
    const prices = parseSeries(v.prices)
    const period = Number(v.period)
    const data = prices.map((p, i) => {
      let sma: number | null = null
      if (i >= period - 1) {
        const window = prices.slice(i - period + 1, i + 1)
        sma = mean(window)
      }
      return { point: `${i + 1}`, price: p, sma: sma !== null ? Number(sma.toFixed(2)) : (null as unknown as number) }
    })
    const latest = data[data.length - 1]?.sma
    return {
      rows: [
        { label: `Latest ${period}-Period SMA`, value: latest ?? 0, format: "number", primary: true },
        { label: "Current Price", value: prices[prices.length - 1] ?? 0, format: "number" },
        { label: "Signal", value: (prices[prices.length - 1] ?? 0) > (latest ?? 0) ? "Price above MA (bullish)" : "Price below MA (bearish)", format: "text" },
      ],
      chart: {
        type: "line",
        xKey: "point",
        series: [
          { key: "price", label: "Price", color: 2 },
          { key: "sma", label: `SMA(${period})`, color: 1 },
        ],
        data,
      },
    }
  },
}

const rsi: CalculatorSpec = {
  id: "rsi",
  name: "RSI",
  description: "Measures momentum to flag overbought or oversold conditions.",
  fields: [
    { key: "prices", label: "Price Series", type: "series", default: "44, 44.3, 44.1, 43.6, 44.3, 44.8, 45.1, 45.4, 45.1, 45.5, 46.1, 47.2, 46.6, 46.8", hint: "Need at least period + 1 prices" },
    { key: "period", label: "Period", type: "integer", default: 14, min: 2, step: 1 },
  ],
  compute: (v) => {
    const prices = parseSeries(v.prices)
    const period = Number(v.period)
    let gains = 0
    let losses = 0
    const n = Math.min(period, prices.length - 1)
    for (let i = 1; i <= n; i++) {
      const change = prices[i] - prices[i - 1]
      if (change >= 0) gains += change
      else losses -= change
    }
    let avgGain = gains / n
    let avgLoss = losses / n
    for (let i = n + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period
      avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsiVal = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs)
    return {
      rows: [
        { label: "RSI", value: rsiVal, format: "number", primary: true },
        { label: "Condition", value: rsiVal >= 70 ? "Overbought" : rsiVal <= 30 ? "Oversold" : "Neutral", format: "text" },
      ],
    }
  },
}

const macd: CalculatorSpec = {
  id: "macd",
  name: "MACD",
  description: "Identifies trend and momentum from moving average convergence.",
  fields: [
    { key: "prices", label: "Price Series", type: "series", default: "22, 22.5, 23, 23.2, 23.8, 24, 24.3, 24.1, 24.6, 25, 25.4, 25.1, 25.8, 26.2, 26, 26.5, 27, 27.3, 27.1, 27.6, 28, 28.4, 28.1, 28.8, 29, 29.4", hint: "More prices = more reliable" },
    { key: "fast", label: "Fast EMA", type: "integer", default: 12, min: 1, step: 1 },
    { key: "slow", label: "Slow EMA", type: "integer", default: 26, min: 2, step: 1 },
    { key: "signal", label: "Signal EMA", type: "integer", default: 9, min: 1, step: 1 },
  ],
  compute: (v) => {
    const prices = parseSeries(v.prices)
    const ema = (data: number[], period: number) => {
      const k = 2 / (period + 1)
      const out: number[] = []
      let prev = data[0]
      data.forEach((p, i) => {
        prev = i === 0 ? p : p * k + prev * (1 - k)
        out.push(prev)
      })
      return out
    }
    const fast = ema(prices, Number(v.fast))
    const slow = ema(prices, Number(v.slow))
    const macdLine = prices.map((_, i) => fast[i] - slow[i])
    const signalLine = ema(macdLine, Number(v.signal))
    const lastMacd = macdLine[macdLine.length - 1]
    const lastSignal = signalLine[signalLine.length - 1]
    const hist = lastMacd - lastSignal
    const data = prices.map((_, i) => ({
      point: `${i + 1}`,
      macd: Number(macdLine[i].toFixed(3)),
      signal: Number(signalLine[i].toFixed(3)),
    }))
    return {
      rows: [
        { label: "MACD Line", value: lastMacd, format: "number", primary: true },
        { label: "Signal Line", value: lastSignal, format: "number" },
        { label: "Histogram", value: hist, format: "number", signed: true },
        { label: "Signal", value: hist >= 0 ? "Bullish crossover" : "Bearish crossover", format: "text" },
      ],
      chart: {
        type: "line",
        xKey: "point",
        series: [
          { key: "macd", label: "MACD", color: 1 },
          { key: "signal", label: "Signal", color: 3 },
        ],
        data,
      },
    }
  },
}

const bollinger: CalculatorSpec = {
  id: "bollinger",
  name: "Bollinger Bands",
  description: "Measures volatility and price range around a moving average.",
  fields: [
    { key: "prices", label: "Price Series", type: "series", default: "20, 21, 22, 21, 23, 24, 23, 25, 26, 24, 27, 28, 26, 29, 30", hint: "Comma-separated prices" },
    { key: "period", label: "Period", type: "integer", default: 5, min: 2, step: 1 },
    { key: "mult", label: "Std Dev Multiplier", type: "number", default: 2, min: 0.1, step: 0.1 },
  ],
  compute: (v) => {
    const prices = parseSeries(v.prices)
    const period = Number(v.period)
    const mult = Number(v.mult)
    const data = prices.map((p, i) => {
      if (i < period - 1) return { point: `${i + 1}`, price: p, upper: null as unknown as number, lower: null as unknown as number, mid: null as unknown as number }
      const window = prices.slice(i - period + 1, i + 1)
      const m = mean(window)
      const sd = stdDev(window, false)
      return {
        point: `${i + 1}`,
        price: p,
        upper: Number((m + mult * sd).toFixed(2)),
        lower: Number((m - mult * sd).toFixed(2)),
        mid: Number(m.toFixed(2)),
      }
    })
    const last = data[data.length - 1]
    return {
      rows: [
        { label: "Upper Band", value: last.upper ?? 0, format: "number", primary: true },
        { label: "Middle Band (SMA)", value: last.mid ?? 0, format: "number" },
        { label: "Lower Band", value: last.lower ?? 0, format: "number" },
        { label: "Current Price", value: prices[prices.length - 1] ?? 0, format: "number" },
      ],
      chart: {
        type: "line",
        xKey: "point",
        series: [
          { key: "upper", label: "Upper", color: 3 },
          { key: "price", label: "Price", color: 1 },
          { key: "lower", label: "Lower", color: 2 },
        ],
        data,
      },
    }
  },
}

const atr: CalculatorSpec = {
  id: "atr",
  name: "ATR (Average True Range)",
  description: "Shows average true range for volatility and stop-loss planning.",
  fields: [
    { key: "highs", label: "High Prices", type: "series", default: "48, 49, 50, 49.5, 51, 52", hint: "Period highs" },
    { key: "lows", label: "Low Prices", type: "series", default: "47, 47.5, 48.5, 48, 49.5, 50.5", hint: "Period lows" },
    { key: "closes", label: "Close Prices", type: "series", default: "47.5, 48.5, 49, 49, 50.5, 51.5", hint: "Period closes" },
    { key: "period", label: "Period", type: "integer", default: 5, min: 1, step: 1 },
  ],
  compute: (v) => {
    const highs = parseSeries(v.highs)
    const lows = parseSeries(v.lows)
    const closes = parseSeries(v.closes)
    const n = Math.min(highs.length, lows.length, closes.length)
    const trs: number[] = []
    for (let i = 0; i < n; i++) {
      const hl = highs[i] - lows[i]
      const hc = i > 0 ? Math.abs(highs[i] - closes[i - 1]) : hl
      const lc = i > 0 ? Math.abs(lows[i] - closes[i - 1]) : hl
      trs.push(Math.max(hl, hc, lc))
    }
    const period = Math.min(Number(v.period), trs.length)
    const atrVal = mean(trs.slice(-period))
    const lastClose = closes[closes.length - 1] ?? 0
    return {
      rows: [
        { label: "ATR", value: atrVal, format: "number", primary: true },
        { label: "Suggested Stop (2x ATR)", value: lastClose - 2 * atrVal, format: "number", hint: "below last close for longs" },
        { label: "ATR % of Price", value: lastClose > 0 ? (atrVal / lastClose) * 100 : 0, format: "percent" },
      ],
    }
  },
}

export const technicalCalculators: CalculatorSpec[] = [movingAverage, rsi, macd, bollinger, atr]
