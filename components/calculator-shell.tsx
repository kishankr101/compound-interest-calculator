"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CalculatorEngine } from "@/components/calculator-engine"
import { categories, totalCalculators } from "@/lib/calculators"
import type { CalculatorSpec } from "@/lib/calculators/types"

export function CalculatorShell() {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id)
  const [selected, setSelected] = useState<CalculatorSpec | null>(null)

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono text-sm font-bold">
            fx
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            Finance Calculator Suite
          </h1>
        </div>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          {totalCalculators} calculators across {categories.length} categories. Pick a category,
          choose a calculator, and get instant results.
        </p>
      </header>

      {/* Category tabs */}
      <nav aria-label="Calculator categories" className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategoryId(category.id)
                  setSelected(null)
                }}
                aria-pressed={isActive}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </nav>

      {selected ? (
        <section aria-label={`${selected.name} calculator`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to {activeCategory.name}
          </Button>
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">{selected.name}</h2>
            <p className="mt-1 text-pretty text-muted-foreground">{selected.description}</p>
          </div>
          <CalculatorEngine spec={selected} />
        </section>
      ) : (
        <section aria-label={`${activeCategory.name} calculators`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{activeCategory.name}</h2>
              <p className="text-sm text-muted-foreground">{activeCategory.tagline}</p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {activeCategory.calculators.length} tools
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategory.calculators.map((calc) => (
              <Card
                key={calc.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(calc)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setSelected(calc)
                  }
                }}
                className="group cursor-pointer p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
              >
                <h3 className="font-medium text-foreground group-hover:text-primary">
                  {calc.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {calc.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
