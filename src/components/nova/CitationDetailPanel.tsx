import { ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store";
import { kgCitations } from "@/mock-data";
import { useDialog } from "@/hooks/use-dialog";
import type { KGCitation } from "@/types";

function outcomeClass(outcome: KGCitation["outcome"]) {
  if (outcome === "Effective") return "border-status-ready/30 bg-status-ready/10 text-status-ready";
  if (outcome === "Recurred") return "border-severity-critical/30 bg-severity-critical/10 text-severity-critical";
  return "border-status-investigation/30 bg-status-investigation/10 text-status-investigation";
}

function sourceTypeLabel(sourceType: KGCitation["sourceType"]) {
  const labels: Record<string, string> = {
    deviation: "Deviation",
    audit: "Audit Finding",
    complaint: "Complaint",
  };
  return labels[sourceType] ?? sourceType;
}

export function CitationDetailPanel() {
  const isOpen = useUIStore((state) => state.isCitationPanelOpen);
  const activeCitationId = useUIStore((state) => state.activeCitationId);
  const closeCitationPanel = useUIStore((state) => state.closeCitationPanel);
  const { ref: panelRef } = useDialog<HTMLElement>(isOpen, closeCitationPanel);

  if (!isOpen) return null;

  const citation = (kgCitations as KGCitation[]).find(
    (c) => c.capaId === activeCitationId,
  );

  return (
    <>
      <div
        className="motion-backdrop lead-overlay fixed inset-0 z-30"
        onClick={closeCitationPanel}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-panel-title"
        tabIndex={-1}
        style={{ overscrollBehavior: "contain" }}
        className="motion-slide-over fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div id="citation-panel-title" className="text-sm font-semibold">Historical CAPA Reference</div>
          <Button variant="ghost" size="icon" aria-label="Close reference panel" onClick={closeCitationPanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!citation ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            Citation data not found.
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={outcomeClass(citation.outcome)}>
                {citation.outcome}
              </Badge>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                {sourceTypeLabel(citation.sourceType)}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {citation.year}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                CAPA ID
              </div>
              <div className="font-mono text-sm font-semibold">{citation.capaId}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Finding ID
              </div>
              <div className="font-mono text-sm">{citation.deviationId}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Similarity Score
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-nova"
                    style={{ width: `${citation.similarityScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-nova">
                  {citation.similarityScore}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Root Cause
              </div>
              <p className="rounded border bg-muted/30 p-3 text-sm leading-6">
                {citation.rootCause}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Corrective Action Taken
              </div>
              <p className="rounded border bg-muted/30 p-3 text-sm leading-6">
                {citation.correctiveAction}
              </p>
            </div>

            <div className="rounded border border-nova/20 bg-nova/5 p-3 text-xs leading-5 text-muted-foreground">
              This reference was retrieved by Nova from the internal quality knowledge graph. It matched this case based on root cause similarity, source type, and department context.
            </div>

            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={`/similarity`} onClick={closeCitationPanel}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Similarity Explorer
              </Link>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
