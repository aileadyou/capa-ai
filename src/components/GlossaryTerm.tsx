import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

interface GlossaryTermProps {
  term: string;
  children?: ReactNode;
  definition: string;
}

export const GlossaryTerm = ({ term, children, definition }: GlossaryTermProps) => {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate("/stream/glossary")}
            className="underline decoration-dotted decoration-primary/50 hover:decoration-primary hover:text-primary transition-colors cursor-help inline-flex items-center gap-1"
          >
            {children || term}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">{term}</p>
          <p className="text-sm">{definition}</p>
          <p className="text-xs text-muted-foreground mt-2">Click to view full glossary</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
