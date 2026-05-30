import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auditTrail as initialAuditTrail } from "@/mock-data";
import type { AuditEvent } from "@/types";

interface AuditTrailStore {
  events: AuditEvent[];
  addEvent: (
    event: Omit<AuditEvent, "id" | "timestamp"> & Partial<Pick<AuditEvent, "id" | "timestamp">>,
  ) => AuditEvent;
  getEventsByCAPA: (capaId: string) => AuditEvent[];
  resetAuditTrail: () => void;
}

export const useAuditTrailStore = create<AuditTrailStore>()(
  persist(
    (set, get) => ({
      events: structuredClone(initialAuditTrail),
      addEvent: (event) => {
        const newEvent: AuditEvent = {
          ...event,
          id: event.id ?? `AUDIT-${Date.now()}`,
          timestamp: event.timestamp ?? new Date().toISOString(),
        };

        set((state) => ({
          events: [newEvent, ...state.events],
        }));

        return newEvent;
      },
      getEventsByCAPA: (capaId) => get().events.filter((event) => event.capaId === capaId),
      resetAuditTrail: () => set({ events: structuredClone(initialAuditTrail) }),
    }),
    {
      name: "ai-coach-nova-audit-trail",
    },
  ),
);

