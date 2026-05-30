import type { QualityScore } from "@/types";
import { ScoreBar } from "@/components/score/ScoreBar";

export function ScoreBreakdown({ score }: { score: QualityScore }) {
  return (
    <div className="space-y-3">
      <ScoreBar label="Problem Specificity" value={score.problemSpecificity} />
      <ScoreBar label="Root Cause Depth" value={score.rootCauseDepth} />
      <ScoreBar label="Action Effectiveness" value={score.effectiveness} />
      <ScoreBar label="Containment Strength" value={score.containment} />
    </div>
  );
}

