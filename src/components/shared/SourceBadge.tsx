import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceSystem } from "@/types/finding";

export function SourceBadge({ source }: { source: SourceSystem | "Bizzmine Complaint" }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
      <Database className="h-3 w-3" />
      Imported from {source}
    </Badge>
  );
}

