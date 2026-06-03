import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceSystem } from "@/types/finding";

const DISPLAY_NAMES: Partial<Record<string, string>> = {
  "Bizzmine-Complaint": "Bizzmine",
  "Bizzmine Complaint": "Bizzmine",
};

export function SourceBadge({ source }: { source: SourceSystem | "Bizzmine Complaint" }) {
  const display = DISPLAY_NAMES[source] ?? source;
  return (
    <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
      <Database className="h-3 w-3" />
      Imported from {display}
    </Badge>
  );
}

