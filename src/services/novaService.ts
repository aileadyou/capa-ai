import { kgCitations, prefills, novaScripts } from "@/mock-data";
import type { CAPAType, ImpactClassification, PreFillContext, RCAMethod } from "@/types";
import { computeImpact } from "@/utils/impact";
import { mockAICall } from "@/utils/mockAI";

export type RCAResponse =
  | typeof novaScripts.fiveWhysHepa
  | typeof novaScripts.fishboneAuditDocumentation
  | typeof novaScripts.decisionTreeComplaintParticulate;

const sourceIdByType: Record<CAPAType, string> = {
  deviation: "DEV-2026-0341",
  audit: "AUD-2026-0089",
  complaint: "CMP-2026-0112",
};

function validateSourceId(type: CAPAType, sourceId: string) {
  return sourceId === sourceIdByType[type];
}

export async function importSourceData(type: CAPAType, sourceId: string): Promise<PreFillContext> {
  if (!validateSourceId(type, sourceId)) {
    throw new Error(`No mocked ${type} source data found for ${sourceId}.`);
  }

  return mockAICall<PreFillContext>(`prefills.${type}`, {
    delayMs: 1500,
    fallback: prefills[type],
  });
}

export async function classifyImpact(prefill: PreFillContext): Promise<ImpactClassification> {
  return mockAICall<ImpactClassification>("impact.classification", {
    delayMs: 1000,
    fallback: computeImpact(prefill),
  });
}

export async function getContainmentSuggestion(capaId: string) {
  return mockAICall<Array<{ id: string; content: string }>>(
    `containmentSuggestions.${capaId}`,
    {
      delayMs: 1500,
      fallback: [],
    },
  );
}

export async function getRCASuggestions(capaId: string, method: RCAMethod): Promise<RCAResponse> {
  if (method === "5whys") {
    return mockAICall<RCAResponse>("fiveWhysHepa", { delayMs: 2000 });
  }

  if (method === "fishbone") {
    return mockAICall<RCAResponse>("fishboneAuditDocumentation", { delayMs: 1500 });
  }

  return mockAICall<RCAResponse>("decisionTreeComplaintParticulate", { delayMs: 1500 });
}

export async function getCorrectiveActionSuggestions(capaId: string): Promise<string[]> {
  return mockAICall<string[]>(`correctiveActionSuggestions.${capaId}`, {
    delayMs: 2000,
    fallback: [],
  });
}

export async function getPreventiveActionSuggestions(capaId: string): Promise<string[]> {
  return mockAICall<string[]>(`preventiveActionSuggestions.${capaId}`, {
    delayMs: 2000,
    fallback: [],
  });
}

export async function getVerificationCoaching(capaId: string): Promise<{
  Observation: string;
  Recommendation: string;
  "Audit Rationale": string;
}> {
  return mockAICall(`verificationCoaching.${capaId}`, {
    delayMs: 1000,
    fallback: novaScripts.verificationCoaching["CAPA-2026-0341"],
  });
}

export async function getChatResponse(step: string, message: string): Promise<string> {
  const scriptedResponses = (novaScripts.chatResponses as Record<string, unknown>)[step];

  if (Array.isArray(scriptedResponses)) {
    const exactMatch = scriptedResponses.find(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "prompt" in entry &&
        String(entry.prompt).toLowerCase() === message.toLowerCase(),
    ) as { response: string } | undefined;

    if (exactMatch) {
      return mockAICall<string>(`chatResponses.${step}.0.response`, {
        delayMs: 1000,
        fallback: exactMatch.response,
      });
    }
  }

  return mockAICall<string>("chatResponses.fallback.response", {
    delayMs: 1500,
    fallback: novaScripts.chatResponses.fallback.response,
  });
}

export function getSimilarityResults(query = "") {
  const normalizedQuery = query.toLowerCase();
  const results = normalizedQuery
    ? kgCitations.filter((citation) =>
        `${citation.rootCause} ${citation.correctiveAction}`.toLowerCase().includes(normalizedQuery),
      )
    : kgCitations;

  return structuredClone(results);
}

