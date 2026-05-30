import type { ISO8601 } from "@/types/capa";
import type { PersonaID } from "@/types/persona";

export type AuditDomain = "system" | "ai_decision" | "integration" | "clear_labeling";

export type AuditEventType =
  | "source_imported"
  | "nova_classification"
  | "nova_suggestion_accepted"
  | "nova_suggestion_edited"
  | "nova_suggestion_replaced"
  | "problem_updated"
  | "containment_added"
  | "root_cause_confirmed"
  | "corrective_action_added"
  | "preventive_action_added"
  | "verification_completed"
  | "esignature_submitted"
  | "capa_approved"
  | "capa_closed"
  | "notification_sent";

export interface AuditEvent {
  id: string;
  timestamp: ISO8601;
  actorPersonaId?: PersonaID;
  actorName: string;
  actorRole: string;
  domain: AuditDomain;
  eventType: AuditEventType;
  action: string;
  capaId?: string;
  findingId?: string;
  before?: string;
  after?: string;
  novaMetadata?: {
    modelName: "Nova Mock Engine";
    modelVersion: "nova-demo-v1";
    confidenceScore: number;
  };
}

