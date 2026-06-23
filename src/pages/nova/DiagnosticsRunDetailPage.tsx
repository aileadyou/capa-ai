import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  BookmarkPlus,
  ChevronRight,
  Database,
  FlaskConical,
  Settings2,
  Cpu,
  FileText,
} from "lucide-react";
import { mockRuns, mockCandidates, type CandidateEntry } from "./diagnosticsMockData";
import { useState } from "react";

type RunStatus = "draft" | "running" | "completed" | "shortlisted";

const statusConfig: Record<RunStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-foreground-tertiary", bg: "bg-elevated" },
  running: { label: "Running", color: "text-amber-400", bg: "bg-amber-400/10" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  shortlisted: { label: "Shortlisted", color: "text-primary", bg: "bg-[var(--accent-soft)]" },
};

const labReadinessConfig = {
  ready: { label: "Ready", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  review: { label: "Review", color: "text-amber-400", bg: "bg-amber-400/10" },
  hold: { label: "Hold", color: "text-red-400", bg: "bg-red-400/10" },
};

const pipelineSteps = [
  { id: 1, label: "Structure retrieval", sub: "Fetching PDB coordinates" },
  { id: 2, label: "Binding site mapping", sub: "AI region annotation" },
  { id: 3, label: "Library generation", sub: "Constrained peptide synthesis" },
  { id: 4, label: "Docking simulation", sub: "Energy minimisation · MD scoring" },
  { id: 5, label: "Ranking & output", sub: "Top-N extraction · diversity filter" },
];

function getPipelineProgress(status: RunStatus) {
  if (status === "draft") return 0;
  if (status === "running") return 3;
  if (status === "completed") return 5;
  if (status === "shortlisted") return 5;
  return 0;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: RunStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}
    >
      {status === "running" && <Loader2 size={10} className="animate-spin" />}
      {cfg.label}
    </span>
  );
}

function ConfigCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] p-4">
      <div className="mb-3 flex items-center gap-2 text-foreground-secondary">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-foreground-tertiary">{label}</dt>
      <dd className="text-right font-mono text-xs font-medium text-foreground">{value}</dd>
    </div>
  );
}

