import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useAuditTrailStore } from "@/store";

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
  /** Called when user skips the suggestion */
  onSkip?: () => void;
}

type Mode = "idle" | "editing" | "accepted" | "skipped";

export function NovaSuggestionBlock({
  context,
  suggestion,
  reasoning,
  capaId,
  suggestionId = "block",
  onAccept,
  onSkip,
}: NovaSuggestionBlockProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [draft, setDraft] = useState(suggestion);
  const [showReasoning, setShowReasoning] = useState(false);
  const addEvent = useAuditTrailStore((state) => state.addEvent);

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

  function handleSkip() {
    setMode("skipped");
    onSkip?.();
    if (capaId) {
      addEvent({
        actorName: "Nova Demo User",
        actorRole: "CAPA User",
        domain: "ai_decision",
        eventType: "nova_suggestion_replaced",
        action: `Nova suggestion ${suggestionId} skipped.`,
        capaId,
        novaMetadata: {
          modelName: "Nova Mock Engine",
          modelVersion: "nova-demo-v1",
          confidenceScore: 84,
        },
      });
    }
  }

  // ── Skipped state ────────────────────────────────────────────────────────
  if (mode === "skipped") {
    return (
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--r-sm)",
          background: "var(--bg-2)",
          border: "1px solid var(--line-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={12} style={{ color: "var(--fg-4)" }} />
          <span style={{ fontSize: "12px", color: "var(--fg-4)", fontFamily: "var(--font-sans)" }}>
            Nova suggestion skipped
          </span>
        </div>
        <button
          onClick={() => { setMode("idle"); setDraft(suggestion); }}
          style={{
            fontSize: "11px",
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          Restore
        </button>
      </div>
    );
  }

  // ── Accepted state ───────────────────────────────────────────────────────
  if (mode === "accepted") {
    return (
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--r-sm)",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-line)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Sparkles size={12} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
          Nova suggestion applied
        </span>
        <span style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
          — edit the field below to refine
        </span>
      </div>
    );
  }

  // ── Idle / Editing state ─────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "var(--bg-3)",
        borderLeft: "3px solid var(--accent)",
        borderRadius: "var(--r-md)",
        padding: "14px 16px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <Sparkles size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--accent)",
            textTransform: "uppercase",
          }}
        >
          Nova Suggestion
        </span>
        {context && (
          <span style={{ fontSize: "12px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
            — {context}
          </span>
        )}
        {reasoning && (
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "11px",
              color: "var(--fg-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            {showReasoning ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Show reasoning
          </button>
        )}
      </div>

      {/* Collapsible reasoning */}
      {showReasoning && reasoning && (
        <div
          style={{
            background: "var(--bg-4)",
            borderRadius: "var(--r-sm)",
            padding: "10px 12px",
            marginBottom: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            lineHeight: "1.65",
            color: "var(--fg-3)",
          }}
        >
          {reasoning}
        </div>
      )}

      {/* Suggestion text or edit textarea */}
      {mode === "editing" ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            background: "var(--bg-4)",
            border: "1px solid var(--accent-line)",
            borderRadius: "var(--r-sm)",
            padding: "10px 12px",
            fontSize: "13px",
            lineHeight: "1.65",
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            resize: "vertical",
            outline: "none",
            marginBottom: "12px",
            boxSizing: "border-box",
            boxShadow: "0 0 0 3px var(--accent-soft)",
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      ) : (
        <p
          style={{
            fontSize: "13px",
            lineHeight: "1.65",
            color: "var(--fg-2)",
            margin: "0 0 12px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {draft}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {mode === "editing" ? (
          <>
            <button
              onClick={handleAccept}
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Apply edit
            </button>
            <button
              onClick={() => { setMode("idle"); setDraft(suggestion); }}
              style={{
                background: "transparent",
                color: "var(--fg-3)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAccept}
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Use this suggestion
            </button>
            <button
              onClick={() => setMode("editing")}
              style={{
                background: "var(--bg-4)",
                color: "var(--fg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Edit first
            </button>
            <button
              onClick={handleSkip}
              style={{
                background: "transparent",
                color: "var(--fg-3)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
