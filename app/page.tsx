import { CompoundCalculator } from "@/components/compound-calculator"

export default function Page() {
  return (
    <main className="min-h-svh px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-primary">
            Compound Interest Calculator
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            See how your money grows over time
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Adjust your initial amount, monthly contributions, expected rate of
            return, and time horizon to visualize the power of compounding —
            and exactly how much of your future balance comes from growth.
          </p>
        </header>
        <CompoundCalculator />
      </div>
    </main>
  )
}
