import { capaCases as initialCapaCases, prefills } from "@/mock-data";
import type { CAPACase, CAPAStatus, CAPAType, EightDStep, PreFillContext } from "@/types";
import { addAuditEvent } from "@/services/auditTrailService";
import { getAllCorrectiveActions, getAllPreventiveActions } from "@/services/actionService";
import { getFindingById, linkFindingToCAPA, resetFindingData, updateFindingStatus } from "@/services/findingService";

type CAPAPatch = Partial<Omit<CAPACase, "id">>;

let capaRecords: CAPACase[] = structuredClone(initialCapaCases);

function getPreFillForType(type: CAPAType): PreFillContext {
  return structuredClone(prefills[type]);
}

function createEmptyCAPA(findingId: string, type: CAPAType): CAPACase {
  const finding = getFindingById(findingId);
  const id = `CAPA-${findingId.replace(/^(DEV|AUD|CMP)-/, "")}`;
  const preFill = getPreFillForType(type);
  const now = new Date().toISOString();

  return {
    id,
    findingId,
    type,
    title: finding?.shortDescription ?? "New CAPA Intake",
    preFill,
    gateAnswers: [],
    score: {
      problemSpecificity: 0,
      rootCauseDepth: 0,
      effectiveness: 0,
      containment: 0,
      total: 0,
      isAuditReady: false,
    },
    impact: {
      severity: "Major",
      totalWeight: 0,
      factors: [],
      rationale: "Nova will classify impact during intake.",
      computedAt: now,
    },
    rca: {
      method: type === "audit" ? "fishbone" : type === "complaint" ? "decision_tree" : "5whys",
      confirmedRootCauses: [],
    },
    correctiveActions: [],
    preventiveActions: [],
    verification: {
      evidenceFileNames: [],
    },
    approvals: [],
    auditEvents: [],
    suggestions: [],
    status: "draft",
    currentStep: "problem",
    createdAt: now,
    updatedAt: now,
    createdBy: type === "deviation" ? "initiator" : "qa_deviation",
    assignedTo: "qa_deviation",
    department: finding?.department ?? "Quality Assurance",
  };
}

export function getAllCAPAs(): CAPACase[] {
  const correctiveActions = getAllCorrectiveActions();
  const preventiveActions = getAllPreventiveActions();

  return structuredClone(
    capaRecords.map((capa) => ({
      ...capa,
      correctiveActions: correctiveActions.filter((action) => action.capaId === capa.id),
      preventiveActions: preventiveActions.filter((action) => action.capaId === capa.id),
    })),
  );
}

export function getCAPAById(id: string): CAPACase | undefined {
  return getAllCAPAs().find((capa) => capa.id === id);
}

export function createCAPAFromFinding(findingId: string, type: CAPAType): CAPACase {
  const existing = capaRecords.find((capa) => capa.findingId === findingId);
  if (existing) return structuredClone(existing);

  const newCAPA = createEmptyCAPA(findingId, type);
  capaRecords = [newCAPA, ...capaRecords];
  linkFindingToCAPA(findingId, newCAPA.id);
  addAuditEvent({
    actorName: "Nova",
    actorRole: "AI Coach",
    domain: "system",
    eventType: "source_imported",
    action: `Created ${newCAPA.id} from finding ${findingId}.`,
    capaId: newCAPA.id,
    findingId,
  });

  return structuredClone(newCAPA);
}

export function updateCAPA(id: string, patch: CAPAPatch): CAPACase | undefined {
  const index = capaRecords.findIndex((capa) => capa.id === id);
  if (index === -1) return undefined;

  const updatedCAPA: CAPACase = {
    ...capaRecords[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  capaRecords[index] = updatedCAPA;
  return structuredClone(updatedCAPA);
}

export function advanceCAPAStep(id: string, step: EightDStep): CAPACase | undefined {
  const updated = updateCAPA(id, {
    currentStep: step,
    status: step === "signoff" ? "approval" : "investigation",
  });

  if (updated) {
    addAuditEvent({
      actorName: "System",
      actorRole: "Demo Runtime",
      domain: "system",
      eventType: "problem_updated",
      action: `${id} advanced to ${step}.`,
      capaId: id,
    });
  }

  return updated;
}

export function closeCAPA(id: string): CAPACase | undefined {
  const capa = getCAPAById(id);
  if (!capa) return undefined;

  const closedCAPA = updateCAPA(id, {
    status: "closed",
    currentStep: "signoff",
    score: {
      ...capa.score,
      total: Math.max(capa.score.total, 80),
      isAuditReady: true,
    },
  });

  if (closedCAPA) {
    updateFindingStatus(closedCAPA.findingId, "capa_closed");
    addAuditEvent({
      actorName: "System",
      actorRole: "Demo Runtime",
      domain: "system",
      eventType: "capa_closed",
      action: `${id} was marked as Audit Ready and Closed.`,
      capaId: id,
      findingId: closedCAPA.findingId,
    });
  }

  return closedCAPA;
}

export function updateCAPAStatus(id: string, status: CAPAStatus): CAPACase | undefined {
  return updateCAPA(id, { status });
}

export function resetCAPAData(): CAPACase[] {
  capaRecords = structuredClone(initialCapaCases);
  resetFindingData();
  return getAllCAPAs();
}

