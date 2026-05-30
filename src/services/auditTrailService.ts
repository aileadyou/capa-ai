import { auditTrail as initialAuditTrail } from "@/mock-data";
import type { AuditDomain, AuditEvent, AuditEventType } from "@/types";

export interface AuditTrailFilters {
  domain?: AuditDomain;
  eventType?: AuditEventType;
  capaId?: string;
  findingId?: string;
  actorName?: string;
  dateFrom?: string;
  dateTo?: string;
}

let auditEventRecords: AuditEvent[] = structuredClone(initialAuditTrail);

export function getAllAuditEvents(): AuditEvent[] {
  return structuredClone(
    [...auditEventRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  );
}

export function getAuditEventsByCAPA(capaId: string): AuditEvent[] {
  return getAllAuditEvents().filter((event) => event.capaId === capaId);
}

export function addAuditEvent(event: Omit<AuditEvent, "id" | "timestamp"> & Partial<Pick<AuditEvent, "id" | "timestamp">>): AuditEvent {
  const newEvent: AuditEvent = {
    ...event,
    id: event.id ?? `AUDIT-${Date.now()}`,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  auditEventRecords = [newEvent, ...auditEventRecords];
  return structuredClone(newEvent);
}

export function filterAuditEvents(filters: AuditTrailFilters): AuditEvent[] {
  return getAllAuditEvents().filter((event) => {
    if (filters.domain && event.domain !== filters.domain) return false;
    if (filters.eventType && event.eventType !== filters.eventType) return false;
    if (filters.capaId && event.capaId !== filters.capaId) return false;
    if (filters.findingId && event.findingId !== filters.findingId) return false;
    if (filters.actorName && !event.actorName.toLowerCase().includes(filters.actorName.toLowerCase())) {
      return false;
    }
    if (filters.dateFrom && new Date(event.timestamp) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(event.timestamp) > new Date(filters.dateTo)) return false;
    return true;
  });
}

export function resetAuditTrailData(): AuditEvent[] {
  auditEventRecords = structuredClone(initialAuditTrail);
  return getAllAuditEvents();
}

