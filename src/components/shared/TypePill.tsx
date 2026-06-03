import { Badge } from "@/components/ui/badge";
import type { CAPAType } from "@/types";
import { formatCAPAType } from "@/utils/formatters";

const typeClassName: Record<CAPAType, string> = {
  deviation: "border-primary/30 bg-primary/10 text-primary",
  audit: "border-success/30 bg-success/10 text-success",
  complaint: "border-warning/30 bg-warning/10 text-warning",
};

const NEUTRAL = "border-border bg-field text-foreground-secondary";

/**
 * TypePill — CAPA type tag (Deviation / Audit Finding / Complaint).
 *
 * `tone="color"` (default) colour-codes by type via canonical tokens.
 * `tone="neutral"` renders a muted tag for contexts where the type is
 * informational rather than a status signal.
 */
export function TypePill({
  type,
  tone = "color",
}: {
  type: CAPAType;
  tone?: "color" | "neutral";
}) {
  return (
    <Badge variant="outline" className={`w-[108px] justify-center ${tone === "neutral" ? NEUTRAL : typeClassName[type]}`}>
      {formatCAPAType(type)}
    </Badge>
  );
}
