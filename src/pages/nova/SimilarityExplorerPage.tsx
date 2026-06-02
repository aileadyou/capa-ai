/**
 * SimilarityExplorerPage — AI-powered historical CAPA search (wireframe section 18)
 *
 * Standalone page for freeform semantic search across historical CAPA patterns.
 * Used by QA Managers to identify recurring quality signals and compare outcomes.
 */

import { useMemo, useState } from "react";
import { BrainCircuit, Loader2, X } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterSearchInput, FilterSelect } from "@/components/shared/FilterControls";
import { TypePill } from "@/components/shared/TypePill";
import { kgCitations } from "@/mock-data";
import type { CAPAType, KGCitation } from "@/types";
import { formatCAPAType } from "@/utils/formatters";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "all";
type OutcomeFilter = KGCitation["outcome"] | typeof ALL;
type TypeFilter = CAPAType | typeof ALL;

const OUTCOME_COLORS: Record<KGCitation["outcome"], { bg: string; border: string; text: string }> = {
  Effective: { bg: "var(--success-soft)", border: "color-mix(in srgb, var(--success) 38%, transparent)", text: "var(--success)" },
  Recurred: { bg: "var(--danger-soft)", border: "color-mix(in srgb, var(--danger) 38%, transparent)", text: "var(--danger)" },
  Ongoing: { bg: "var(--accent-soft)", border: "var(--accent-line)", text: "var(--accent)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function searchSimilarity(query: string): KGCitation[] {
  const q = query.trim().toLowerCase();
  const results = structuredClone(kgCitations) as KGCitation[];
  if (!q) return results;

  const matched = results.filter((c) =>
    [c.deviationId, c.capaId, c.rootCause, c.correctiveAction, c.outcome, c.sourceType, String(c.year)]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );

  if (matched.length > 0) return matched;

  // Fallback: return all with decayed scores
  return results
    .map((c, i) => ({ ...c, similarityScore: Math.max(70, c.similarityScore - i * 3) }))
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

function similarityColor(score: number): string {
  if (score >= 85) return "var(--success)";
  if (score >= 70) return "var(--warning)";
  return "var(--fg-3)";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: KGCitation["outcome"] }) {
  const colors = OUTCOME_COLORS[outcome];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      {outcome}
    </span>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({
  citation,
  onClose,
}: {
  citation: KGCitation;
  onClose: () => void;
}) {
  const { ref } = useDialog<HTMLDivElement>(true, onClose);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--glass-dark)",
          backdropFilter: "blur(2px)",
          zIndex: 999,
          animation: "fadeIn var(--dur-tab) var(--ease-out)",
        }}
      />
      {/* Panel */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="similarity-detail-title"
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "520px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflow: "auto",
          overscrollBehavior: "contain",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 1000,
          animation: "leadReveal var(--dur-tab) var(--ease-out)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--line-1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div id="similarity-detail-title" style={{ fontSize: "16px", fontWeight: 600, color: "var(--fg-1)", fontFamily: "var(--font-sans)" }}>
              {citation.capaId}
            </div>
            <div style={{ fontSize: "12px", color: "var(--fg-3)", marginTop: "2px" }}>
              Historical CAPA similarity detail
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-3)",
              padding: "4px",
              borderRadius: "var(--r-sm)",
            }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            {[
              ["Source ID", citation.deviationId],
              ["Similarity", `${citation.similarityScore}%`],
              ["Type", formatCAPAType(citation.sourceType)],
              ["Outcome", citation.outcome],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  background: "var(--bg-3)",
                  borderRadius: "var(--r-sm)",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--fg-3)",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: "13px", color: "var(--fg-1)", fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Root cause */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-3)",
                marginBottom: "6px",
              }}
            >
              Root cause
            </div>
            <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: "1.6", margin: 0 }}>
              {citation.rootCause}
            </p>
          </div>

          {/* Corrective action */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-3)",
                marginBottom: "6px",
              }}
            >
              Corrective action
            </div>
            <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: "1.6", margin: 0 }}>
              {citation.correctiveAction}
            </p>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              background: "var(--bg-3)",
              borderRadius: "var(--r-sm)",
              padding: "12px 14px",
              fontSize: "12px",
              color: "var(--fg-3)",
              lineHeight: "1.5",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            Nova uses this case as a contextual citation only. The current CAPA still requires user confirmation and audit-ready evidence.
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function SimilarityExplorerPage() {
  const [query, setQuery] = useState(
    "Environmental monitoring excursion in Grade A filling area with HEPA filter interval concern",
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<KGCitation[]>([]);
  const [minSimilarity, setMinSimilarity] = useState(75);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>(ALL);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL);
  const [yearFilter, setYearFilter] = useState<string>(ALL);
  const [selectedResult, setSelectedResult] = useState<KGCitation | undefined>();

  const years = useMemo(
    () => Array.from(new Set(kgCitations.map((c) => String(c.year)))).sort((a, b) => Number(b) - Number(a)),
    [],
  );

  const filteredResults = useMemo(
    () =>
      results.filter((r) => {
        if (r.similarityScore < minSimilarity) return false;
        if (outcomeFilter !== ALL && r.outcome !== outcomeFilter) return false;
        if (typeFilter !== ALL && r.sourceType !== typeFilter) return false;
        if (yearFilter !== ALL && String(r.year) !== yearFilter) return false;
        return true;
      }),
    [minSimilarity, outcomeFilter, results, typeFilter, yearFilter],
  );

  async function runSearch() {
    setIsSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    setResults(searchSimilarity(query));
    setHasSearched(true);
    setIsSearching(false);
  }

  return (
    <div className="animate-page-enter" style={{ maxWidth: "1200px" }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Similarity explorer
        </h1>
        <p style={{ fontSize: "13px", color: "var(--fg-3)", marginTop: "6px", maxWidth: "620px", lineHeight: "1.5" }}>
          Search historical CAPA patterns by finding description, root cause, corrective action, outcome, and source type.
        </p>
      </div>

      {/* ── Search card ───────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-sm)",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-3)",
            marginBottom: "10px",
          }}
        >
          AI search
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <FilterSearchInput
              value={query}
              onChange={setQuery}
              onEnter={() => {
                if (!isSearching) runSearch();
              }}
              placeholder="Describe a finding to search for similar historical CAPAs"
              ariaLabel="Search historical CAPA similarity"
            />
          </div>
          {/* Button */}
          <button
            onClick={runSearch}
            disabled={isSearching}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "0 20px",
              height: "40px",
              background: isSearching ? "var(--bg-4)" : "var(--grad-brand)",
              color: isSearching ? "var(--fg-3)" : "var(--on-accent)",
              border: "none",
              borderRadius: "var(--r-sm)",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: isSearching ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              transition: "filter var(--dur-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => { if (!isSearching) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {isSearching ? (
              <Loader2 size={14} strokeWidth={1.75} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <BrainCircuit size={14} strokeWidth={1.75} />
            )}
            {isSearching ? "Searching…" : "AI Search"}
          </button>
        </div>

        {/* Loading indicator */}
        {isSearching && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--accent)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Loader2 size={13} strokeWidth={1.75} style={{ animation: "spin 1s linear infinite" }} />
            Nova is searching historical CAPA similarity…
          </div>
        )}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-sm)",
          padding: "16px 20px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "12px", alignItems: "end" }}>
          {/* Similarity slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Min similarity
              </span>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-1)" }}>
                {minSimilarity}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={1}
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              style={{
                width: "100%",
                height: "4px",
                accentColor: "var(--accent)",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Outcome */}
          <FilterSelect
            value={outcomeFilter}
            onChange={(v) => setOutcomeFilter(v as OutcomeFilter)}
            ariaLabel="Filter by outcome"
            options={[
              { value: ALL, label: "All outcomes" },
              { value: "Effective", label: "Effective" },
              { value: "Recurred", label: "Recurred" },
              { value: "Ongoing", label: "Ongoing" },
            ]}
          />

          {/* Type */}
          <FilterSelect
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TypeFilter)}
            ariaLabel="Filter by type"
            options={[
              { value: ALL, label: "All types" },
              { value: "deviation", label: "Deviation" },
              { value: "audit", label: "Audit Finding" },
              { value: "complaint", label: "Complaint" },
            ]}
          />

          {/* Year */}
          <FilterSelect
            value={yearFilter}
            onChange={setYearFilter}
            ariaLabel="Filter by year"
            options={[{ value: ALL, label: "All years" }, ...years.map((y) => ({ value: y, label: y }))]}
          />
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────── */}
      {!hasSearched && (
        <EmptyState
          title="Ready to search"
          description="Enter a finding description and run AI Search to compare it with historical CAPA patterns."
        />
      )}

      {hasSearched && (
        <>
          {/* Result count */}
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              marginBottom: "12px",
            }}
          >
            {filteredResults.length} match{filteredResults.length !== 1 ? "es" : ""}
          </div>

          {filteredResults.length === 0 ? (
            <EmptyState
              title="No similarity results"
              description="No similarity results match the current filters."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "12px" }}>
              {filteredResults.map((citation) => (
                <div
                  key={`${citation.capaId}-${citation.deviationId}`}
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line-2)",
                    borderRadius: "var(--r-lg)",
                    boxShadow: "var(--shadow-sm)",
                    padding: "18px",
                    transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-3)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                  onClick={() => setSelectedResult(citation)}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg-1)" }}>{citation.capaId}</div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", marginTop: "2px" }}>
                        {citation.deviationId}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        color: similarityColor(citation.similarityScore),
                        background: "var(--bg-4)",
                        border: "1px solid var(--line-2)",
                      }}
                    >
                      {citation.similarityScore}%
                    </span>
                  </div>

                  {/* Root cause */}
                  <div style={{ marginBottom: "10px" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--fg-3)",
                        marginBottom: "4px",
                      }}
                    >
                      Root cause
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: "1.5", margin: 0 }}>
                      {citation.rootCause}
                    </p>
                  </div>

                  {/* Corrective action */}
                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--fg-3)",
                        marginBottom: "4px",
                      }}
                    >
                      Corrective action
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--fg-3)", lineHeight: "1.5", margin: 0 }}>
                      {citation.correctiveAction}
                    </p>
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <OutcomeBadge outcome={citation.outcome} />
                    <TypePill type={citation.sourceType} tone="neutral" />
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 500,
                        background: "var(--bg-4)",
                        border: "1px solid var(--line-2)",
                        color: "var(--fg-3)",
                      }}
                    >
                      {citation.year}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      {selectedResult && (
        <DetailModal citation={selectedResult} onClose={() => setSelectedResult(undefined)} />
      )}
    </div>
  );
}
