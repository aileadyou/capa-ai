import { CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemLogToastProps {
  action: string;
  timestamp: string;
  auditId: string;
  className?: string;
}

export const SystemLogToast = ({ action, timestamp, auditId, className }: SystemLogToastProps) => {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded text-sm system-log-flash",
      className
    )}>
      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{action}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timestamp}
          </span>
          <span className="font-mono">Audit #{auditId}</span>
        </div>
      </div>
    </div>
  );
};
