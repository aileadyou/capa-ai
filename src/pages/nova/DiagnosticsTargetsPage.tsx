import { Link } from "react-router-dom";
import { Database, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTargets, type TargetStructure } from "@/pages/nova/diagnosticsMockData";

function TargetCard({ target }: { target: TargetStructure }) {
  return (
    <div className="flex flex-col rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-2 py-1 font-mono text-xs font-bold text-foreground-secondary">
            {target.pdbId}
          </div>
          <h3 className="m-0 font-sans text-base font-bold text-foreground">{target.virusName}</h3>
          <p className="m-0 mt-0.5 font-sans text-xs text-foreground-tertiary">{target.virusFamily}</p>
        </div>
        {target.aiSuggestionAvailable ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-1 font-sans text-[11px] font-semibold text-primary">
            <Sparkles size={11} aria-hidden="true" />
            AI ready
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-[var(--r-full)] border border-[var(--line-2)] bg-elevated px-2.5 py-1 font-sans text-[11px] font-semibold text-foreground-faint">
            No AI
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-[var(--r-md)] border border-[var(--line-1)] bg-elevated px-4 py-3">
          <p className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">
            Protein target
          </p>
          <p className="mb-0 mt-1 font-sans text-sm font-semibold text-foreground">{target.targetProtein}</p>
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--line-1)] bg-elevated px-4 py-3">
          <p className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">
            Source
          </p>
          <p className="mb-0 mt-1 font-sans text-sm text-foreground-secondary">{target.source}</p>
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--line-1)] bg-elevated px-4 py-3">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">
            Binding regions ({target.bindingRegions.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {target.bindingRegions.map((region) => (
              <div
                key={region}
                className="flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-[var(--r-full)] bg-primary" aria-hidden="true" />
                <span className="font-sans text-sm text-foreground">{region}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line-1)] pt-4">
        <p className="m-0 font-sans text-[11px] text-foreground-faint">
          Added {new Date(target.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <Link
          to={`/diagnostics/screening`}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[var(--r-sm)] border px-3 font-sans text-xs font-semibold no-underline transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
            target.aiSuggestionAvailable
              ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary hover:bg-primary/20"
              : "border-[var(--line-2)] bg-card text-foreground-secondary hover:border-[var(--line-3)] hover:text-foreground",
          )}
        >
          {target.aiSuggestionAvailable ? (
            <>
              <Sparkles size={12} aria-hidden="true" />
              Screen with AI
            </>
          ) : (
            "Screen this target"
          )}
        </Link>
      </div>
    </div>
  );
}

export function DiagnosticsTargetsPage() {
  const aiReadyCount = mockTargets.filter((t) => t.aiSuggestionAvailable).length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
            <Database size={14} strokeWidth={1.9} aria-hidden="true" />
            Diagnostics · Target Structures
          </div>
          <h1 className="m-0 font-sans text-3xl font-bold text-foreground">Target Structures</h1>
          <p className="mb-0 mt-2 max-w-3xl font-sans text-base leading-7 text-foreground-secondary">
            Viral structure records loaded for screening. Each target shows its PDB source, protein, binding regions, and AI suggestion status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-card px-4 py-2 shadow-sm">
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">AI ready</p>
            <p className="m-0 mt-0.5 font-sans text-2xl font-bold text-foreground">
              {aiReadyCount}/{mockTargets.length}
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Import from PDB — coming soon"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-card px-4 font-sans text-sm font-semibold text-foreground-tertiary opacity-60 shadow-sm"
          >
            <Plus size={15} aria-hidden="true" />
            Import from PDB
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm">
          <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Structures</p>
          <p className="mb-0 mt-3 font-sans text-3xl font-bold text-foreground">{mockTargets.length}</p>
          <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">Loaded virus targets</p>
        </div>
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm">
          <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">AI suggestions</p>
          <p className="mb-0 mt-3 font-sans text-3xl font-bold text-foreground">{aiReadyCount}</p>
          <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">Targets with region rationale</p>
        </div>
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm">
          <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Total regions</p>
          <p className="mb-0 mt-3 font-sans text-3xl font-bold text-foreground">
            {mockTargets.reduce((sum, t) => sum + t.bindingRegions.length, 0)}
          </p>
          <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">Annotated binding regions</p>
        </div>
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm">
          <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Source</p>
          <p className="mb-0 mt-3 font-sans text-3xl font-bold text-foreground">RCSB</p>
          <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">Primary structure database</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockTargets.map((target) => (
          <TargetCard key={target.id} target={target} />
        ))}
      </div>
    </div>
  );
}

export default DiagnosticsTargetsPage;
