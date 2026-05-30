import {
  Bell,
  ClipboardCheck,
  FileSearch,
  GitCompare,
  LayoutDashboard,
  ListChecks,
  Network,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
} from "lucide-react";

export const goldenFindingIds = [
  "DEV-2026-0341",
  "AUD-2026-0089",
  "CMP-2026-0112",
] as const;

export const goldenCapaIds = [
  "CAPA-2026-0341",
  "CAPA-2026-0089",
  "CAPA-2026-0112",
] as const;

export const eightDSteps = [
  "problem",
  "containment",
  "rca",
  "ca",
  "pa",
  "verification",
  "signoff",
] as const;

export type EightDStepRoute = (typeof eightDSteps)[number];

export const primaryNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Findings", url: "/findings", icon: FileSearch },
  { title: "CAPA", url: "/capa", icon: ShieldCheck },
  { title: "Corrective Actions", url: "/actions/corrective", icon: ClipboardCheck },
  { title: "Preventive Actions", url: "/actions/preventive", icon: ListChecks },
  { title: "Consolidated Plan", url: "/actions/consolidated", icon: GitCompare },
  { title: "Similarity", url: "/similarity", icon: Network },
  { title: "Topics", url: "/topics", icon: Tags },
  { title: "Audit Trail", url: "/audit-trail", icon: ScrollText },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Personas", url: "/settings/personas", icon: Settings },
] as const;

