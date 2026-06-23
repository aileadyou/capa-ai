import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  ClipboardList,
  FolderOpen,
  LayoutGrid,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCapas, useDashboard, useFindings, useNotifications } from "@/hooks/api";
import { usePersonaStore } from "@/store";
import { formatCAPAStatus, formatDate, formatRelativeTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { CAPACase } from "@/types";

const moduleLinks = [
  {
    title: "Findings",
    description: "Review deviations, audits, and complaints before CAPA creation.",
    url: "/findings",
    icon: AlertCircle,
  },
  {
    title: "All CAPAs",
    description: "Track every open, approved, rejected, and closed CAPA case.",
    url: "/capa/list",
    icon: FolderOpen,
  },
  {
    title: "Action Plan",
    description: "See corrective and preventive actions in one consolidated plan.",
    url: "/actions/consolidated",
    icon: ClipboardList,
  },
  {
    title: "Similarity",
    description: "Compare recurring findings and similar historical CAPAs.",
    url: "/similarity",
    icon: Search,
  },
] as const;

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

function getNextDueDate(capa: CAPACase) {
  const corrective = capa.correctiveActions.map((action) => action.dueDate);
  const preventive = capa.preventiveActions.map((action) => action.targetDate);
  return [...corrective, ...preventive].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

export function CapaHomePage() {
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const persona = usePersonaStore((state) => state.activePersona());
  const { data: stats } = useDashboard();
  const { data: capas } = useCapas();
  const { data: findings } = useFindings();
  const { data: notifications } = useNotifications(activePersonaId);

  const openCapas = (capas ?? []).filter((capa) => capa.status !== "closed");
  const myQueue = openCapas
    .filter((capa) => capa.assignedTo === activePersonaId || capa.createdBy === activePersonaId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const unreadNotifications = (notifications ?? [])
    .filter((notification) => !notification.read)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const pendingFindings = (findings ?? []).filter((finding) =>
    ["pending_capa", "pending_review", "capa_in_progress"].includes(finding.status),
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
            <ShieldCheck size={14} strokeWidth={1.9} aria-hidden="true" />
            CAPA module
          </div>
          <h1 className="m-0 font-sans text-3xl font-bold text-foreground">CAPA workspace</h1>
          <p className="mb-0 mt-2 max-w-3xl font-sans text-base leading-7 text-foreground-secondary">
            A combined view for dashboard signals, your CAPA queue, and recent notifications.
          </p>
        </div>

        <Link
          to="/capa/list"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-4 font-sans text-sm font-semibold text-primary-foreground no-underline"
        >
          Open all CAPAs
          <ArrowRight size={15} />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Open CAPAs" value={stats?.openCapas ?? openCapas.length} caption="Across active workflows" />
        <StatTile label="Overdue CAPAs" value={stats?.overdueCapas ?? "—"} caption="Past target closure date" />
        <StatTile
          label="Effectiveness"
          value={stats ? `${stats.effectivenessRate}%` : "—"}
          caption="Verified CAPA effectiveness"
        />
        <StatTile label="Pending findings" value={pendingFindings} caption="Ready for CAPA triage" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                My Work
              </p>
              <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">CAPA queue</h2>
            </div>
            <LayoutGrid size={20} className="text-primary" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            {myQueue.length > 0 ? (
              myQueue.map((capa) => {
                const nextDueDate = getNextDueDate(capa);

                return (
                  <Link
                    key={capa.id}
                    to={`/capa/${capa.id}`}
                    className="grid gap-3 rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated px-4 py-3 text-left no-underline transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate font-sans text-sm font-semibold text-foreground">{capa.title}</p>
                      <p className="m-0 font-sans text-xs text-foreground-tertiary">
                        {capa.id} · {formatCAPAStatus(capa.status)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <span
                        className={cn(
                          "rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-[11px] font-semibold",
                          capa.score.total >= 80
                            ? "border-success bg-success/10 text-success"
                            : "border-warning bg-warning/10 text-warning",
                        )}
                      >
                        {capa.score.total}
                      </span>
                      <span className="font-sans text-xs text-foreground-tertiary">
                        {nextDueDate ? formatDate(nextDueDate) : "No due date"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] bg-elevated p-6 text-center">
                <p className="m-0 font-sans text-sm font-semibold text-foreground">No assigned CAPAs</p>
                <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">
                  {persona.displayName} has no open CAPA queue items right now.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Notifications
              </p>
              <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Recent alerts</h2>
            </div>
            <Bell size={20} className="text-primary" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.actionUrl ?? "/notifications"}
                  className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated px-4 py-3 no-underline transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)]"
                >
                  <p className="m-0 font-sans text-sm font-semibold text-foreground">{notification.title}</p>
                  <p className="mb-0 mt-1 line-clamp-2 font-sans text-xs leading-5 text-foreground-tertiary">
                    {notification.description}
                  </p>
                  <p className="mb-0 mt-2 font-sans text-[11px] text-primary">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] bg-elevated p-6 text-center">
                <p className="m-0 font-sans text-sm font-semibold text-foreground">No unread alerts</p>
                <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">You are caught up for now.</p>
              </div>
            )}
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
              <p className="mb-0 mt-2 font-sans text-xs leading-5 text-foreground-tertiary">{item.description}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

export default CapaHomePage;
