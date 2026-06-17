import type { CalculatorCategory, CalculatorSpec } from "./types"
import { investingCalculators } from "./investing"
import { tradingCalculators } from "./trading"
import { riskCalculators } from "./risk"
import { bondCalculators } from "./bonds"
import { loanCalculators } from "./loans"
import { derivativesCalculators } from "./derivatives"
import { businessCalculators } from "./business"
import { taxCalculators } from "./tax"
import { cryptoCalculators } from "./crypto"
import { technicalCalculators } from "./technical"

export const categories: CalculatorCategory[] = [
  {
    id: "investing",
    name: "Investing",
    tagline: "Portfolio growth, returns & allocation",
    calculators: investingCalculators,
  },
  {
    id: "trading",
    name: "Trading",
    tagline: "Position sizing, P&L & forex",
    calculators: tradingCalculators,
  },
  {
    id: "risk",
    name: "Risk Management",
    tagline: "Volatility, drawdown & risk ratios",
    calculators: riskCalculators,
  },
  {
    id: "bonds",
    name: "Bonds & Fixed Income",
    tagline: "Pricing, yield & duration",
    calculators: bondCalculators,
  },
  {
    id: "loans",
    name: "Banking & Loans",
    tagline: "EMI, mortgage & credit",
    calculators: loanCalculators,
  },
  {
    id: "derivatives",
    name: "Derivatives",
    tagline: "Options, Greeks & futures",
    calculators: derivativesCalculators,
  },
  {
    id: "business",
    name: "Corporate Finance",
    tagline: "NPV, IRR & margins",
    calculators: businessCalculators,
  },
  {
    id: "tax",
    name: "Tax & Personal",
    tagline: "Tax, retirement & savings",
    calculators: taxCalculators,
  },
  {
    id: "crypto",
    name: "Crypto",
    tagline: "Trading, mining & staking",
    calculators: cryptoCalculators,
  },
  {
    id: "technical",
    name: "Technical Analysis",
    tagline: "MA, RSI, MACD & bands",
    calculators: technicalCalculators,
  },
]

export const totalCalculators = categories.reduce((sum, c) => sum + c.calculators.length, 0)

export function findCalculator(id: string): CalculatorSpec | undefined {
  for (const c of categories) {
    const found = c.calculators.find((calc) => calc.id === id)
    if (found) return found
  }
  return undefined
}

export type { CalculatorCategory, CalculatorSpec } from "./types"
