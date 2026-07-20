import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type DeltaBadgeProps = {
  value: number;
  label?: string;
  /** When is a positive number "good"? Defaults to "up". Used only for tone. */
  goodWhen?: "up" | "down";
  className?: string;
};

/**
 * Compact trend indicator: shows a signed % with an up/down arrow.
 * Tone is semantic (emerald for good, rose for bad) independent of the sign,
 * so callers decide what direction is favorable via `goodWhen`.
 */
export function DeltaBadge({ value, label, goodWhen = "up", className = "" }: DeltaBadgeProps) {
  const rounded = Math.round(value);
  const isFlat = rounded === 0;
  const isUp = rounded > 0;
  const favorable = goodWhen === "up" ? isUp : !isUp && !isFlat;
  const variant = isFlat ? "secondary" : favorable ? "emerald" : "rose";
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Badge variant={variant} className="px-1.5 py-0">
        <Icon className="h-3 w-3" />
        {rounded > 0 ? "+" : ""}
        {rounded}%
      </Badge>
      {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
    </span>
  );
}
