import type { CAPAType, Severity } from "@/types/capa";

export interface DashboardStats {
  totalFindingsMTD: number;
  openCapas: number;
  overdueCapas: number;
  effectivenessRate: number;
}

export interface TrendDataPoint {
  label: string;
  deviation: number;
  audit: number;
  complaint: number;
}

export interface DepartmentHeatmapEntry {
  department: string;
  completionRate: number;
  openCapas: number;
  overdueCapas: number;
}

export interface RootCauseTrendEntry {
  category: string;
  count: number;
  recurringCount: number;
}

export interface TypeBreakdownEntry {
  type: CAPAType;
  count: number;
}

export interface SeverityBreakdownEntry {
  severity: Severity;
  count: number;
}

export interface RecurrenceTrendPoint {
  label: string;
  recurred: number;
  newFindings: number;
}

