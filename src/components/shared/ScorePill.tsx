import { CheckCircle2, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ScorePill({ score }: { score: number }) {
  const isReady = score >= 80;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        isReady
          ? "border-status-ready/30 bg-status-ready/10 text-status-ready"
          : "border-severity-major/30 bg-severity-major/10 text-severity-major",
      )}
    >
      {isReady ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
      {score} · {isReady ? "Audit Ready" : "Improve Score"}
    </Badge>
  );
}

