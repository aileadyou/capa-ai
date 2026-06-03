import type { CAPAType, GateQuestionID, ImpactClassification, PreFillContext, RCAMethod } from "@/types";

export type NovaTaskType =
  | "draft_gate_answers"
  | "classify_impact"
  | "suggest_containment"
  | "suggest_rca"
  | "suggest_corrective_actions"
  | "suggest_preventive_actions"
  | "coach_verification"
  | "ask_nova_chat"
  | "similarity_context_summary";

export interface GateDraftSet {
  sourceLabel: string;
  confidence: number;
  answers: Record<GateQuestionID, string>;
}

export interface NovaFindingAnalysisPacket {
  findingId: string;
  capaId: string;
  type: CAPAType;
  sourceLabel: string;
  findingSummary: string;
  sourceData: PreFillContext;
  currentCapaState: {
    title: string;
    status: string;
    currentStep: string;
    department: string;
    scoreTotal: number;
  };
  gateAnswers: Array<{ questionId: GateQuestionID; question: string; answer: string }>;
  rootCauses: string[];
  similarCapas: Array<{
    capaId: string;
    sourceId: string;
    similarityScore: number;
    rootCause: string;
    correctiveAction: string;
    outcome: string;
    year: number;
  }>;
  auditReadyConstraints: string[];
}

export interface NovaProvider {
  importSourceData(type: CAPAType, sourceId: string): Promise<PreFillContext>;
  classifyImpact(prefill: PreFillContext): Promise<ImpactClassification>;
  draftGateAnswers(type: CAPAType): Promise<GateDraftSet>;
  getContainmentSuggestion(capaId: string): Promise<Array<{ id: string; content: string }>>;
  getRCASuggestions(capaId: string, method: RCAMethod): Promise<unknown>;
  getCorrectiveActionSuggestions(capaId: string): Promise<string[]>;
  getPreventiveActionSuggestions(capaId: string): Promise<string[]>;
  getVerificationCoaching(capaId: string): Promise<{
    Observation: string;
    Recommendation: string;
    "Audit Rationale": string;
  }>;
  getChatResponse(step: string, message: string): Promise<string>;
}
