import { capaCases, findings, kgCitations, prefills } from "@/mock-data";
import type { CAPAType, PreFillContext } from "@/types";
import type { NovaFindingAnalysisPacket } from "./types";

const sourceIdByType: Record<CAPAType, string> = {
  deviation: "DEV-2026-0341",
  audit: "AUD-2026-0089",
  complaint: "CMP-2026-0112",
};

const auditReadyConstraints = [
  "Treat Nova output as a reviewer-editable draft, not final GMP truth.",
  "Use only source data, current CAPA state, gate answers, and similar CAPAs supplied in this packet.",
  "Do not invent batch IDs, SOP references, people, dates, evidence files, or regulatory citations.",
  "Flag missing evidence explicitly when a conclusion cannot be supported by the packet.",
  "Write CAPA text with specific scope, product or process impact, containment, root cause linkage, owner-ready action wording, and measurable verification criteria.",
];

function getSourceLabel(type: CAPAType, sourceId: string) {
  if (type === "audit") return `Q100+ · ${sourceId}`;
  if (type === "complaint") return `Bizzmine Complaint · ${sourceId}`;
  return `Bizzmine · ${sourceId}`;
}

export function getPrimarySourceId(type: CAPAType) {
  return sourceIdByType[type];
}

export function getPrefillForType(type: CAPAType): PreFillContext {
  return prefills[type];
}

export function getAnalysisPacketByType(type: CAPAType): NovaFindingAnalysisPacket | undefined {
  return getAnalysisPacketByFindingId(sourceIdByType[type]);
}

export function getAnalysisPacketByCapaId(capaId: string): NovaFindingAnalysisPacket | undefined {
  const capa = capaCases.find((entry) => entry.id === capaId);
  if (!capa) return undefined;
  return getAnalysisPacketByFindingId(capa.findingId);
}

export function getAnalysisPacketByFindingId(findingId: string): NovaFindingAnalysisPacket | undefined {
  const finding = findings.find((entry) => entry.id === findingId);
  const capa = capaCases.find((entry) => entry.findingId === findingId);
  if (!finding || !capa) return undefined;

  return {
    findingId,
    capaId: capa.id,
    type: capa.type,
    sourceLabel: getSourceLabel(capa.type, findingId),
    findingSummary: finding.shortDescription,
    sourceData: capa.preFill,
    currentCapaState: {
      title: capa.title,
      status: capa.status,
      currentStep: capa.currentStep,
      department: capa.department,
      scoreTotal: capa.score.total,
    },
    gateAnswers: capa.gateAnswers.map((answer) => ({
      questionId: answer.questionId,
      question: answer.question,
      answer: answer.answer,
    })),
    rootCauses: capa.rca.confirmedRootCauses,
    similarCapas: kgCitations
      .filter((citation) => citation.sourceType === capa.type || citation.capaId === "CAPA-2025-0124")
      .slice(0, 4)
      .map((citation) => ({
        capaId: citation.capaId,
        sourceId: citation.deviationId,
        similarityScore: citation.similarityScore,
        rootCause: citation.rootCause,
        correctiveAction: citation.correctiveAction,
        outcome: citation.outcome,
        year: citation.year,
      })),
    auditReadyConstraints,
  };
}
