/** Parse a comma/space/newline separated string into an array of numbers. */
export function parseSeries(input: number | string): number[] {
  if (typeof input === "number") return [input]
  return String(input)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => Number.isFinite(n))
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function stdDev(values: number[], sample = true): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance =
    values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - (sample ? 1 : 0))
  return Math.sqrt(variance)
}

/** Periodic returns from a price series (simple returns). */
export function returnsFromPrices(prices: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) out.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  return out
}

/** Standard normal cumulative distribution function (Abramowitz & Stegun). */
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2)
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x > 0 ? 1 - p : p
}

/** Standard normal probability density function. */
export function normPdf(x: number): number {
  return 0.3989422804014327 * Math.exp((-x * x) / 2)
}

/** Inverse normal CDF (Acklam's algorithm) for VaR z-scores. */
export function normInv(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924]
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857]
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878]
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742]
  const pl = 0.02425
  const ph = 1 - pl
  let q: number, r: number
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= ph) {
    q = p - 0.5
    r = q * q
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}

/** Net present value given a flat periodic rate and cash flows (t=0..n). */
export function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((acc, cf, t) => acc + cf / (1 + rate) ** t, 0)
}

/** Internal rate of return via bisection. Returns a per-period rate or NaN. */
export function irr(cashFlows: number[]): number {
  let low = -0.9999
  let high = 10
  let fLow = npv(low, cashFlows)
  let fHigh = npv(high, cashFlows)
  if (fLow * fHigh > 0) return Number.NaN
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2
    const fMid = npv(mid, cashFlows)
    if (Math.abs(fMid) < 1e-7) return mid
    if (fLow * fMid < 0) {
      high = mid
      fHigh = fMid
    } else {
      low = mid
      fLow = fMid
    }
  }
  return (low + high) / 2
}
