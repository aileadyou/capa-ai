import type { CAPAType, ImpactClassification, PreFillContext, RCAMethod } from "@/types";
import type { GateDraftSet } from "@/services/nova/types";
import {
  getChatPromptsFromScripts,
  getNovaProvider,
  getSimilarityResultsFromKg,
  type RCAResponse,
} from "@/services/nova/providers";
export type { GateDraftSet } from "@/services/nova/types";

export async function importSourceData(type: CAPAType, sourceId: string): Promise<PreFillContext> {
  return getNovaProvider().importSourceData(type, sourceId);
}

export async function classifyImpact(prefill: PreFillContext): Promise<ImpactClassification> {
  return getNovaProvider().classifyImpact(prefill);
}

/**
 * Nova reads the imported finding and drafts answers to every gate question so
 * the initiator can review and refine instead of starting from scratch.
 */
export async function draftGateAnswers(type: CAPAType): Promise<GateDraftSet> {
  return getNovaProvider().draftGateAnswers(type);
}

export async function getContainmentSuggestion(capaId: string) {
  return getNovaProvider().getContainmentSuggestion(capaId);
}

export async function getRCASuggestions(capaId: string, method: RCAMethod): Promise<RCAResponse> {
  return getNovaProvider().getRCASuggestions(capaId, method) as Promise<RCAResponse>;
}

export async function getCorrectiveActionSuggestions(capaId: string): Promise<string[]> {
  return getNovaProvider().getCorrectiveActionSuggestions(capaId);
}

export async function getPreventiveActionSuggestions(capaId: string): Promise<string[]> {
  return getNovaProvider().getPreventiveActionSuggestions(capaId);
}

export async function getVerificationCoaching(capaId: string): Promise<{
  Observation: string;
  Recommendation: string;
  "Audit Rationale": string;
}> {
  return getNovaProvider().getVerificationCoaching(capaId);
}

export async function getChatResponse(step: string, message: string): Promise<string> {
  return getNovaProvider().getChatResponse(step, message);
}

export function getChatPrompts(step: string): string[] {
  return getChatPromptsFromScripts(step);
}

export function getSimilarityResults(query = "") {
  return getSimilarityResultsFromKg(query);
}
