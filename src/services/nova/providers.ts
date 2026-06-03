import { kgCitations, prefills, novaScripts } from "@/mock-data";
import type { CAPAType, ImpactClassification, PreFillContext, RCAMethod } from "@/types";
import { computeImpact } from "@/utils/impact";
import { mockAICall } from "@/utils/mockAI";
import { getAnalysisPacketByCapaId, getAnalysisPacketByType, getPrefillForType, getPrimarySourceId } from "./contextPackets";
import { buildNovaMessages } from "./prompts";
import {
  containmentSuggestionsSchema,
  gateDraftSchema,
  impactClassificationSchema,
  parseJsonContent,
  rcaResponseSchema,
  stringSuggestionsSchema,
  verificationCoachingSchema,
} from "./schemas";
import type { GateDraftSet, NovaProvider, NovaTaskType } from "./types";

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

async function requestOpenRouter(task: NovaTaskType, messages: ReturnType<typeof buildNovaMessages>, maxTokens = 1200) {
  const response = await fetch("/api/nova", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, messages, maxTokens }),
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok || !payload?.ok || typeof payload.content !== "string") {
    throw new Error(payload?.error ?? "Nova OpenRouter request failed.");
  }
  return payload.content as string;
}

async function requestJsonWithRepair<T>(
  task: NovaTaskType,
  messages: ReturnType<typeof buildNovaMessages>,
  parse: (value: unknown) => T,
  maxTokens?: number,
) {
  const firstContent = await requestOpenRouter(task, messages, maxTokens);
  try {
    return parse(parseJsonContent(firstContent));
  } catch {
    const repairMessages = [
      ...messages,
      { role: "assistant" as const, content: firstContent },
      {
        role: "user" as const,
        content: "Repair the previous response so it is valid JSON matching the requested schema. Return only JSON.",
      },
    ];
    const repairedContent = await requestOpenRouter(task, repairMessages, maxTokens);
    return parse(parseJsonContent(repairedContent));
  }
}

export const mockNovaProvider: NovaProvider = {
  async importSourceData(type, sourceId) {
    if (!validateSourceId(type, sourceId)) {
      throw new Error(`No mocked ${type} source data found for ${sourceId}.`);
    }

    return mockAICall<PreFillContext>(`prefills.${type}`, {
      delayMs: 1500,
      fallback: prefills[type],
    });
  },

  async classifyImpact(prefill) {
    return mockAICall<ImpactClassification>("impact.classification", {
      delayMs: 1000,
      fallback: computeImpact(prefill),
    });
  },

  async draftGateAnswers(type) {
    return mockAICall<GateDraftSet>(`gateDrafts.${type}`, {
      delayMs: 1200,
      fallback: novaScripts.gateDrafts[type] as GateDraftSet,
    });
  },

  async getContainmentSuggestion(capaId) {
    return mockAICall<Array<{ id: string; content: string }>>(`containmentSuggestions.${capaId}`, {
      delayMs: 1500,
      fallback: [],
    });
  },

  async getRCASuggestions(_capaId, method) {
    if (method === "5whys") {
      return mockAICall<RCAResponse>("fiveWhysHepa", { delayMs: 2000 });
    }

    if (method === "fishbone") {
      return mockAICall<RCAResponse>("fishboneAuditDocumentation", { delayMs: 1500 });
    }

    return mockAICall<RCAResponse>("decisionTreeComplaintParticulate", { delayMs: 1500 });
  },

  async getCorrectiveActionSuggestions(capaId) {
    return mockAICall<string[]>(`correctiveActionSuggestions.${capaId}`, {
      delayMs: 2000,
      fallback: [],
    });
  },

  async getPreventiveActionSuggestions(capaId) {
    return mockAICall<string[]>(`preventiveActionSuggestions.${capaId}`, {
      delayMs: 2000,
      fallback: [],
    });
  },

  async getVerificationCoaching(capaId) {
    return mockAICall(`verificationCoaching.${capaId}`, {
      delayMs: 1000,
      fallback: novaScripts.verificationCoaching["CAPA-2026-0341"],
    });
  },

  async getChatResponse(step, message) {
    const scriptedResponses = (novaScripts.chatResponses as Record<string, unknown>)[step];
    const normalizedMessage = message.toLowerCase();

    if (Array.isArray(scriptedResponses)) {
      const match = scriptedResponses.find(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          "prompt" in entry &&
          (String(entry.prompt).toLowerCase() === normalizedMessage ||
            normalizedMessage.includes(String(entry.prompt).toLowerCase().slice(0, 20))),
      ) as { response: string } | undefined;

      if (match) {
        return mockAICall<string>(`chatResponses.${step}.match.response`, {
          delayMs: 1000,
          fallback: match.response,
        });
      }
    }

    return mockAICall<string>("chatResponses.fallback.response", {
      delayMs: 1500,
      fallback: novaScripts.chatResponses.fallback.response,
    });
  },
};

