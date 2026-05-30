import type { QualityScore } from "@/types";
import { ScorePill } from "@/components/shared/ScorePill";
import { ScoreBreakdown } from "@/components/score/ScoreBreakdown";
import { getScoreLiftTips } from "@/utils/scoring";

export function ScoreSidebar({ score }: { score: QualityScore }) {
  const tips = getScoreLiftTips(score);

  return (
    <aside className="space-y-4 rounded border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Quality Score</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Score must reach 80 before sign-off can close as Audit Ready.
          </p>
        </div>
        <ScorePill score={score.total} />
      </div>
      <ScoreBreakdown score={score} />
      {tips.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Improvement Tips</div>
          {tips.map((tip) => (
            <div key={`${tip.field}-${tip.subScore}`} className="rounded border bg-muted/30 p-2 text-xs">
              <span className="font-medium">{tip.field}:</span> {tip.suggestion}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

