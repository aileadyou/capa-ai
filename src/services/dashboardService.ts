import { capaCases, dashboardStats, findings, topicClusters } from "@/mock-data";

export function getDashboardStats() {
  return structuredClone(dashboardStats.stats);
}

export function getFindingTrend() {
  return structuredClone(dashboardStats.findingTrend);
}

export function getTypeBreakdown() {
  return structuredClone(dashboardStats.typeBreakdown);
}

export function getDepartmentHeatmap() {
  return structuredClone(dashboardStats.departmentHeatmap);
}

export function getRootCauseTrends() {
  return structuredClone(dashboardStats.rootCauseTrends);
}

export function getRecurrenceTrend() {
  return structuredClone(dashboardStats.recurrenceTrend);
}

export function getLatestFindings(limit = 5) {
  return structuredClone(
    [...findings]
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
      .slice(0, limit),
  );
}

export function getDashboardAlerts() {
  return structuredClone(
    capaCases
      .filter((capa) => capa.status !== "closed" || !capa.score.isAuditReady)
      .map((capa) => ({
        id: capa.id,
        title: capa.title,
        status: capa.status,
        score: capa.score.total,
        assignedTo: capa.assignedTo,
      }))
      .slice(0, 5),
  );
}

export function getTopicClusterSummary() {
  return structuredClone(topicClusters);
}

