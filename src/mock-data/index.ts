import auditTrailJson from "@/mock-data/audit-trail.json";
import capaCasesJson from "@/mock-data/capa-cases.json";
import correctiveActionsJson from "@/mock-data/corrective-actions.json";
import dashboardStatsJson from "@/mock-data/dashboard-stats.json";
import findingsJson from "@/mock-data/findings.json";
import kgCitationsJson from "@/mock-data/kg-citations.json";
import notificationsJson from "@/mock-data/notifications.json";
import personasJson from "@/mock-data/personas.json";
import preventiveActionsJson from "@/mock-data/preventive-actions.json";
import topicClustersJson from "@/mock-data/topic-clusters.json";
import bizzmineComplaintJson from "@/mock-data/prefills/bizzmine-complaint.json";
import bizzmineDeviationJson from "@/mock-data/prefills/bizzmine-deviation.json";
import q100AuditJson from "@/mock-data/prefills/q100-audit.json";
import caSuggestionsJson from "@/mock-data/nova-scripts/ca-suggestions.json";
import chatResponsesJson from "@/mock-data/nova-scripts/chat-responses.json";
import containmentSuggestionsJson from "@/mock-data/nova-scripts/containment-suggestions.json";
import decisionTreeComplaintJson from "@/mock-data/nova-scripts/decision-tree-complaint-particulate.json";
import fishboneAuditJson from "@/mock-data/nova-scripts/fishbone-audit-documentation.json";
import fiveWhysHepaJson from "@/mock-data/nova-scripts/5whys-hepa.json";
import gateDraftsJson from "@/mock-data/nova-scripts/gate-drafts.json";
import paSuggestionsJson from "@/mock-data/nova-scripts/pa-suggestions.json";
import verificationCoachingJson from "@/mock-data/nova-scripts/verification-coaching.json";
import type { AuditEvent, CAPACase, CorrectiveAction, DashboardStats, DepartmentHeatmapEntry, KGCitation, PreventiveAction, PreFillContext, RecurrenceTrendPoint, RootCauseTrendEntry, TrendDataPoint } from "@/types";
import type { Finding, SimilarityResult, TopicCluster } from "@/types/finding";
import type { Notification } from "@/types/notification";
import type { Persona } from "@/types/persona";

export const personas = personasJson as Persona[];
export const findings = findingsJson as Finding[];
export const capaCases = capaCasesJson as unknown as CAPACase[];
export const correctiveActions = correctiveActionsJson as CorrectiveAction[];
export const preventiveActions = preventiveActionsJson as PreventiveAction[];
export const auditTrail = auditTrailJson as AuditEvent[];
export const notifications = notificationsJson as Notification[];
export const kgCitations = kgCitationsJson as (KGCitation & SimilarityResult)[];
export const topicClusters = topicClustersJson as TopicCluster[];

export const dashboardStats = dashboardStatsJson as {
  stats: DashboardStats;
  findingTrend: TrendDataPoint[];
  typeBreakdown: Array<{ type: "deviation" | "audit" | "complaint"; count: number }>;
  departmentHeatmap: DepartmentHeatmapEntry[];
  rootCauseTrends: RootCauseTrendEntry[];
  recurrenceTrend: RecurrenceTrendPoint[];
};

export const prefills = {
  deviation: bizzmineDeviationJson as PreFillContext,
  audit: q100AuditJson as PreFillContext,
  complaint: bizzmineComplaintJson as PreFillContext,
};

export const novaScripts = {
  fiveWhysHepa: fiveWhysHepaJson,
  fishboneAuditDocumentation: fishboneAuditJson,
  decisionTreeComplaintParticulate: decisionTreeComplaintJson,
  gateDrafts: gateDraftsJson,
  containmentSuggestions: containmentSuggestionsJson,
  correctiveActionSuggestions: caSuggestionsJson,
  preventiveActionSuggestions: paSuggestionsJson,
  verificationCoaching: verificationCoachingJson,
  chatResponses: chatResponsesJson,
};

