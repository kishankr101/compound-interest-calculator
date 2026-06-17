import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: "neutral" | "primary" | "amber"
}

export function SummaryCard({
  label,
  value,
  sublabel,
  accent = "neutral",
}: SummaryCardProps) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            accent === "primary" && "bg-[var(--chart-1)]",
            accent === "amber" && "bg-[var(--chart-2)]",
            accent === "neutral" && "bg-muted-foreground/40",
          )}
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {sublabel ? (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      ) : null}
    </Card>
  )
}
