import { ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIDataCardProps {
  title: string;
  value: string;
  confidence: number;
  source?: string;
  sourceRef?: string;
  className?: string;
}

export const AIDataCard = ({
  title,
  value,
  confidence,
  source,
  sourceRef,
  className,
}: AIDataCardProps) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "bg-success";
    if (conf >= 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className={cn("data-card space-y-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {source && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  <span className="font-medium">Source:</span> {source}
                  {sourceRef && (
                    <>
                      <br />
                      <span className="font-medium">Ref:</span> {sourceRef}
                    </>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{value}</p>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 flex-1">
          <div className="confidence-bar flex-1">
            <div
              className={cn("confidence-bar-fill", getConfidenceColor(confidence))}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground w-10 text-right">
            {confidence}%
          </span>
        </div>
      </div>
    </div>
  );
};
