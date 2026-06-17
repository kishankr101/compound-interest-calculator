export interface CalculatorInputs {
  initialAmount: number
  monthlyContribution: number
  annualRate: number
  years: number
}

export interface YearlyDataPoint {
  year: number
  contributions: number
  interest: number
  balance: number
}

export interface CalculatorResults {
  data: YearlyDataPoint[]
  finalBalance: number
  totalContributions: number
  totalInterest: number
}

/**
 * Computes compound interest growth with monthly contributions,
 * compounded monthly. Returns a yearly breakdown for charting.
 */
export function calculateCompoundInterest({
  initialAmount,
  monthlyContribution,
  annualRate,
  years,
}: CalculatorInputs): CalculatorResults {
  const monthlyRate = annualRate / 100 / 12
  const totalMonths = Math.round(years * 12)

  let balance = initialAmount
  let contributions = initialAmount

  const data: YearlyDataPoint[] = [
    {
      year: 0,
      contributions: initialAmount,
      interest: 0,
      balance: initialAmount,
    },
  ]

  for (let month = 1; month <= totalMonths; month++) {
    // Interest accrues on the current balance, then the contribution is added.
    balance += balance * monthlyRate
    balance += monthlyContribution
    contributions += monthlyContribution

    if (month % 12 === 0 || month === totalMonths) {
      const year = month / 12
      data.push({
        year: Math.round(year * 100) / 100,
        contributions: Math.round(contributions),
        interest: Math.round(balance - contributions),
        balance: Math.round(balance),
      })
    }
  }

  return {
    data,
    finalBalance: Math.round(balance),
    totalContributions: Math.round(contributions),
    totalInterest: Math.round(balance - contributions),
  }
}

export function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(value)
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
