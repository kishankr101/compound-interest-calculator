"use client"

import { useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField } from "@/components/input-field"
import { GrowthChart } from "@/components/growth-chart"
import { SummaryCard } from "@/components/summary-card"
import {
  calculateCompoundInterest,
  formatCurrency,
  type CalculatorInputs,
} from "@/lib/compound-interest"

export function CompoundCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    initialAmount: 10000,
    monthlyContribution: 500,
    annualRate: 7,
    years: 20,
  })

  const update = (key: keyof CalculatorInputs) => (value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const results = useMemo(() => calculateCompoundInterest(inputs), [inputs])

  const growthMultiple =
    results.totalContributions > 0
      ? results.finalBalance / results.totalContributions
      : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Inputs */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Your investment plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-7">
          <InputField
            id="initial"
            label="Initial investment"
            value={inputs.initialAmount}
            onChange={update("initialAmount")}
            min={0}
            max={500000}
            step={500}
            prefix="$"
          />
          <InputField
            id="monthly"
            label="Monthly contribution"
            value={inputs.monthlyContribution}
            onChange={update("monthlyContribution")}
            min={0}
            max={10000}
            step={50}
            prefix="$"
          />
          <InputField
            id="rate"
            label="Annual interest rate"
            value={inputs.annualRate}
            onChange={update("annualRate")}
            min={0}
            max={20}
            step={0.1}
            suffix="%"
          />
          <InputField
            id="years"
            label="Time period"
            value={inputs.years}
            onChange={update("years")}
            min={1}
            max={50}
            step={1}
            suffix="yrs"
          />
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Future balance"
            value={formatCurrency(results.finalBalance)}
            sublabel={`${growthMultiple.toFixed(1)}× your contributions`}
            accent="neutral"
          />
          <SummaryCard
            label="Total contributions"
            value={formatCurrency(results.totalContributions)}
            sublabel="Money you put in"
            accent="amber"
          />
          <SummaryCard
            label="Interest earned"
            value={formatCurrency(results.totalInterest)}
            sublabel="Growth from compounding"
            accent="primary"
          />
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">
              Contributions vs. growth over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={results.data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
