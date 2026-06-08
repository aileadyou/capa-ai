// React Query read hooks. Each wraps an `api.*` call with a stable key.
// Reads return `data | undefined` while loading — consumers already guard for
// the "not found yet" case the same way they did with store selectors.

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { CAPAType } from "@/types";
import type { PersonaID } from "@/types/persona";

export function usePersonas() {
  return useQuery({ queryKey: queryKeys.personas(), queryFn: api.personas, staleTime: Infinity });
}

export function useAiStatus() {
  return useQuery({ queryKey: queryKeys.aiStatus(), queryFn: api.aiStatus, staleTime: Infinity });
}

export function useFindings() {
  return useQuery({ queryKey: queryKeys.findings(), queryFn: api.findings });
}

export function useFinding(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.finding(id ?? ""),
    queryFn: () => api.finding(id as string),
    enabled: Boolean(id),
  });
}

export function useCapas() {
  return useQuery({ queryKey: queryKeys.capas(), queryFn: api.capas });
}

export function useCapa(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.capa(id ?? ""),
    queryFn: () => api.capa(id as string),
    enabled: Boolean(id),
  });
}

export function useCorrectiveActions(capaId?: string) {
  return useQuery({
    queryKey: queryKeys.correctiveActions(capaId),
    queryFn: () => api.correctiveActions(capaId),
  });
}

export function usePreventiveActions(capaId?: string) {
  return useQuery({
    queryKey: queryKeys.preventiveActions(capaId),
    queryFn: () => api.preventiveActions(capaId),
  });
}

export function useAuditEvents(filter?: { capaId?: string; findingId?: string }) {
  return useQuery({
    queryKey: queryKeys.auditEvents(filter),
    queryFn: () => api.auditEvents(filter),
  });
}

export function useNotifications(personaId?: PersonaID) {
  return useQuery({
    queryKey: queryKeys.notifications(personaId),
    queryFn: () => api.notifications(personaId),
  });
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard(), queryFn: api.dashboard });
}

export function useSourceRecord(findingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sourceRecord(findingId ?? ""),
    queryFn: () => api.sourceRecord(findingId as string),
    enabled: Boolean(findingId),
  });
}

export function useAiSuggestion<T = unknown>(
  section: string,
  opts?: { capaType?: CAPAType; capaId?: string; enabled?: boolean },
) {
  const { enabled = true, ...rest } = opts ?? {};
  return useQuery({
    queryKey: queryKeys.aiSuggestion(section, rest.capaId, rest.capaType),
    queryFn: () => api.aiSuggestion<T>(section, rest),
    enabled,
  });
}

export function useLatestFiveWhys(capaId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fiveWhysLatest(capaId ?? ""),
    queryFn: () => api.latestFiveWhys(capaId as string),
    enabled: Boolean(capaId),
  });
}

export function useFiveWhysSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fiveWhysSession(sessionId ?? ""),
    queryFn: () => api.fiveWhysSession(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useChatHistory(capaId: string | undefined, step: string) {
  return useQuery({
    queryKey: queryKeys.chatHistory(capaId, step),
    queryFn: () => api.chatHistory(capaId, step),
  });
}
