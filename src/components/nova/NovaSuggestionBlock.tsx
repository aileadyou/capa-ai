import { useState } from "react";
import { ChevronDown, ChevronRight, MessageSquareText, Sparkles } from "lucide-react";
import { useAuditTrailStore, useUIStore } from "@/store";

interface NovaSuggestionBlockProps {
  /** Short label for what this suggestion is about, e.g. "Why 1 answer" */
  context?: string;
  /** The Nova-generated suggestion text */
  suggestion: string;
  /** Optional reasoning shown in a collapsible mono section */
  reasoning?: string;
  /** CAPA ID for audit trail logging */
  capaId?: string;
  /** Unique ID for this suggestion (used in audit trail) */
  suggestionId?: string;
  /** Called when user accepts the suggestion (as-is or after editing) */
  onAccept?: (content: string) => void;
}

type Mode = "idle" | "editing" | "accepted";

export function NovaSuggestionBlock({
  context,
  suggestion,
  reasoning,
  capaId,
  suggestionId = "block",
  onAccept,
}: NovaSuggestionBlockProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [draft, setDraft] = useState(suggestion);
  const [showReasoning, setShowReasoning] = useState(false);
  const addEvent = useAuditTrailStore((state) => state.addEvent);
  const openNovaChat = useUIStore((state) => state.openNovaChat);

  function handleAccept() {
    setMode("accepted");
    onAccept?.(draft);
    if (capaId) {
      addEvent({
        actorName: "Nova Demo User",
        actorRole: "CAPA User",
        domain: "ai_decision",
        eventType: "nova_suggestion_accepted",
        action: `Nova suggestion ${suggestionId} accepted.`,
        capaId,
        novaMetadata: {
          modelName: "Nova Mock Engine",
          modelVersion: "nova-demo-v1",
          confidenceScore: 84,
        },
      });
    }
  }

  function handleDiscussWithNova() {
    const label = context ?? "Nova suggestion";
    openNovaChat({
      capaId,
      step: suggestionId,
      source: "nova-suggestion",
      suggestionId,
      suggestionContext: label,
      suggestionText: draft,
      initialDraft: `Help me review this ${label}. What should I ask or improve before using it?`,
    });
    if (capaId) {
      addEvent({
        actorName: "Nova Demo User",
        actorRole: "CAPA User",
        domain: "ai_decision",
        eventType: "nova_suggestion_replaced",
        action: `Nova suggestion ${suggestionId} opened in Ask Nova for discussion.`,
        capaId,
        novaMetadata: {
          modelName: "Nova Mock Engine",
          modelVersion: "nova-demo-v1",
          confidenceScore: 84,
        },
      });
    }
  }

  // ── Accepted state ───────────────────────────────────────────────────────
  if (mode === "accepted") {
    return (
      <div className="flex flex-col items-start gap-2 rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-primary" />
          <span className="font-sans text-xs font-semibold text-primary">
            Nova suggestion applied
          </span>
          <span className="font-sans text-[11px] text-foreground-tertiary">
            — edit the field below to refine
          </span>
        </div>
        <p className="m-0 font-sans text-xs leading-[1.6] text-foreground-secondary">
          {draft}
        </p>
      </div>
    );
  }

  // ── Idle / Editing state ─────────────────────────────────────────────────
  return (
    <div className="rounded-[var(--r-md)] border-l-[3px] border-l-primary bg-primary/5 px-4 py-3.5">
      {/* Header row */}
      <div className="mb-2.5 flex items-center gap-2">
        <Sparkles size={14} className="shrink-0 text-primary" />
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Nova Suggestion
        </span>
        {context && (
          <span className="font-sans text-xs text-foreground">
            — {context}
          </span>
        )}
        {reasoning && (
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="ml-auto flex cursor-pointer items-center gap-[3px] border-0 bg-transparent p-0 font-sans text-[11px] text-foreground-tertiary"
          >
            {showReasoning ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Show reasoning
          </button>
        )}
      </div>

      {/* Collapsible reasoning */}
      {showReasoning && reasoning && (
        <div className="mb-2.5 rounded-[var(--r-sm)] bg-[var(--field-bg)] px-3 py-2.5 font-sans text-[11px] leading-[1.65] text-foreground-tertiary">
          {reasoning}
        </div>
      )}

      {/* Suggestion text or edit textarea */}
      {mode === "editing" ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="mb-3 box-border w-full resize-y rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--field-bg)] px-3 py-2.5 font-sans text-[13px] leading-[1.65] text-foreground outline-none shadow-[0_0_0_3px_var(--accent-soft)]"
          autoFocus
        />
      ) : (
        <p className="mb-3 mt-0 font-sans text-[13px] leading-[1.65] text-foreground-secondary">
          {draft}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {mode === "editing" ? (
          <>
            <button
              onClick={handleAccept}
              className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-primary px-3.5 py-1.5 font-sans text-xs font-semibold text-primary-foreground"
            >
              Apply edit
            </button>
            <button
              onClick={() => { setMode("idle"); setDraft(suggestion); }}
              className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-transparent px-3 py-1.5 font-sans text-xs text-foreground-tertiary"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAccept}
              className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-primary px-3.5 py-1.5 font-sans text-xs font-semibold text-primary-foreground"
            >
              Use this suggestion
            </button>
            <button
              onClick={handleDiscussWithNova}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-1.5 font-sans text-xs text-foreground-secondary"
            >
              <MessageSquareText size={12} />
              Discuss with Nova
            </button>
          </>
        )}
      </div>
    </div>
  );
}
