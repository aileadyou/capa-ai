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
  if (priority === "High") return "var(--danger)";
  if (priority === "Medium") return "var(--warning)";
  return "var(--fg-3)";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "16px 20px",
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
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: "var(--fg-1)",
          letterSpacing: "-0.02em",
        }}
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
      style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.18em",
        background: isCA ? "var(--accent-soft)" : "var(--success-soft)",
        color: isCA ? "var(--accent)" : "var(--success)",
      }}
    >
      {kind}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ background: "var(--bg-4)", borderRadius: "3px", height: "6px", overflow: "hidden" }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: value >= 80 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--accent)",
          borderRadius: "3px",
          transition: "width 500ms var(--ease-out)",
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
    <div className="animate-page-enter" style={{ maxWidth: "1300px" }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
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
            Consolidated action plan
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", marginTop: "6px", maxWidth: "600px", lineHeight: "1.5" }}>
            Management overview of corrective and preventive actions across all CAPAs, grouped by recurring root cause, department, or risk priority.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleExport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "var(--bg-3)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)",
              color: "var(--fg-2)",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-3)"; e.currentTarget.style.background = "var(--bg-4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.background = "var(--bg-3)"; }}
          >
            <Download size={14} strokeWidth={1.75} />
            Export Excel
          </button>
          <button
            onClick={runClustering}
            disabled={isClustering}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              background: isClustering ? "var(--bg-4)" : "var(--grad-brand)",
              color: isClustering ? "var(--fg-3)" : "var(--on-accent)",
              border: "none",
              borderRadius: "var(--r-sm)",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: isClustering ? "not-allowed" : "pointer",
              transition: "filter var(--dur-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => { if (!isClustering) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {isClustering ? (
              <Loader2 size={14} strokeWidth={1.75} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <BrainCircuit size={14} strokeWidth={1.75} />
            )}
            {isClustering ? "Clustering…" : "AI Clustering"}
          </button>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "12px", marginBottom: "20px" }}>
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
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-sm)",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "16px",
          alignItems: "center",
        }}
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
          style={{
            background: "var(--bg-3)",
            borderRadius: "var(--r-sm)",
            padding: "10px 14px",
            fontSize: "12px",
            color: "var(--fg-3)",
            lineHeight: "1.5",
          }}
        >
          {hasClustered
            ? "Nova clustering is active. Switch grouping modes to inspect management views."
            : "Default view is grouped by department. Run AI Clustering to activate root cause and risk-priority grouping."}
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {isClustering && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 20px",
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-lg)",
            marginBottom: "16px",
            fontSize: "12px",
            color: "var(--accent)",
          }}
        >
          <Loader2 size={14} strokeWidth={1.75} style={{ animation: "spin 1s linear infinite" }} />
          Nova is clustering CA and PA records by recurring quality signals…
        </div>
      )}

      {/* ── Groups ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {groups.map((group) => {
          const progress = getGroupProgress(group.actions);
          const owners = Array.from(new Set(group.actions.map((a) => a.pic))).slice(0, 4);

          return (
            <div
              key={group.id}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-lg)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              {/* Group header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line-1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg-1)" }}>{group.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--fg-3)", marginTop: "3px" }}>
                      PIC: {owners.join(", ") || "Unassigned"}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      background: "var(--bg-4)",
                      border: "1px solid var(--line-2)",
                      color: "var(--fg-2)",
                    }}
                  >
                    {group.actions.length} action{group.actions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={progress} />
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-2)", minWidth: "32px", textAlign: "right" }}>
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Group table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "var(--font-sans)" }}>
                  <thead>
                    <tr style={{ background: "var(--table-head-bg)" }}>
                      {["Type", "Action", "CAPA", "PIC", "Due / Target", "Status"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "9px 14px",
                            textAlign: "left",
                            fontSize: "10px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "var(--fg-3)",
                            whiteSpace: "nowrap",
                          }}
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
                        style={{ borderTop: "1px solid var(--line-1)", verticalAlign: "top", transition: "background var(--dur-fast) var(--ease-out)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <KindBadge kind={action.kind} />
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: "380px" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", marginBottom: "3px" }}>
                            {action.id}
                          </div>
                          <div style={{ color: "var(--fg-2)", lineHeight: "1.4" }}>{action.description}</div>
                          <div style={{ fontSize: "11px", color: "var(--fg-3)", marginTop: "4px" }}>
                            Root cause: {action.rootCause}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <Link
                            to={`/capa/${action.capaId}`}
                            style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                          >
                            {action.capaId}
                          </Link>
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--fg-2)", whiteSpace: "nowrap" }}>{action.pic}</td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ color: "var(--fg-2)" }}>{formatDate(action.targetDate)}</div>
                          {action.riskPriority === "High" && (
                            <div style={{ fontSize: "10px", fontWeight: 600, color: riskColor("High"), marginTop: "3px" }}>
                              High risk
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
        <Link
          to="/capa"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            background: "var(--bg-3)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-sm)",
            color: "var(--fg-2)",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
            textDecoration: "none",
            transition: "border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-3)"; e.currentTarget.style.background = "var(--bg-4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.background = "var(--bg-3)"; }}
        >
          View all CAPAs
          <ArrowRight size={14} strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
