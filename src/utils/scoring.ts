import type { CorrectiveAction, PreventiveAction, QualityScore, ScoreLiftTip } from "@/types";

const clampScore = (score: number) => Math.max(0, Math.min(25, score));

export function computeProblemSpecificity(statement: string): number {
  let score = 0;
  if (statement.trim().length >= 50) score += 6;
  if (/\b(\d{1,2}\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|\d{4}-\d{2}-\d{2}|shift)\b/i.test(statement)) score += 4;
  if (/\b(Grade|Suite|Room|Line|Area|Warehouse|Cold Room)\b/i.test(statement)) score += 4;
  if (/\b(HEPA|equipment|line|autoclave|logger|vial|lot|batch)\b/i.test(statement)) score += 4;
  if (/\b(count|threshold|minutes|temperature|record|verification|particulate)\b/i.test(statement)) score += 4;
  if (/\b(VAC|CAPA|DEV|AUD|CMP|lot|batch)\b/i.test(statement)) score += 3;
  return clampScore(score);
}

export function computeRootCauseDepth(rootCauses: string[], depthSignals = 0): number {
  let score = 0;
  if (rootCauses.length > 0) score += 8;
  if (rootCauses.some((cause) => cause.length >= 80)) score += 5;
  if (rootCauses.some((cause) => /\b(SOP|ownership|interval|trend|criteria|handover|escalation)\b/i.test(cause))) score += 6;
  score += Math.min(depthSignals, 6);
  return clampScore(score);
}

export function computeActionEffectiveness(
  correctiveActions: Pick<CorrectiveAction, "description" | "linkedRootCause" | "verificationMethod">[],
  preventiveActions: Pick<PreventiveAction, "description" | "targetDate">[],
): number {
  let score = 0;
  if (correctiveActions.length > 0) score += 5;
  if (correctiveActions.some((action) => action.description.length >= 30)) score += 4;
  if (correctiveActions.some((action) => action.linkedRootCause)) score += 5;
  if (correctiveActions.some((action) => action.verificationMethod)) score += 4;
  if (preventiveActions.length > 0) score += 4;
  if (preventiveActions.some((action) => new Date(action.targetDate).getTime() > Date.now())) score += 3;
  return clampScore(score);
}

export function computeContainmentStrength(containmentText: string, hasPic: boolean, dueDate?: string): number {
  let score = 0;
  if (containmentText.trim().length >= 30) score += 8;
  if (/\b(hold|quarantine|restrict|review|assessment|sample)\b/i.test(containmentText)) score += 6;
  if (hasPic) score += 5;
  if (dueDate && new Date(dueDate).getTime() > Date.now()) score += 6;
  return clampScore(score);
}

export function isAuditReady(total: number): boolean {
  return total >= 80;
}

export function computeTotalQualityScore(parts: Omit<QualityScore, "total" | "isAuditReady">): QualityScore {
  const total =
    parts.problemSpecificity +
    parts.rootCauseDepth +
    parts.effectiveness +
    parts.containment;

  return {
    ...parts,
    total,
    isAuditReady: isAuditReady(total),
  };
}

export function getScoreLiftTips(score: QualityScore): ScoreLiftTip[] {
  const tips: ScoreLiftTip[] = [];

  if (score.problemSpecificity < 20) {
    tips.push({
      field: "Problem Statement",
      suggestion: "Add date, shift, area, equipment ID, measured condition, and affected batch or lot.",
      scoreGain: 5,
      subScore: "problemSpecificity",
    });
  }

  if (score.rootCauseDepth < 20) {
    tips.push({
      field: "Root Cause",
      suggestion: "Explain the system weakness behind the event, such as SOP ownership, escalation criteria, or trend review gap.",
      scoreGain: 5,
      subScore: "rootCauseDepth",
    });
  }

  if (score.effectiveness < 20) {
    tips.push({
      field: "Actions",
      suggestion: "Link each corrective action to a confirmed root cause and add a verification method.",
      scoreGain: 5,
      subScore: "effectiveness",
    });
  }

  if (score.containment < 20) {
    tips.push({
      field: "Containment",
      suggestion: "Add immediate hold, quarantine, or restriction action with PIC and future due date.",
      scoreGain: 5,
      subScore: "containment",
    });
  }

  return tips;
}