function CandidateDetailPanel({ candidate }: { candidate: CandidateEntry }) {
  const lr = labReadinessConfig[candidate.labReadiness];
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
          Selected candidate
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${lr.color} ${lr.bg}`}>
          {lr.label}
        </span>
      </div>
      <p className="mb-4 break-all font-mono text-sm font-bold tracking-widest text-primary">
        {candidate.sequence}
      </p>
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between">
          <dt className="text-foreground-tertiary">Rank</dt>
          <dd className="font-medium text-foreground">#{candidate.rank}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground-tertiary">AI score</dt>
          <dd className="font-medium text-primary">{candidate.score}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground-tertiary">Confidence</dt>
          <dd className="font-medium text-foreground">{candidate.confidence}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground-tertiary">Binding region</dt>
          <dd className="text-right text-foreground">{candidate.bindingRegion}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground-tertiary">Contact site</dt>
          <dd className="text-right text-foreground">{candidate.contactSite}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground-tertiary">Shortlisted</dt>
          <dd className={candidate.shortlisted ? "font-medium text-primary" : "text-foreground-tertiary"}>
            {candidate.shortlisted ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DiagnosticsRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const run = mockRuns.find((r) => r.id === id);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-foreground-tertiary">
        <p className="text-sm">Run not found: {id}</p>
        <Link
          to="/diagnostics/runs"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft size={12} />
          Back to Screening runs
        </Link>
      </div>
    );
  }

  const candidates = mockCandidates.filter((c) => c.runId === run.id);
  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;
  const pipelineDone = getPipelineProgress(run.status);
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Back nav */}
      <Link
        to="/diagnostics/runs"
        className="inline-flex items-center gap-1.5 text-xs text-foreground-tertiary transition-colors hover:text-foreground"
      >
        <ArrowLeft size={12} />
        Screening runs
        <ChevronRight size={10} className="text-foreground-faint" />
        <span className="text-foreground-secondary">{run.id}</span>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">{run.id}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="text-sm text-foreground-secondary">
            {run.virusName} · {run.targetProtein}
          </p>
          <p className="text-xs text-foreground-tertiary">
            Created {formatDate(run.createdAt)} · Updated {formatDate(run.updatedAt)}
          </p>
        </div>
        {run.status === "completed" || run.status === "shortlisted" ? (
          <div className="flex items-center gap-3">
            <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-2 text-center">
              <p className="text-lg font-bold text-primary">{run.topScore}</p>
              <p className="text-xs text-foreground-tertiary">Top score</p>
            </div>
            <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-2 text-center">
              <p className="text-lg font-bold text-foreground">{candidates.length}</p>
              <p className="text-xs text-foreground-tertiary">Candidates</p>
            </div>
            <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{shortlistedCount}</p>
              <p className="text-xs text-foreground-tertiary">Shortlisted</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Config cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ConfigCard icon={<Database size={14} />} title="Target">
          <ConfigRow label="Virus" value={run.virusName} />
          <ConfigRow label="Protein" value={run.targetProtein} />
          <ConfigRow label="Region" value={run.bindingRegion} />
        </ConfigCard>
        <ConfigCard icon={<FlaskConical size={14} />} title="Structure">
          <ConfigRow label="PDB ID" value={run.structureId} />
          <ConfigRow label="Source" value={run.source} />
          <ConfigRow label="Family" value={run.virusFamily} />
        </ConfigCard>
        <ConfigCard icon={<Settings2 size={14} />} title="Constraints">
          <ConfigRow label="Prefix" value={run.prefix || "—"} />
          <ConfigRow label="Suffix" value={run.suffix || "—"} />
          <ConfigRow label="Length" value={`${run.minLength}–${run.maxLength} aa`} />
        </ConfigCard>
        <ConfigCard icon={<FileText size={14} />} title="Output">
          <ConfigRow label="Top N" value={run.topN} />
          <ConfigRow label="Diversity" value={run.diversityMode} />
        </ConfigCard>
      </div>

      {/* AI pipeline */}
      <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] p-5">
        <div className="mb-4 flex items-center gap-2 text-foreground-secondary">
          <Cpu size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">AI Pipeline</span>
        </div>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-[17px] top-6 h-[calc(100%-24px)] w-px bg-[var(--line-2)]" />
          <div className="space-y-4">
            {pipelineSteps.map((step) => {
              const done = step.id <= pipelineDone;
              const active = step.id === pipelineDone + 1 && run.status === "running";
              return (
                <div key={step.id} className="relative flex items-start gap-3 pl-10">
                  <div className="absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-2)] bg-[var(--surface-1)]">
                    {done ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : active ? (
                      <Loader2 size={14} className="animate-spin text-amber-400" />
                    ) : (
                      <Circle size={14} className="text-foreground-faint" />
                    )}
                  </div>
                  <div className="flex min-h-[36px] flex-1 flex-col justify-center">
                    <p
                      className={`text-sm font-medium ${done ? "text-foreground" : active ? "text-amber-300" : "text-foreground-tertiary"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-foreground-faint">{step.sub}</p>
                  </div>
                  {done && (
                    <span className="mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      Done
                    </span>
                  )}
                  {active && (
                    <span className="mt-0.5 flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      <Clock size={9} />
                      In progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Candidates */}
      {candidates.length > 0 && (
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)]">
          <div className="flex items-center justify-between border-b border-[var(--line-2)] px-5 py-3">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <FlaskConical size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Candidates</span>
            </div>
            <span className="text-xs text-foreground-tertiary">
              {shortlistedCount} shortlisted · {candidates.length} total
            </span>
          </div>
          <div className="flex">
            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line-2)] text-left text-xs text-foreground-tertiary">
                    <th className="px-5 py-2.5 font-medium">#</th>
                    <th className="px-5 py-2.5 font-medium">Sequence</th>
                    <th className="px-5 py-2.5 font-medium">Score</th>
                    <th className="px-5 py-2.5 font-medium">Confidence</th>
                    <th className="px-5 py-2.5 font-medium">Binding region</th>
                    <th className="px-5 py-2.5 font-medium">Lab</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const lr = labReadinessConfig[c.labReadiness];
                    const isSelected = c.id === selectedCandidateId;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidateId(isSelected ? null : c.id)}
                        className={`cursor-pointer border-b border-[var(--line-2)] transition-colors last:border-0 hover:bg-elevated ${isSelected ? "bg-[var(--accent-soft)]" : ""}`}
                      >
                        <td className="px-5 py-3 text-xs text-foreground-tertiary">{c.rank}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {c.shortlisted && (
                              <BookmarkPlus size={12} className="shrink-0 text-primary" />
                            )}
                            <code className="font-mono text-xs tracking-wider text-foreground">
                              {c.sequence}
                            </code>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-sm font-bold text-primary">
                          {c.score}
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground-secondary">
                          {c.confidence}%
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground-secondary">
                          {c.bindingRegion}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${lr.color} ${lr.bg}`}
                          >
                            {lr.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selectedCandidate && (
              <div className="w-64 shrink-0 border-l border-[var(--line-2)] p-4">
                <CandidateDetailPanel candidate={selectedCandidate} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state for running / draft */}
      {candidates.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-[var(--surface-1)] py-12 text-foreground-tertiary">
          {run.status === "running" ? (
            <>
              <Loader2 size={20} className="animate-spin text-amber-400" />
              <p className="text-sm">Screening in progress — candidates will appear here when ready.</p>
            </>
          ) : (
            <>
              <FlaskConical size={20} />
              <p className="text-sm">No candidates yet. Run the screening to generate results.</p>
              <Link
                to="/diagnostics/screening"
                className="mt-1 text-xs text-primary hover:underline"
              >
                Go to AI Screening
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
