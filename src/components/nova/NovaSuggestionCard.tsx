import { useState } from "react";
import { Check, Edit3, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { KGCitation, NovaSuggestionStatus } from "@/types";
import { useAuditTrailStore, useUIStore } from "@/store";

interface NovaSuggestionCardProps {
  id: string;
  capaId?: string;
  context: string;
  content: string;
  citations?: KGCitation[];
  status?: NovaSuggestionStatus;
  replacementContent?: string;
  onStatusChange?: (status: NovaSuggestionStatus, content: string) => void;
}

const statusClassName: Record<NovaSuggestionStatus, string> = {
  pending: "border-muted bg-muted/40 text-muted-foreground",
  accepted: "border-status-ready/30 bg-status-ready/10 text-status-ready",
  edited: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
  replaced: "border-nova/30 bg-nova/10 text-nova",
};

export function NovaSuggestionCard({
  id,
  capaId,
  context,
  content,
  citations = [],
  status = "pending",
  replacementContent,
  onStatusChange,
}: NovaSuggestionCardProps) {
  const [currentStatus, setCurrentStatus] = useState<NovaSuggestionStatus>(status);
  const [draftContent, setDraftContent] = useState(content);
  const addEvent = useAuditTrailStore((state) => state.addEvent);
  const openCitationPanel = useUIStore((state) => state.openCitationPanel);

  const applyStatus = (nextStatus: NovaSuggestionStatus, nextContent: string) => {
    setCurrentStatus(nextStatus);
    setDraftContent(nextContent);
    onStatusChange?.(nextStatus, nextContent);

    addEvent({
      actorName: "Nova Demo User",
      actorRole: "CAPA User",
      domain: "ai_decision",
      eventType:
        nextStatus === "accepted"
          ? "nova_suggestion_accepted"
          : nextStatus === "edited"
            ? "nova_suggestion_edited"
            : "nova_suggestion_replaced",
      action: `Nova suggestion ${id} was ${nextStatus}.`,
      capaId,
      novaMetadata: {
        modelName: "Nova Mock Engine",
        modelVersion: "nova-demo-v1",
        confidenceScore: 84,
      },
    });
  };

  return (
    <div className="rounded border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-nova">
            <Sparkles className="h-4 w-4" />
            Nova Suggestion
          </div>
          <div className="text-xs text-muted-foreground">{context}</div>
        </div>
        <Badge variant="outline" className={statusClassName[currentStatus]}>
          {currentStatus}
        </Badge>
      </div>

      <Textarea
        className="mt-3 min-h-[96px]"
        value={draftContent}
        onChange={(event) => setDraftContent(event.target.value)}
      />

      {citations.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Historical references</div>
          {citations.map((citation) => (
            <button
              key={citation.capaId}
              className="w-full rounded border bg-muted/30 p-2 text-left text-xs transition hover:border-primary/50 hover:bg-primary/5"
              onClick={() => openCitationPanel(citation.capaId)}
            >
              <span className="font-medium text-primary">{citation.capaId}</span>
              {" · "}{citation.similarityScore}% similar · {citation.outcome}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => applyStatus("accepted", draftContent)}>
          <Check className="mr-2 h-4 w-4" />
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyStatus("edited", draftContent)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => applyStatus("replaced", replacementContent ?? content)}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Replace
        </Button>
      </div>
    </div>
  );
}

