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
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "all";
type OutcomeFilter = KGCitation["outcome"] | typeof ALL;
type TypeFilter = CAPAType | typeof ALL;

const OUTCOME_CLASSES: Record<KGCitation["outcome"], string> = {
  Effective: "border-success/40 bg-[var(--success-soft)] text-success",
  Recurred: "border-destructive/40 bg-[var(--danger-soft)] text-destructive",
  Ongoing: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
};

const EYEBROW_CLASS = "font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary";

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

function similarityColorClass(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-foreground-tertiary";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: KGCitation["outcome"] }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[20px] border px-2 py-[3px] font-sans text-[11px] font-semibold",
        OUTCOME_CLASSES[outcome],
      )}
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
        className="fixed inset-0 z-[999] bg-[var(--glass-dark)] backdrop-blur-[2px] animate-in fade-in [animation-duration:var(--dur-tab)] [animation-timing-function:var(--ease-out)]"
      />
      {/* Panel */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="similarity-detail-title"
        tabIndex={-1}
        className="fixed left-1/2 top-1/2 z-[1000] max-h-[85vh] w-[520px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 overflow-auto overscroll-contain rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-lg animate-in fade-in slide-in-from-bottom-2 [animation-duration:var(--dur-tab)] [animation-timing-function:var(--ease-out)]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-border-subtle px-5 py-4"
        >
          <div>
            <div id="similarity-detail-title" className="font-sans text-base font-semibold text-foreground">
              {citation.capaId}
            </div>
            <div className="mt-0.5 text-xs text-foreground-tertiary">
              Historical CAPA similarity detail
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close similarity detail"
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-transparent p-1 text-foreground-tertiary hover:bg-field hover:text-foreground"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Meta grid */}
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            {[
              ["Source ID", citation.deviationId],
              ["Similarity", `${citation.similarityScore}%`],
              ["Type", formatCAPAType(citation.sourceType)],
              ["Outcome", citation.outcome],
            ].map(([label, val]) => (
              <div
                key={label}
                className="rounded-[var(--r-sm)] bg-elevated px-3 py-2.5"
              >
                <div
                  className={cn(EYEBROW_CLASS, "mb-1")}
                >
                  {label}
                </div>
                <div className="text-[13px] font-medium text-foreground">{val}</div>
              </div>
            ))}
          </div>

          {/* Root cause */}
          <div className="mb-4">
            <div
              className={cn(EYEBROW_CLASS, "mb-1.5")}
            >
              Root cause
            </div>
            <p className="m-0 text-[13px] leading-[1.6] text-foreground-secondary">
              {citation.rootCause}
            </p>
          </div>

          {/* Corrective action */}
          <div className="mb-4">
            <div
              className={cn(EYEBROW_CLASS, "mb-1.5")}
            >
              Corrective action
            </div>
            <p className="m-0 text-[13px] leading-[1.6] text-foreground-secondary">
              {citation.correctiveAction}
            </p>
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-[var(--r-sm)] border-l-[3px] border-l-primary bg-elevated px-3.5 py-3 text-xs leading-6 text-foreground-tertiary"
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
    <div className="animate-page-enter">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1
          className="m-0 font-sans text-4xl font-bold tracking-[-0.025em] text-foreground"
        >
          Similarity explorer
        </h1>
        <p className="mt-1.5 max-w-[620px] font-sans text-sm leading-normal text-foreground-tertiary">
          Search historical CAPA patterns by finding description, root cause, corrective action, outcome, and source type.
        </p>
      </div>

      {/* ── Search card ───────────────────────────────────────────────── */}
      <div
        className="mb-4 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm"
      >
        <div
          className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary"
        >
          AI search
        </div>
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
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
            className={cn(
              "inline-flex h-10 items-center gap-[7px] whitespace-nowrap rounded-[var(--r-sm)] border-0 px-5 font-sans text-[13px] font-semibold transition-[filter] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
              isSearching
                ? "cursor-not-allowed bg-field text-foreground-tertiary"
                : "cursor-pointer bg-[image:var(--grad-brand)] text-primary-foreground hover:brightness-110",
            )}
          >
            {isSearching ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <BrainCircuit size={14} strokeWidth={1.75} />
            )}
            {isSearching ? "Searching…" : "AI Search"}
          </button>
        </div>

        {/* Loading indicator */}
        {isSearching && (
          <div
            className="mt-3 flex items-center gap-2 font-sans text-xs text-primary"
          >
            <Loader2 size={13} strokeWidth={1.75} className="animate-spin" />
            Nova is searching historical CAPA similarity…
          </div>
        )}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div
        className="mb-4 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-5 py-4 shadow-sm"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] items-end gap-3">
          {/* Similarity slider */}
          <div>
            <div className="mb-1.5 flex justify-between">
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-tertiary">
                Min similarity
              </span>
              <span className="font-sans text-xs font-semibold text-foreground">
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
              aria-label="Minimum similarity percentage"
              aria-valuetext={`${minSimilarity} percent`}
              className="h-1 w-full cursor-pointer accent-primary"
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
            className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary"
          >
            {filteredResults.length} match{filteredResults.length !== 1 ? "es" : ""}
          </div>

          {filteredResults.length === 0 ? (
            <EmptyState
              title="No similarity results"
              description="No similarity results match the current filters."
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-3">
              {filteredResults.map((citation) => (
                <div
                  key={`${citation.capaId}-${citation.deviationId}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`View similarity detail for ${citation.capaId}`}
                  className="cursor-pointer rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-[18px] shadow-sm transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => setSelectedResult(citation)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedResult(citation);
                    }
                  }}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{citation.capaId}</div>
                      <div className="mt-0.5 font-sans text-[11px] text-foreground-tertiary">
                        {citation.deviationId}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-[20px] border border-[var(--line-2)] bg-field px-2.5 py-1 font-sans text-xs font-semibold",
                        similarityColorClass(citation.similarityScore),
                      )}
                    >
                      {citation.similarityScore}%
                    </span>
                  </div>

                  {/* Root cause */}
                  <div className="mb-2.5">
                    <div
                      className={cn(EYEBROW_CLASS, "mb-1")}
                    >
                      Root cause
                    </div>
                    <p className="m-0 text-[13px] leading-6 text-foreground-secondary">
                      {citation.rootCause}
                    </p>
                  </div>

                  {/* Corrective action */}
                  <div className="mb-3">
                    <div
                      className={cn(EYEBROW_CLASS, "mb-1")}
                    >
                      Corrective action
                    </div>
                    <p className="m-0 text-[13px] leading-6 text-foreground-tertiary">
                      {citation.correctiveAction}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <OutcomeBadge outcome={citation.outcome} />
                    <TypePill type={citation.sourceType} tone="neutral" />
                    <span
                      className="inline-block rounded-[20px] border border-[var(--line-2)] bg-field px-2 py-[3px] font-sans text-[11px] font-medium text-foreground-tertiary"
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
