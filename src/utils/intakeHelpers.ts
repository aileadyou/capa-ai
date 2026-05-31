import type { CAPAType, GateQuestionID, PreFillContext, QualityScore } from "@/types";
import { formatCAPAType, formatDateTime } from "@/utils/formatters";
import { computeProblemSpecificity, computeTotalQualityScore } from "@/utils/scoring";

// ── Title suggestion ──────────────────────────────────────────────────────────

export function getSuggestedTitle(type: CAPAType, prefill?: PreFillContext): string {
  if (!prefill) return `${formatCAPAType(type)} CAPA Intake`;

  if (prefill.source === "Bizzmine") {
    return `CAPA for ${prefill.deviationId}: Environmental Monitoring Excursion`;
  }
  if (prefill.source === "Q100+") {
    return `CAPA for ${prefill.findingId}: GMP Documentation Gap`;
  }
  // Bizzmine-Complaint
  return `CAPA for ${prefill.complaintId}: Visible Particulate Matter Complaint`;
}

// ── Pre-fill summary for review step ─────────────────────────────────────────

export function getPrefillSummary(prefill: PreFillContext): Array<[string, string]> {
  if (prefill.source === "Bizzmine") {
    return [
      ["Deviation ID", prefill.deviationId],
      ["System", "Bizzmine"],
      ["Department", prefill.location.department],
      ["Area", prefill.location.area],
      ["Equipment", prefill.location.equipmentId],
      ["Reported At", formatDateTime(prefill.reportedAt)],
      ["Occurred At", formatDateTime(prefill.occurredAt)],
      ["Initiated By", `${prefill.initiator.name} (${prefill.initiator.role})`],
      ["Affected Batches", prefill.affectedBatches.join(", ") || "—"],
      ["Initial Observation", prefill.initialObservation],
    ];
  }

  if (prefill.source === "Q100+") {
    return [
      ["Finding ID", prefill.findingId],
      ["Audit ID", prefill.auditId],
      ["System", "Q100+"],
      ["Audit Type", prefill.auditType === "internal" ? "Internal" : "External"],
      ["Audit Date", formatDateTime(prefill.auditDate)],
      ["Reported At", formatDateTime(prefill.reportedAt)],
      ["Auditor", `${prefill.auditor.name} (${prefill.auditor.organization})`],
      ["Department", prefill.auditee.department],
      ["Category", prefill.findingCategory],
      ["Description", prefill.findingDescription],
    ];
  }

  // Bizzmine-Complaint
  return [
    ["Complaint ID", prefill.complaintId],
    ["System", "Bizzmine"],
    ["Reported At", formatDateTime(prefill.reportedAt)],
    ["Customer", `${prefill.customer.name} (${prefill.customer.type})`],
    ["Product", prefill.product.name],
    ["Lot Number", prefill.product.lotNumber],
    ["Expiry Date", prefill.product.expiryDate],
    ["Complaint Type", prefill.complaintType],
    ["Description", prefill.description],
  ];
}

// ── Intake quality score ──────────────────────────────────────────────────────

export function computeIntakeScore(
  title: string,
  gateAnswers: Record<GateQuestionID, string>,
): QualityScore {
  const observation = gateAnswers["observation"] ?? "";
  const containment = gateAnswers["containment"] ?? "";
  const impact = gateAnswers["impact"] ?? "";
  const rootCauseHint = gateAnswers["cause_confirmation"] ?? "";

  // Problem specificity based on observation quality + title
  const combinedStatement = `${title} ${observation}`;
  const problemSpecificity = computeProblemSpecificity(combinedStatement);

  // Root cause depth: partial at intake (no full RCA yet)
  let rootCauseDepth = 0;
  if (rootCauseHint.trim().length >= 20) rootCauseDepth += 10;
  if (rootCauseHint.trim().length >= 60) rootCauseDepth += 8;
  if (/\b(SOP|process|training|equipment|system|gap)\b/i.test(rootCauseHint)) rootCauseDepth += 7;

  // Effectiveness: estimate from impact + effectiveness criteria
  const effectivenessCriteria = gateAnswers["effectiveness_criteria"] ?? "";
  let effectiveness = 0;
  if (impact.trim().length >= 20) effectiveness += 8;
  if (effectivenessCriteria.trim().length >= 20) effectiveness += 10;
  if (/\b(measur|metric|KPI|rate|percent|within)\b/i.test(effectivenessCriteria)) effectiveness += 7;

  // Containment strength based on gate answer
  let containmentStrength = 0;
  if (containment.trim().length >= 20) containmentStrength += 12;
  if (/\b(hold|quarantine|restrict|review|sample|isolat)\b/i.test(containment)) containmentStrength += 8;
  if (containment.trim().length >= 80) containmentStrength += 5;

  return computeTotalQualityScore({
    problemSpecificity: Math.min(25, problemSpecificity),
    rootCauseDepth: Math.min(25, rootCauseDepth),
    effectiveness: Math.min(25, effectiveness),
    containment: Math.min(25, containmentStrength),
  });
}
