import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Database,
  Dna,
  FlaskConical,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { mockCandidates, mockRuns, mockTargets } from "@/pages/nova/diagnosticsMockData";

const moduleLinks = [
  {
    title: "AI Screening",
    description: "Configure peptide constraints and run AI-assisted viral target screening.",
    url: "/diagnostics/screening",
    icon: Bot,
  },
  {
    title: "Screening Runs",
    description: "Review past and active screening runs with status and results.",
    url: "/diagnostics/runs",
    icon: FlaskConical,
  },
  {
    title: "Candidate Library",
    description: "Browse shortlisted peptide candidates with scores and binding details.",
    url: "/diagnostics/candidates",
    icon: Dna,
  },
  {
    title: "Target Structures",
    description: "Manage viral target structures and available binding region annotations.",
    url: "/diagnostics/targets",
    icon: Database,
  },
] as const;

const statusLabel: Record<string, string> = {
  draft: "Draft",
  running: "Running",
  completed: "Completed",
  shortlisted: "Shortlisted",
};

const statusClass: Record<string, string> = {
  draft: "border-[var(--line-2)] bg-elevated text-foreground-tertiary",
  running: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  completed: "border-success bg-success/10 text-success",
  shortlisted: "border-success bg-success/10 text-success",
};

const aiInsights = [
  {
    title: "HBGA pocket shows high binding potential",
    desc: "Norovirus GII.4 HBGA pocket residues 290–310 show strong compatibility with the GGGG prefix constraint.",
    time: "2 hours ago",
  },
  {
    title: "Consider ACE2 interface for SARS-CoV-2",
    desc: "Based on RUN-002, ACE2 interface candidates score 8–12% higher than RBD ridge candidates on average.",
    time: "1 day ago",
  },
  {
    title: "New Dengue structure available",
    desc: "AlphaFold has published an updated DENV2 EDIII model. Consider re-running RUN-004 with the updated source.",
    time: "3 days ago",
  },
];

function StatTile({ label, value, caption }: { label: string; value: string | number; caption: string }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm">
      <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        {label}
      </p>
      <p className="mb-0 mt-3 font-sans text-3xl font-bold text-foreground">{value}</p>
      <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">{caption}</p>
    </div>
  );
}

export function DiagnosticsHomePage() {
  const activeRuns = mockRuns.filter((r) => r.status === "running").length;
  const completedRuns = mockRuns.filter(
    (r) => r.status === "completed" || r.status === "shortlisted",
  ).length;
  const shortlistedCount = mockCandidates.filter((c) => c.shortlisted).length;

  const recentRuns = [...mockRuns]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
            <Stethoscope size={14} strokeWidth={1.9} aria-hidden="true" />
            Diagnostics module
          </div>
          <h1 className="m-0 font-sans text-3xl font-bold text-foreground">Diagnostics workspace</h1>
          <p className="mb-0 mt-2 max-w-3xl font-sans text-base leading-7 text-foreground-secondary">
            AI-assisted peptide screening for viral targets — configure, run, and review shortlisted candidates.
          </p>
        </div>

        <Link
          to="/diagnostics/screening"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-4 font-sans text-sm font-semibold text-primary-foreground no-underline shadow-sm"
        >
          <Sparkles size={15} aria-hidden="true" />
          New screening run
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active Runs" value={activeRuns} caption="Currently processing" />
        <StatTile label="Completed Runs" value={completedRuns} caption="Ready for review" />
        <StatTile label="Shortlisted" value={shortlistedCount} caption="Candidates saved to library" />
        <StatTile label="Target Structures" value={mockTargets.length} caption="Virus structures loaded" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Recent activity
              </p>
              <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Screening runs</h2>
            </div>
            <FlaskConical size={20} className="text-primary" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                to="/diagnostics/runs"
                className="grid gap-3 rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated px-4 py-3 text-left no-underline transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="m-0 truncate font-sans text-sm font-semibold text-foreground">{run.virusName}</p>
                  <p className="m-0 font-sans text-xs text-foreground-tertiary">
                    {run.id} · {run.targetProtein}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <span
                    className={`rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-[11px] font-semibold ${statusClass[run.status]}`}
                  >
                    {statusLabel[run.status]}
                  </span>
                  {run.topScore !== null && (
                    <span className="font-sans text-xs text-foreground-tertiary">top {run.topScore}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                AI suggestions
              </p>
              <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Nova insights</h2>
            </div>
            <Sparkles size={20} className="text-primary" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            {aiInsights.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated px-4 py-3"
              >
                <p className="m-0 font-sans text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mb-0 mt-1 line-clamp-2 font-sans text-xs leading-5 text-foreground-tertiary">
                  {item.desc}
                </p>
                <p className="mb-0 mt-2 font-sans text-[11px] text-primary">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {moduleLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.url}
              to={item.url}
              className="group rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 no-underline shadow-sm transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--accent-line)] hover:bg-elevated"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--accent-soft)] text-primary">
                <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 font-sans text-base font-bold text-foreground">{item.title}</h3>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-foreground-faint transition-transform [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </div>
              <p className="mb-0 mt-2 font-sans text-xs leading-5 text-foreground-tertiary">
                {item.description}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

export default DiagnosticsHomePage;
