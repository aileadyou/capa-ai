import { findings as initialFindings } from "@/mock-data";
import type { CAPAType } from "@/types";
import type { Finding, FindingStatus } from "@/types/finding";

let findingRecords: Finding[] = structuredClone(initialFindings);

export function getAllFindings(): Finding[] {
  return structuredClone(findingRecords);
}

export function getFindingById(id: string): Finding | undefined {
  const finding = findingRecords.find((record) => record.id === id);
  return finding ? structuredClone(finding) : undefined;
}

export function getFindingsByType(type: CAPAType): Finding[] {
  return structuredClone(findingRecords.filter((record) => record.type === type));
}

export function linkFindingToCAPA(findingId: string, capaId: string): Finding | undefined {
  const finding = findingRecords.find((record) => record.id === findingId);
  if (!finding) return undefined;

  finding.linkedCapaId = capaId;
  finding.status = "capa_in_progress";
  return structuredClone(finding);
}

export function updateFindingStatus(findingId: string, status: FindingStatus): Finding | undefined {
  const finding = findingRecords.find((record) => record.id === findingId);
  if (!finding) return undefined;

  finding.status = status;
  return structuredClone(finding);
}

export function resetFindingData(): Finding[] {
  findingRecords = structuredClone(initialFindings);
  return getAllFindings();
}

