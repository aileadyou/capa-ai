/**
 * ConsolidatedActionPlanPage — Consolidated Action Plan (wireframe section 19)
 *
 * Management-level cross-CAPA view that merges corrective and preventive actions.
 * Grouped by root cause cluster, department, or risk priority.
 * AI Clustering detects recurring root cause patterns across CAPAs.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCapaStore } from "@/store";
import type { ActionStatus, CorrectiveAction, PreventiveAction } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/utils/formatters";
import { FilterSelect } from "@/components/shared/FilterControls";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type GroupMode = "rootCause" | "department" | "risk";
type RiskPriority = "High" | "Medium" | "Low";

interface UnifiedAction {
  kind: "CA" | "PA";
  id: string;
  capaId: string;
  description: string;
  pic: string;
  targetDate: string;
  status: ActionStatus;
  department: string;
  rootCause: string;
  riskPriority: RiskPriority;
}

interface ActionGroup {
  id: string;
  title: string;
  actions: UnifiedAction[];
}

// ── Helpers ��──────────────────────────────────────────────────────────────────

function getRootCauseCluster(rootCause: string, description: string): string {
  const text = `${rootCause} ${description}`.toLowerCase();
  if (text.includes("hepa") || text.includes("airflow") || text.includes("environmental")) return "HEPA Filter Maintenance";
  if (text.includes("documentation") || text.includes("verification") || text.includes("record")) return "GMP Documentation Control";
  if (text.includes("visual") || text.includes("particulate") || text.includes("inspection")) return "Visual Inspection Reconciliation";
  if (text.includes("cold") || text.includes("temperature") || text.includes("alarm")) return "Cold Chain Escalation";
  return "General CAPA System";
}

function getRiskPriority(severity: string | undefined, status: ActionStatus, targetDate: string): RiskPriority {
  const isLate = !["completed", "verified"].includes(status) && new Date(targetDate).getTime() < Date.now();
  if (severity === "Critical" || isLate) return "High";
  if (severity === "Major") return "Medium";
  return "Low";
}

function getGroupProgress(actions: UnifiedAction[]): number {
  if (actions.length === 0) return 0;
  return Math.round((actions.filter((a) => ["completed", "verified"].includes(a.status)).length / actions.length) * 100);
}

function groupActions(actions: UnifiedAction[], mode: GroupMode): ActionGroup[] {
  const map = new Map<string, UnifiedAction[]>();
  for (const action of actions) {
    const key = mode === "rootCause"
      ? getRootCauseCluster(action.rootCause, action.description)
      : mode === "department"
        ? action.department
        : action.riskPriority;
    map.set(key, [...(map.get(key) ?? []), action]);
  }
  return Array.from(map.entries())
    .map(([title, groupActions]) => ({ id: title, title, actions: groupActions }))
    .sort((a, b) => b.actions.length - a.actions.length);
}

function riskColor(priority: RiskPriority): string {
  if (priority === "High") return "text-destructive";
  if (priority === "Medium") return "text-warning";
  return "text-foreground-tertiary";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-5 py-4 shadow-sm"
    >
      <div
        className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary"
      >
        {label}
      </div>
      <div
        className="font-sans text-[28px] font-bold tracking-[-0.02em] text-foreground"
      >
        {value}
      </div>
      {sub}
    </div>
  );
}

function KindBadge({ kind }: { kind: "CA" | "PA" }) {
  const isCA = kind === "CA";
  return (
    <span
      className={cn(
        "inline-block rounded px-[7px] py-0.5 font-sans text-[10px] font-bold tracking-[0.18em]",
        isCA ? "bg-[var(--accent-soft)] text-primary" : "bg-[var(--success-soft)] text-success",
      )}
    >
      {kind}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-[3px] bg-field">
      <div
        className={cn(
          "h-full rounded-[3px] transition-[width] duration-500 ease-out",
          value >= 80 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-primary",
        )}
        style={{
          width: `${value}%`,
        }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ConsolidatedActionPlanPage() {
  const capas = useCapaStore((s) => s.capas);
  const correctiveActions = useCapaStore((s) => s.correctiveActions);
  const preventiveActions = useCapaStore((s) => s.preventiveActions);
  const [groupMode, setGroupMode] = useState<GroupMode>("department");
  const [hasClustered, setHasClustered] = useState(false);
  const [isClustering, setIsClustering] = useState(false);

  const unifiedActions = useMemo<UnifiedAction[]>(() => {
    const capaById = new Map(capas.map((c) => [c.id, c]));

    const cas: UnifiedAction[] = correctiveActions.map((a: CorrectiveAction) => {
      const capa = capaById.get(a.capaId);
      return {
        kind: "CA",
        id: a.id,
        capaId: a.capaId,
        description: a.description,
        pic: a.pic,
        targetDate: a.dueDate,
        status: a.status,
        department: capa?.department ?? "Unknown",
        rootCause: a.linkedRootCause || capa?.rca.confirmedRootCauses[0] || "Unclassified",
        riskPriority: getRiskPriority(capa?.impact.severity, a.status, a.dueDate),
      };
    });

    const pas: UnifiedAction[] = preventiveActions.map((a: PreventiveAction) => {
      const capa = capaById.get(a.capaId);
      return {
        kind: "PA",
        id: a.id,
        capaId: a.capaId,
        description: a.description,
        pic: a.pic,
        targetDate: a.targetDate,
        status: a.status,
        department: capa?.department ?? "Unknown",
        rootCause: capa?.rca.confirmedRootCauses[0] ?? "Preventive control",
        riskPriority: getRiskPriority(capa?.impact.severity, a.status, a.targetDate),
      };
    });

    return [...cas, ...pas];
  }, [capas, correctiveActions, preventiveActions]);

  const groups = useMemo(
    () => groupActions(unifiedActions, hasClustered ? groupMode : "department"),
    [groupMode, hasClustered, unifiedActions],
  );

  const totalProgress = getGroupProgress(unifiedActions);

  async function runClustering() {
    setIsClustering(true);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    setHasClustered(true);
    setIsClustering(false);
    toast.success("Nova clustering complete", {
      description: "Actions grouped by root cause, department, and risk priority signals.",
    });
  }

  function handleExport() {
    toast.success("Export prepared", {
      description: "Consolidated action plan Excel export is mocked in this demo.",
    });
  }

  return (
    <div className="animate-page-enter">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="m-0 font-sans text-[22px] font-semibold tracking-[-0.02em] text-foreground"
          >
            Consolidated action plan
          </h1>
          <p className="mt-1.5 max-w-[600px] font-sans text-[13px] leading-6 text-foreground-tertiary">
            Management overview of corrective and preventive actions across all CAPAs, grouped by recurring root cause, department, or risk priority.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3.5 py-2 font-sans text-[13px] text-foreground-secondary transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] hover:bg-field"
          >
            <Download size={14} strokeWidth={1.75} />
            Export Excel
          </button>
          <button
            onClick={runClustering}
            disabled={isClustering}
            className={cn(
              "inline-flex items-center gap-[7px] rounded-[var(--r-sm)] border-0 px-4 py-2 font-sans text-[13px] font-semibold transition-[filter] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
              isClustering
                ? "cursor-not-allowed bg-field text-foreground-tertiary"
                : "cursor-pointer bg-[image:var(--grad-brand)] text-primary-foreground hover:brightness-110",
            )}
          >
            {isClustering ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <BrainCircuit size={14} strokeWidth={1.75} />
            )}
            {isClustering ? "Clustering…" : "AI Clustering"}
          </button>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
        <KpiCard label="Total actions" value={unifiedActions.length} />
        <KpiCard label="Corrective" value={correctiveActions.length} />
        <KpiCard label="Preventive" value={preventiveActions.length} />
        <KpiCard
          label="Overall progress"
          value={`${totalProgress}%`}
          sub={<ProgressBar value={totalProgress} />}
        />
      </div>

      {/* ── Group mode selector ───────────────────────────────────────── */}
      <div
        className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] items-center gap-4 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-5 py-4 shadow-sm"
      >
        <FilterSelect
          value={groupMode}
          onChange={(v) => setGroupMode(v as GroupMode)}
          ariaLabel="Group actions by"
          options={[
            { value: "rootCause", label: "Root cause cluster" },
            { value: "department", label: "Department" },
            { value: "risk", label: "Risk priority" },
          ]}
        />
        <div
          className="rounded-[var(--r-sm)] bg-elevated px-3.5 py-2.5 font-sans text-xs leading-6 text-foreground-tertiary"
        >
          {hasClustered
            ? "Nova clustering is active. Switch grouping modes to inspect management views."
            : "Default view is grouped by department. Run AI Clustering to activate root cause and risk-priority grouping."}
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {isClustering && (
        <div
          className="mb-4 flex items-center gap-2 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-5 py-3.5 font-sans text-xs text-primary"
        >
          <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
          Nova is clustering CA and PA records by recurring quality signals…
        </div>
      )}

      {/* ── Groups ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const progress = getGroupProgress(group.actions);
          const owners = Array.from(new Set(group.actions.map((a) => a.pic))).slice(0, 4);

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm"
            >
              {/* Group header */}
              <div className="border-b border-border-subtle px-5 py-4">
                <div className="mb-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-sans text-[15px] font-semibold text-foreground">{group.title}</div>
                    <div className="mt-[3px] font-sans text-xs text-foreground-tertiary">
                      PIC: {owners.join(", ") || "Unassigned"}
                    </div>
                  </div>
                  <span
                    className="rounded-[20px] border border-[var(--line-2)] bg-field px-2.5 py-[3px] font-sans text-[11px] font-semibold text-foreground-secondary"
                  >
                    {group.actions.length} action{group.actions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar value={progress} />
                  </div>
                  <span className="min-w-8 text-right font-sans text-xs font-semibold text-foreground-secondary">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Group table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-[13px]">
                  <thead>
                    <tr className="bg-[var(--table-head-bg)]">
                      {["Type", "Action", "CAPA", "PIC", "Due / Target", "Status"].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-3.5 py-[9px] text-left font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--table-head-fg)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.actions.map((action) => (
                      <tr
                        key={`${action.kind}-${action.id}`}
                        className="border-t border-border-subtle align-top transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated"
                      >
                        <td className="px-3.5 py-3">
                          <KindBadge kind={action.kind} />
                        </td>
                        <td className="max-w-[380px] px-3.5 py-3">
                          <div className="mb-[3px] font-sans text-[11px] text-primary">
                            {action.id}
                          </div>
                          <div className="leading-[1.4] text-foreground-secondary">{action.description}</div>
                          <div className="mt-1 text-[11px] text-foreground-tertiary">
                            Root cause: {action.rootCause}
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <Link
                            to={`/capa/${action.capaId}`}
                            className="font-sans text-xs text-primary no-underline hover:underline"
                          >
                            {action.capaId}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-3 text-foreground-secondary">{action.pic}</td>
                        <td className="whitespace-nowrap px-3.5 py-3">
                          <div className="text-foreground-secondary">{formatDate(action.targetDate)}</div>
                          {action.riskPriority === "High" && (
                            <div className={cn("mt-[3px] text-[10px] font-semibold", riskColor("High"))}>
                              High risk
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <StatusBadge status={action.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer link ───────────────────────────────────────────────── */}
      <div className="mt-5 flex justify-end">
        <Link
          to="/capa"
          className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3.5 py-2 font-sans text-[13px] text-foreground-secondary no-underline transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] hover:bg-field"
        >
          View all CAPAs
          <ArrowRight size={14} strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
