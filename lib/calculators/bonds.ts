import type { CalculatorSpec } from "./types"

function bondCashflows(face: number, couponRate: number, ytm: number, periods: number, freq: number) {
  const coupon = (face * couponRate) / freq
  const r = ytm / freq
  let price = 0
  for (let t = 1; t <= periods; t++) {
    price += coupon / (1 + r) ** t
  }
  price += face / (1 + r) ** periods
  return { coupon, price, r }
}

const bondPrice: CalculatorSpec = {
  id: "bond-price",
  name: "Bond Price",
  description: "Estimates a bond's fair market value from its yield.",
  fields: [
    { key: "face", label: "Face Value", type: "currency", default: 1000, min: 0, step: 50 },
    { key: "coupon", label: "Coupon Rate", type: "percent", default: 5, min: 0, step: 0.1, suffix: "%" },
    { key: "ytm", label: "Yield to Maturity", type: "percent", default: 6, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years to Maturity", type: "number", default: 10, min: 0.5, step: 0.5, suffix: "yrs" },
    { key: "freq", label: "Payments / Year", type: "integer", default: 2, min: 1, max: 12, step: 1 },
  ],
  compute: (v) => {
    const freq = Number(v.freq)
    const periods = Math.round(Number(v.years) * freq)
    const { coupon, price } = bondCashflows(Number(v.face), Number(v.coupon) / 100, Number(v.ytm) / 100, periods, freq)
    const premium = price - Number(v.face)
    return {
      rows: [
        { label: "Bond Price", value: price, format: "currency", primary: true },
        { label: premium >= 0 ? "Premium" : "Discount", value: Math.abs(premium), format: "currency" },
        { label: "Coupon Payment", value: coupon, format: "currency" },
      ],
    }
  },
}

const ytm: CalculatorSpec = {
  id: "ytm",
  name: "Yield to Maturity (YTM)",
  description: "Calculates the total return if a bond is held to maturity.",
  fields: [
    { key: "price", label: "Bond Price", type: "currency", default: 950, min: 0.01, step: 1 },
    { key: "face", label: "Face Value", type: "currency", default: 1000, min: 0, step: 50 },
    { key: "coupon", label: "Coupon Rate", type: "percent", default: 5, min: 0, step: 0.1, suffix: "%" },
    { key: "years", label: "Years to Maturity", type: "number", default: 10, min: 0.5, step: 0.5, suffix: "yrs" },
    { key: "freq", label: "Payments / Year", type: "integer", default: 2, min: 1, max: 12, step: 1 },
  ],
  compute: (v) => {
    const face = Number(v.face)
    const price = Number(v.price)
    const freq = Number(v.freq)
    const periods = Math.round(Number(v.years) * freq)
    const couponRate = Number(v.coupon) / 100
    let low = 0
    let high = 1
    for (let i = 0; i < 200; i++) {
      const mid = (low + high) / 2
      const { price: p } = bondCashflows(face, couponRate, mid, periods, freq)
      if (p > price) low = mid
      else high = mid
    }
    const ytmVal = ((low + high) / 2) * 100
    return {
      rows: [
        { label: "Yield to Maturity", value: ytmVal, format: "percent", primary: true },
        { label: "Current Yield", value: price > 0 ? ((face * couponRate) / price) * 100 : 0, format: "percent" },
      ],
    }
  },
}

const currentYield: CalculatorSpec = {
  id: "current-yield",
  name: "Current Yield",
  description: "Gives annual coupon income relative to the bond's price.",
  fields: [
    { key: "face", label: "Face Value", type: "currency", default: 1000, min: 0, step: 50 },
    { key: "coupon", label: "Coupon Rate", type: "percent", default: 5, min: 0, step: 0.1, suffix: "%" },
    { key: "price", label: "Bond Price", type: "currency", default: 950, min: 0.01, step: 1 },
  ],
  compute: (v) => {
    const annualCoupon = (Number(v.face) * Number(v.coupon)) / 100
    const cy = Number(v.price) > 0 ? (annualCoupon / Number(v.price)) * 100 : 0
    return {
      rows: [
        { label: "Current Yield", value: cy, format: "percent", primary: true },
        { label: "Annual Coupon", value: annualCoupon, format: "currency" },
      ],
    }
  },
}

const duration: CalculatorSpec = {
  id: "duration",
  name: "Duration",
  description: "Measures a bond's price sensitivity to interest-rate changes.",
  fields: [
    { key: "face", label: "Face Value", type: "currency", default: 1000, min: 0, step: 50 },
    { key: "coupon", label: "Coupon Rate", type: "percent", default: 5, min: 0, step: 0.1, suffix: "%" },
    { key: "ytm", label: "Yield to Maturity", type: "percent", default: 6, min: 0.01, step: 0.1, suffix: "%" },
    { key: "years", label: "Years to Maturity", type: "number", default: 10, min: 0.5, step: 0.5, suffix: "yrs" },
    { key: "freq", label: "Payments / Year", type: "integer", default: 2, min: 1, max: 12, step: 1 },
  ],
  compute: (v) => {
    const face = Number(v.face)
    const freq = Number(v.freq)
    const periods = Math.round(Number(v.years) * freq)
    const c = (face * (Number(v.coupon) / 100)) / freq
    const r = Number(v.ytm) / 100 / freq
    let price = 0
    let weighted = 0
    for (let t = 1; t <= periods; t++) {
      const cf = t === periods ? c + face : c
      const pv = cf / (1 + r) ** t
      price += pv
      weighted += (t / freq) * pv
    }
    const macaulay = price > 0 ? weighted / price : 0
    const modified = macaulay / (1 + r)
    return {
      rows: [
        { label: "Macaulay Duration", value: macaulay, format: "number", primary: true, hint: "years" },
        { label: "Modified Duration", value: modified, format: "number" },
        { label: "Price Drop / +1% Yield", value: modified, format: "percent", hint: "Approximate" },
      ],
    }
  },
}

const coupon: CalculatorSpec = {
  id: "coupon",
  name: "Coupon Payment",
  description: "Computes the periodic interest payment of a bond.",
  fields: [
    { key: "face", label: "Face Value", type: "currency", default: 1000, min: 0, step: 50 },
    { key: "coupon", label: "Annual Coupon Rate", type: "percent", default: 5, min: 0, step: 0.1, suffix: "%" },
    { key: "freq", label: "Payments / Year", type: "integer", default: 2, min: 1, max: 12, step: 1 },
  ],
  compute: (v) => {
    const annual = (Number(v.face) * Number(v.coupon)) / 100
    const periodic = annual / Number(v.freq)
    return {
      rows: [
        { label: "Payment Per Period", value: periodic, format: "currency", primary: true },
        { label: "Annual Coupon", value: annual, format: "currency" },
      ],
    }
  },
}

export const bondCalculators: CalculatorSpec[] = [bondPrice, ytm, currentYield, duration, coupon]
