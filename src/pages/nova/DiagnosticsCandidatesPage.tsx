import { useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkPlus, Dna, Filter, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockCandidates, type CandidateEntry } from "@/pages/nova/diagnosticsMockData";

const labReadinessLabel: Record<CandidateEntry["labReadiness"], string> = {
  ready: "Lab ready",
  review: "Under review",
  hold: "On hold",
};

const labReadinessClass: Record<CandidateEntry["labReadiness"], string> = {
  ready: "border-success bg-success/10 text-success",
  review: "border-warning bg-warning/10 text-warning",
  hold: "border-[var(--line-2)] bg-elevated text-foreground-tertiary",
};

function scoreTone(score: number) {
  if (score >= 90) return "border-success bg-success/10 text-success";
  if (score >= 82) return "border-primary bg-[var(--accent-soft)] text-primary";
  return "border-warning bg-warning/10 text-warning";
}

const allViruses = ["All viruses", ...Array.from(new Set(mockCandidates.map((c) => c.virus)))];
const allReadiness: (CandidateEntry["labReadiness"] | "all")[] = ["all", "ready", "review", "hold"];

function CandidateRow({ candidate }: { candidate: CandidateEntry }) {
  return (
    <tr className="border-b border-[var(--line-1)] bg-card transition-[background] [transition-duration:var(--dur-fast)] hover:bg-elevated last:border-b-0">
      <td className="px-5 py-4 align-top">
        <div className="flex items-center gap-2">
          {candidate.shortlisted && (
            <BookmarkPlus size={13} className="shrink-0 text-success" aria-label="Shortlisted" />
          )}
          <p className="m-0 font-mono text-sm font-semibold text-foreground break-all">
            {candidate.sequence}
          </p>
        </div>
        <p className="m-0 mt-1 font-sans text-[11px] text-foreground-tertiary">
          {candidate.sequence.length} aa · {candidate.runId}
        </p>
      </td>
      <td className="px-5 py-4 align-top">
        <span
          className={cn(
            "inline-flex min-w-[52px] justify-center rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-bold",
            scoreTone(candidate.score),
          )}
        >
          {candidate.score}
        </span>
        <p className="m-0 mt-1 font-sans text-[11px] text-foreground-tertiary">
          {candidate.confidence}% conf.
        </p>
      </td>
      <td className="px-5 py-4 align-top">
        <p className="m-0 font-sans text-sm text-foreground">{candidate.virus}</p>
      </td>
      <td className="px-5 py-4 align-top">
        <p className="m-0 font-sans text-sm font-semibold text-foreground">{candidate.bindingRegion}</p>
        <p className="m-0 mt-0.5 font-sans text-xs text-foreground-tertiary">{candidate.contactSite}</p>
      </td>
      <td className="px-5 py-4 align-top">
        <span
          className={cn(
            "inline-flex rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-semibold",
            labReadinessClass[candidate.labReadiness],
          )}
        >
          {labReadinessLabel[candidate.labReadiness]}
        </span>
      </td>
    </tr>
  );
}

export function DiagnosticsCandidatesPage() {
  const [virusFilter, setVirusFilter] = useState("All viruses");
  const [readinessFilter, setReadinessFilter] = useState<CandidateEntry["labReadiness"] | "all">("all");
  const [shortlistedOnly, setShortlistedOnly] = useState(false);

  const filtered = mockCandidates.filter((c) => {
    if (virusFilter !== "All viruses" && c.virus !== virusFilter) return false;
    if (readinessFilter !== "all" && c.labReadiness !== readinessFilter) return false;
    if (shortlistedOnly && !c.shortlisted) return false;
    return true;
  });

  const shortlistedCount = mockCandidates.filter((c) => c.shortlisted).length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
            <Dna size={14} strokeWidth={1.9} aria-hidden="true" />
            Diagnostics · Candidate Library
          </div>
          <h1 className="m-0 font-sans text-3xl font-bold text-foreground">Candidate Library</h1>
          <p className="mb-0 mt-2 max-w-3xl font-sans text-base leading-7 text-foreground-secondary">
            Peptide candidates from all completed screening runs. Filter by virus, readiness, or shortlist status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-card px-4 py-2 shadow-sm">
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Shortlisted
            </p>
            <p className="m-0 mt-0.5 font-sans text-2xl font-bold text-foreground">{shortlistedCount}</p>
          </div>
          <Link
            to="/diagnostics/screening"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-4 font-sans text-sm font-semibold text-primary-foreground no-underline shadow-sm"
          >
            <Sparkles size={15} aria-hidden="true" />
            New screening run
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-foreground-tertiary" aria-hidden="true" />
          <span className="font-sans text-xs font-semibold text-foreground-secondary">Filter:</span>
        </div>

        <select
          value={virusFilter}
          onChange={(e) => setVirusFilter(e.target.value)}
          className="h-8 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-card px-3 font-sans text-xs text-foreground outline-none focus:border-primary"
        >
          {allViruses.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          {allReadiness.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReadinessFilter(r)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center rounded-[var(--r-full)] border px-3 font-sans text-xs font-semibold capitalize transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
                readinessFilter === r
                  ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary"
                  : "border-[var(--line-2)] bg-card text-foreground-secondary hover:border-[var(--line-3)] hover:text-foreground",
              )}
            >
              {r === "all" ? "All" : labReadinessLabel[r]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShortlistedOnly((v) => !v)}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--r-full)] border px-3 font-sans text-xs font-semibold transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
            shortlistedOnly
              ? "border-success bg-success/10 text-success"
              : "border-[var(--line-2)] bg-card text-foreground-secondary hover:border-[var(--line-3)] hover:text-foreground",
          )}
        >
          <BookmarkPlus size={12} aria-hidden="true" />
          Shortlisted only
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated text-primary">
              <Dna size={22} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="m-0 font-sans text-base font-semibold text-foreground">No candidates match filters</p>
            <p className="mb-0 mt-2 font-sans text-sm text-foreground-tertiary">
              Try adjusting the virus or readiness filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--line-1)] bg-elevated">
                  {["Peptide sequence", "Score", "Virus", "Binding region", "Lab readiness"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate) => (
                  <CandidateRow key={candidate.id} candidate={candidate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticsCandidatesPage;
