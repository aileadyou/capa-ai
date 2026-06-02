import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ScorePill({ score, compact = false }: { score: number; compact?: boolean }) {
  const isReady = score >= 80;
  const [displayed, setDisplayed] = useState(score);
  const prevScore = useRef(score);

  useEffect(() => {
    const from = prevScore.current;
    const to = score;
    if (from === to) return;

    prevScore.current = to;
    const duration = 600;
    const start = performance.now();

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [score]);

  const toneClassName = isReady
    ? "border-status-ready/30 bg-status-ready/10 text-status-ready"
    : "border-severity-major/30 bg-severity-major/10 text-severity-major";

  if (compact) {
    return (
      <Badge variant="outline" className={cn("tabular-nums transition-colors duration-300", toneClassName)}>
        {displayed}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1.5 tabular-nums transition-colors duration-300", toneClassName)}>
      {isReady ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
      {displayed} · {isReady ? "Audit Ready" : "Improve Score"}
    </Badge>
  );
}

