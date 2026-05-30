import { Badge } from "@/components/ui/badge";
import type { CAPAStatus } from "@/types";
import type { FindingStatus } from "@/types/finding";
import { formatCAPAStatus, formatFindingStatus } from "@/utils/formatters";

type Status = CAPAStatus | FindingStatus | "open" | "in_progress" | "completed" | "verified";

const statusClassName: Record<string, string> = {
  draft: "border-status-draft/30 bg-status-draft/10 text-status-draft",
  disposisi: "border-status-approval/30 bg-status-approval/10 text-status-approval",
  investigation: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
  approval: "border-status-approval/30 bg-status-approval/10 text-status-approval",
  closed: "border-status-closed/30 bg-status-closed/10 text-status-closed",
  pending_capa: "border-status-draft/30 bg-status-draft/10 text-status-draft",
  capa_in_progress: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
  capa_closed: "border-status-closed/30 bg-status-closed/10 text-status-closed",
  overdue: "border-destructive/30 bg-destructive/10 text-destructive",
  open: "border-status-draft/30 bg-status-draft/10 text-status-draft",
  in_progress: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
  completed: "border-status-closed/30 bg-status-closed/10 text-status-closed",
  verified: "border-status-ready/30 bg-status-ready/10 text-status-ready",
};

function getStatusLabel(status: Status) {
  if (["draft", "disposisi", "investigation", "approval", "closed"].includes(status)) {
    return formatCAPAStatus(status as CAPAStatus);
  }

  if (["pending_capa", "capa_in_progress", "capa_closed", "overdue"].includes(status)) {
    return formatFindingStatus(status as FindingStatus);
  }

  const actionLabels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
    verified: "Verified",
  };
  return actionLabels[status];
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={statusClassName[status] ?? statusClassName.open}>
      {getStatusLabel(status)}
    </Badge>
  );
}

