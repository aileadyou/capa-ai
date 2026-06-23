import { useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Loader2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockRuns, type RunStatus, type ScreeningRun } from "@/pages/nova/diagnosticsMockData";

const statusLabel: Record<RunStatus, string> = {
  draft: "Draft",
  running: "Running",
  completed: "Completed",
  shortlisted: "Shortlisted",
};

const statusClass: Record<RunStatus, string> = {
  draft: "border-[var(--line-2)] bg-elevated text-foreground-tertiary",
  running: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  completed: "border-success bg-success/10 text-success",
  shortlisted: "border-success bg-success/10 text-success",
};

const allStatuses: (RunStatus | "all")[] = ["all", "running", "completed", "shortlisted", "draft"];

function RunRow({ run }: { run: ScreeningRun }) {
  return (
    <tr className="border-b border-[var(--line-1)] bg-card transition-[background] [transition-duration:var(--dur-fast)] hover:bg-elevated last:border-b-0">
      <td className="px-5 py-4 align-top">
        <Link
          to={`/diagnostics/runs/details/${run.id}`}
          className="font-sans text-sm font-bold text-primary no-underline hover:underline"
        >
          {run.id}
        </Link>
        <p className="m-0 mt-0.5 font-sans text-[11px] text-foreground-tertiary">
          {new Date(run.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </td>
      <td className="px-5 py-4 align-top">
        <p className="m-0 font-sans text-sm font-semibold text-foreground">{run.virusName}</p>
        <p className="m-0 mt-0.5 font-sans text-xs text-foreground-tertiary">{run.virusFamily}</p>
      </td>
      <td className="px-5 py-4 align-top">
        <p className="m-0 font-sans text-sm text-foreground">{run.targetProtein}</p>
        <p className="m-0 mt-0.5 font-sans text-xs text-foreground-tertiary">{run.bindingRegion}</p>
      </td>
      <td className="px-5 py-4 align-top">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-semibold",
            statusClass[run.status],
          )}
        >
          {run.status === "running" && (
            <Loader2 size={11} className="animate-spin" aria-hidden="true" />
          )}
          {statusLabel[run.status]}
        </span>
      </td>
      <td className="px-5 py-4 align-top text-right">
        {run.candidateCount > 0 ? (
          <div>
            <p className="m-0 font-sans text-sm font-bold text-foreground">{run.candidateCount}</p>
            <p className="m-0 mt-0.5 font-sans text-[11px] text-foreground-tertiary">
              top score {run.topScore}
            </p>
          </div>
        ) : (
          <span className="font-sans text-xs text-foreground-faint">—</span>
        )}
      </td>
      <td className="px-5 py-4 align-top">
        <Link
          to="/diagnostics/screening"
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-3 font-sans text-xs font-semibold text-foreground-secondary no-underline transition-[background,border-color] [transition-duration:var(--dur-fast)] hover:border-[var(--accent-line)] hover:bg-[var(--accent-soft)] hover:text-primary"
        >
          {run.status === "draft" ? "Resume" : "Re-run"}
        </Link>
      </td>
    </tr>
  );
}

export function DiagnosticsRunsPage() {
  const [activeFilter, setActiveFilter] = useState<RunStatus | "all">("all");

  const filtered = activeFilter === "all"
    ? mockRuns
    : mockRuns.filter((r) => r.status === activeFilter);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
            <FlaskConical size={14} strokeWidth={1.9} aria-hidden="true" />
            Diagnostics · Screening Runs
          </div>
          <h1 className="m-0 font-sans text-3xl font-bold text-foreground">Screening Runs</h1>
          <p className="mb-0 mt-2 max-w-3xl font-sans text-base leading-7 text-foreground-secondary">
            All past and current AI screening runs. Review status, results, and re-run any configuration.
          </p>
        </div>

        <Link
          to="/diagnostics/screening"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-4 font-sans text-sm font-semibold text-primary-foreground no-underline shadow-sm"
        >
          <Plus size={15} aria-hidden="true" />
          New screening run
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {allStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveFilter(status)}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center rounded-[var(--r-full)] border px-3 font-sans text-xs font-semibold capitalize transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
              activeFilter === status
                ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary"
                : "border-[var(--line-2)] bg-card text-foreground-secondary hover:border-[var(--line-3)] hover:text-foreground",
            )}
          >
            {status === "all" ? "All runs" : statusLabel[status]}
            {status !== "all" && (
              <span className="ml-1.5 rounded-[var(--r-full)] bg-card px-1.5 py-px text-[10px]">
                {mockRuns.filter((r) => r.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated text-primary">
              <Sparkles size={22} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="m-0 font-sans text-base font-semibold text-foreground">No runs found</p>
            <p className="mb-0 mt-2 font-sans text-sm text-foreground-tertiary">
              Try a different filter or start a new screening run.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--line-1)] bg-elevated">
                  {["Run ID", "Virus", "Target / Region", "Status", "Candidates", "Actions"].map((h) => (
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
                {filtered.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticsRunsPage;
