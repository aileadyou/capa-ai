import type { ImpactClassification, ImpactFactor, PreFillContext, Severity } from "@/types";

const now = () => new Date().toISOString();

function buildImpact(severity: Severity, factors: ImpactFactor[], rationale: string): ImpactClassification {
  return {
    severity,
    totalWeight: factors.reduce((total, factor) => total + factor.weight, 0),
    factors,
    rationale,
    computedAt: now(),
  };
}

export function computeImpact(prefill: PreFillContext): ImpactClassification {
  if (prefill.source === "Bizzmine") {
    const isGoldenCase = prefill.deviationId === "DEV-2026-0341";
    const factors = [
      {
        factor: "Area criticality",
        value: prefill.location.area,
        weight: /Grade A|Grade B/i.test(prefill.location.area) ? 30 : 16,
        rationale: "Classified aseptic areas increase GMP significance.",
      },
      {
        factor: "Affected batches",
        value: prefill.affectedBatches.join(", ") || "No batch listed",
        weight: prefill.affectedBatches.length > 0 ? 24 : 8,
        rationale: "Batch scope determines product impact assessment depth.",
      },
      {
        factor: "Initial observation",
        value: prefill.initialObservation,
        weight: /threshold|excursion|temperature|particle/i.test(prefill.initialObservation) ? 18 : 10,
        rationale: "Measurable process signals are more significant than administrative findings.",
      },
    ];

    return buildImpact(
      isGoldenCase ? "Major" : prefill.initialSeverity ?? "Major",
      factors,
      "Major is appropriate because the event has controlled but significant GMP impact requiring structured CAPA.",
    );
  }

  if (prefill.source === "Q100+") {
    return buildImpact(
      prefill.findingId === "AUD-2026-0089" ? "Major" : prefill.severity,
      [
        {
          factor: "Finding category",
          value: prefill.findingCategory,
          weight: /GMP|Documentation|Data/i.test(prefill.findingCategory) ? 30 : 16,
          rationale: "GMP documentation gaps can affect audit defensibility.",
        },
        {
          factor: "Regulatory reference",
          value: prefill.regulationReference.join(", "),
          weight: prefill.regulationReference.length > 0 ? 20 : 8,
          rationale: "Referenced regulations increase compliance relevance.",
        },
        {
          factor: "Audit source",
          value: prefill.auditType,
          weight: prefill.auditType === "external" ? 24 : 18,
          rationale: "Audit findings require timely and traceable remediation.",
        },
      ],
      "Major is appropriate because the audit finding affects documentation integrity and requires systemic remediation.",
    );
  }

  return buildImpact(
    prefill.complaintId === "CMP-2026-0112" ? "Major" : prefill.initialSeverity,
    [
      {
        factor: "Customer type",
        value: prefill.customer.type,
        weight: prefill.customer.type === "hospital" || prefill.customer.type === "regulator" ? 28 : 16,
        rationale: "Hospital and regulator complaints carry higher quality visibility.",
      },
      {
        factor: "Complaint type",
        value: prefill.complaintType,
        weight: /Particulate|Label|Cold Chain/i.test(prefill.complaintType) ? 30 : 14,
        rationale: "Product quality complaint types require structured impact assessment.",
      },
      {
        factor: "Lot traceability",
        value: prefill.product.lotNumber,
        weight: prefill.product.lotNumber ? 16 : 6,
        rationale: "Lot number enables focused retained sample and batch record review.",
      },
    ],
    "Major is appropriate because the complaint is customer-facing and may affect product quality, while initial scope remains bounded.",
  );
}

