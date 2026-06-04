import type { CAPAStatus, CAPAType, Severity } from "@/types";
import type { FindingStatus } from "@/types/finding";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatRelativeTime(value: string, referenceDate = new Date()): string {
  const diffMs = new Date(value).getTime() - referenceDate.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const absoluteMinutes = Math.abs(diffMinutes);

  if (absoluteMinutes < 60) return diffMinutes < 0 ? `${absoluteMinutes} min ago` : `in ${absoluteMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return diffHours < 0 ? `${Math.abs(diffHours)} hours ago` : `in ${diffHours} hours`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays < 0 ? `${Math.abs(diffDays)} days ago` : `in ${diffDays} days`;
}

export function formatCAPAStatus(status: CAPAStatus): string {
  const labels: Record<CAPAStatus, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    revision_requested: "Revision Requested",
    rejected: "Rejected",
    investigation: "Investigation",
    approval: "Approval",
    closed: "Closed",
  };
  return labels[status];
}

export function formatFindingStatus(status: FindingStatus): string {
  const labels: Record<FindingStatus, string> = {
    pending_capa: "Pending CAPA",
    pending_review: "Under Review",
    capa_in_progress: "CAPA In Progress",
    capa_closed: "CAPA Closed",
    overdue: "Overdue",
    rejected: "Rejected",
  };
  return labels[status];
}

export function formatSeverity(severity: Severity): string {
  return severity;
}

export function formatCAPAType(type: CAPAType): string {
  const labels: Record<CAPAType, string> = {
    deviation: "Deviation",
    audit: "Audit Finding",
    complaint: "Complaint",
  };
  return labels[type];
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