export const openRouterNovaProvider: NovaProvider = {
  async importSourceData(type, sourceId) {
    if (sourceId !== getPrimarySourceId(type)) {
      throw new Error(`No enriched ${type} source data found for ${sourceId}.`);
    }
    return getPrefillForType(type);
  },

  async classifyImpact(prefill) {
    const messages = buildNovaMessages("classify_impact", { prefill });
    return requestJsonWithRepair("classify_impact", messages, (value) => impactClassificationSchema.parse(value), 1200);
  },

  async draftGateAnswers(type) {
    const packet = getAnalysisPacketByType(type);
    const messages = buildNovaMessages("draft_gate_answers", { packet, type, prefill: packet?.sourceData ?? getPrefillForType(type) });
    return requestJsonWithRepair("draft_gate_answers", messages, (value) => gateDraftSchema.parse(value) as GateDraftSet, 1800);
  },

  async getContainmentSuggestion(capaId) {
    const messages = buildNovaMessages("suggest_containment", { packet: getAnalysisPacketByCapaId(capaId) });
    const result = await requestJsonWithRepair("suggest_containment", messages, (value) => containmentSuggestionsSchema.parse(value), 1000);
    return result.suggestions;
  },

  async getRCASuggestions(capaId, method) {
    const messages = buildNovaMessages("suggest_rca", { packet: getAnalysisPacketByCapaId(capaId), method });
    return requestJsonWithRepair("suggest_rca", messages, (value) => rcaResponseSchema.parse(value), 2200);
  },

  async getCorrectiveActionSuggestions(capaId) {
    const messages = buildNovaMessages("suggest_corrective_actions", { packet: getAnalysisPacketByCapaId(capaId) });
    const result = await requestJsonWithRepair("suggest_corrective_actions", messages, (value) => stringSuggestionsSchema.parse(value), 1000);
    return result.suggestions;
  },

  async getPreventiveActionSuggestions(capaId) {
    const messages = buildNovaMessages("suggest_preventive_actions", { packet: getAnalysisPacketByCapaId(capaId) });
    const result = await requestJsonWithRepair("suggest_preventive_actions", messages, (value) => stringSuggestionsSchema.parse(value), 1000);
    return result.suggestions;
  },

  async getVerificationCoaching(capaId) {
    const messages = buildNovaMessages("coach_verification", { packet: getAnalysisPacketByCapaId(capaId) });
    return requestJsonWithRepair("coach_verification", messages, (value) => verificationCoachingSchema.parse(value), 1000);
  },

  async getChatResponse(step, message) {
    const capaIdMatch = step.match(/CAPA-\d{4}-\d{4}/)?.[0];
    const packet = capaIdMatch ? getAnalysisPacketByCapaId(capaIdMatch) : undefined;
    const messages = buildNovaMessages("ask_nova_chat", { packet, step: describeChatStep(step), message });
    return requestOpenRouter("ask_nova_chat", messages, 900);
  },
};

function shouldUseOpenRouter() {
  return import.meta.env.VITE_NOVA_AI_MODE === "openrouter" || import.meta.env.VITE_NOVA_AI_MODE === "fallback";
}

