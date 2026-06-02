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
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--r-sm)",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-line)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={12} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
            Nova suggestion applied
          </span>
          <span style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
            — edit the field below to refine
          </span>
        </div>
        <p style={{ margin: 0, color: "var(--fg-2)", fontSize: "12px", lineHeight: 1.6, fontFamily: "var(--font-sans)" }}>
          {draft}
        </p>
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
            letterSpacing: "0.18em",
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
            background: "var(--field-bg)",
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
            background: "var(--field-bg)",
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
              onClick={handleDiscussWithNova}
              style={{
                background: "var(--field-bg)",
                color: "var(--fg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
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
