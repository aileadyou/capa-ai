import type { CAPAType, ISO8601, Severity } from "@/types/capa";

export type FindingStatus = "pending_capa" | "capa_in_progress" | "capa_closed" | "overdue";

export type SourceSystem = "Bizzmine" | "Q100+" | "Bizzmine-Complaint" | "eQMS";

export interface Finding {
  id: string;
  type: CAPAType;
  source: SourceSystem;
  shortDescription: string;
  severity: Severity;
  department: string;
  reportedAt: ISO8601;
  status: FindingStatus;
  linkedCapaId?: string;
}

export interface SimilarityResult {
  id: string;
  findingId: string;
  capaId: string;
  type: CAPAType;
  description: string;
  similarityScore: number;
  rootCause: string;
  year: number;
  outcome: "Effective" | "Recurred" | "Ongoing";
}

export interface TopicCluster {
  id: string;
  name: string;
  findingIds: string[];
  trend: "up" | "down" | "stable";
  riskLevel: "Low" | "Medium" | "High";
  severityDistribution: Record<Severity, number>;
  summary: string;
}