function shouldFallbackToMock() {
  return import.meta.env.VITE_NOVA_AI_MODE !== "openrouter";
}

function describeChatStep(step: string) {
  const [, rawStep = step] = step.split(":");
  const labels: Record<string, string> = {
    "capa-overview": "CAPA overview",
    "d1-problem": "D1 Problem statement",
    "d2-containment": "D2 Containment",
    "d3-rca": "D3 Root cause analysis",
    "d4-ca": "D4 Corrective action",
    "d5-pa": "D5 Preventive action",
    "d6-verification": "D6 Verification",
    "d7-signoff": "D7 Sign-off",
    "capa-intake": "CAPA intake",
    findings: "Findings",
    global: "Global workspace",
  };
  return labels[rawStep] ?? rawStep;
}

export function getNovaProvider(): NovaProvider {
  if (!shouldUseOpenRouter()) return mockNovaProvider;

  async function withFallback<T>(live: () => Promise<T>, mock: () => Promise<T>) {
    try {
      return await live();
    } catch (error) {
      if (!shouldFallbackToMock()) throw error;
      console.info("Nova OpenRouter fallback:", error);
      return mock();
    }
  }

  return {
    importSourceData: (type, sourceId) =>
      withFallback(
        () => openRouterNovaProvider.importSourceData(type, sourceId),
        () => mockNovaProvider.importSourceData(type, sourceId),
      ),
    classifyImpact: (prefill) =>
      withFallback(
        () => openRouterNovaProvider.classifyImpact(prefill),
        () => mockNovaProvider.classifyImpact(prefill),
      ),
    draftGateAnswers: (type) =>
      withFallback(
        () => openRouterNovaProvider.draftGateAnswers(type),
        () => mockNovaProvider.draftGateAnswers(type),
      ),
    getContainmentSuggestion: (capaId) =>
      withFallback(
        () => openRouterNovaProvider.getContainmentSuggestion(capaId),
        () => mockNovaProvider.getContainmentSuggestion(capaId),
      ),
    getRCASuggestions: (capaId, method) =>
      withFallback(
        () => openRouterNovaProvider.getRCASuggestions(capaId, method),
        () => mockNovaProvider.getRCASuggestions(capaId, method),
      ),
    getCorrectiveActionSuggestions: (capaId) =>
      withFallback(
        () => openRouterNovaProvider.getCorrectiveActionSuggestions(capaId),
        () => mockNovaProvider.getCorrectiveActionSuggestions(capaId),
      ),
    getPreventiveActionSuggestions: (capaId) =>
      withFallback(
        () => openRouterNovaProvider.getPreventiveActionSuggestions(capaId),
        () => mockNovaProvider.getPreventiveActionSuggestions(capaId),
      ),
    getVerificationCoaching: (capaId) =>
      withFallback(
        () => openRouterNovaProvider.getVerificationCoaching(capaId),
        () => mockNovaProvider.getVerificationCoaching(capaId),
      ),
    getChatResponse: (step, message) =>
      withFallback(
        () => openRouterNovaProvider.getChatResponse(step, message),
        () => mockNovaProvider.getChatResponse(step, message),
      ),
  };
}

export function getChatPromptsFromScripts(step: string): string[] {
  const scriptedResponses = (novaScripts.chatResponses as Record<string, unknown>)[step];
  if (!Array.isArray(scriptedResponses)) return [];
  return scriptedResponses
    .filter((entry): entry is { prompt: string; response: string } =>
      typeof entry === "object" && entry !== null && "prompt" in entry,
    )
    .map((entry) => entry.prompt);
}

export function getSimilarityResultsFromKg(query = "") {
  const normalizedQuery = query.toLowerCase();
  const results = normalizedQuery
    ? kgCitations.filter((citation) =>
        `${citation.rootCause} ${citation.correctiveAction}`.toLowerCase().includes(normalizedQuery),
      )
    : kgCitations;

  return structuredClone(results);
}
