import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/types";

const severityClassName: Record<Severity, string> = {
  Ungraded: "border-border bg-field text-foreground-tertiary",
  Minor: "border-severity-minor/30 bg-severity-minor/10 text-severity-minor",
  Major: "border-severity-major/30 bg-severity-major/10 text-severity-major",
  Critical: "border-severity-critical/30 bg-severity-critical/10 text-severity-critical",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant="outline" className={`w-[76px] justify-center ${severityClassName[severity]}`}>
      {severity}
    </Badge>
  );
}

