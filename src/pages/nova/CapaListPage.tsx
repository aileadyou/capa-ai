/**
 * CapaListPage — All CAPAs view (wireframe section 06)
 *
 * Filterable table of all CAPA cases with quality score, severity,
 * status, PIC, and due-date visibility.
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { useCapaStore, usePersonaStore } from "@/store";
import type { CAPACase, CorrectiveAction, PersonaID, PreventiveAction } from "@/types";
import { formatDate, formatRelativeTime } from "@/utils/formatters";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterCard, FilterSearchInput, FilterSelect } from "@/components/shared/FilterControls";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypePill } from "@/components/shared/TypePill";
import { ScorePill } from "@/components/shared/ScorePill";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "all";
const DATE_FILTERS = ["all", "overdue", "next_7_days", "updated_30_days"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextDueDate(capaId: string, cas: CorrectiveAction[], pas: PreventiveAction[]): string | undefined {
  return [
    ...cas.filter((a) => a.capaId === capaId && !["completed", "verified"].includes(a.status)).map((a) => a.dueDate),
    ...pas.filter((a) => a.capaId === capaId && !["completed", "verified"].includes(a.status)).map((a) => a.targetDate),
  ].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

function isWithinNextSevenDays(date: string): boolean {
  const now = new Date();
  const target = new Date(date);
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() + 7);
  return target >= now && target <= cutoff;
}

function isOverdue(date: string): boolean {
  return new Date(date).getTime() < Date.now();
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface CapaRow { capa: CAPACase; nextDueDate?: string; }

export function CapaListPage() {
  const navigate = useNavigate();
  const capas = useCapaStore((s) => s.capas);
  const correctiveActions = useCapaStore((s) => s.correctiveActions);
  const preventiveActions = useCapaStore((s) => s.preventiveActions);
  const personas = usePersonaStore((s) => s.personas);
  const getPersonaName = (id: PersonaID) => personas.find((p) => p.id === id)?.displayName ?? id;

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [departmentFilter, setDepartmentFilter] = useState(ALL);
  const [severityFilter, setSeverityFilter] = useState<string>(ALL);
  const [dateFilter, setDateFilter] = useState<DateFilter>(ALL);

  const departments = useMemo(
    () => Array.from(new Set(capas.map((c) => c.department))).sort(),
    [capas],
  );

  const rows = useMemo<CapaRow[]>(
    () => capas.map((capa) => ({
      capa,
      nextDueDate: getNextDueDate(capa.id, correctiveActions, preventiveActions),
    })),
    [capas, correctiveActions, preventiveActions],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const updatedCutoff = new Date(now);
    updatedCutoff.setDate(now.getDate() - 30);

    return rows.filter(({ capa, nextDueDate }) => {
      if (typeFilter !== ALL && capa.type !== typeFilter) return false;
      if (statusFilter !== ALL && capa.status !== statusFilter) return false;
      if (departmentFilter !== ALL && capa.department !== departmentFilter) return false;
      if (severityFilter !== ALL && capa.impact.severity !== severityFilter) return false;
      if (dateFilter === "overdue" && (!nextDueDate || !isOverdue(nextDueDate))) return false;
      if (dateFilter === "next_7_days" && (!nextDueDate || !isWithinNextSevenDays(nextDueDate))) return false;
      if (dateFilter === "updated_30_days" && new Date(capa.updatedAt) < updatedCutoff) return false;
      if (!q) return true;
      return [capa.id, capa.findingId, capa.title, capa.department, capa.status, capa.type, capa.assignedTo]
        .join(" ").toLowerCase().includes(q);
    });
  }, [dateFilter, departmentFilter, query, rows, severityFilter, statusFilter, typeFilter]);

  return (
    <div className="animate-page-enter" style={{ maxWidth: "1400px" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}>
            CAPA list
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", marginTop: "6px", lineHeight: "1.5", maxWidth: "560px" }}>
            Track every deviation, audit finding, and complaint CAPA with quality score, due date, and workflow status.
          </p>
        </div>
        <Link
          to="/capa/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "9px 18px",
            background: "var(--grad-brand)",
            color: "var(--on-accent)",
            borderRadius: "var(--r-sm)",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            textDecoration: "none",
            transition: "filter var(--dur-fast) var(--ease-out)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        >
          <Plus size={14} strokeWidth={2} />
          New CAPA
        </Link>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: "16px" }}>
        <FilterCard>
          <FilterSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search CAPA, finding, title, or department"
            ariaLabel="Search CAPA cases"
          />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} ariaLabel="Filter by type"
            options={[{ value: ALL, label: "All types" }, { value: "deviation", label: "Deviation" }, { value: "audit", label: "Audit Finding" }, { value: "complaint", label: "Complaint" }]} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter by status"
            options={[{ value: ALL, label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "disposisi", label: "Disposition" }, { value: "investigation", label: "Investigation" }, { value: "approval", label: "Approval" }, { value: "closed", label: "Closed" }]} />
          <FilterSelect value={departmentFilter} onChange={setDepartmentFilter} ariaLabel="Filter by department"
            options={[{ value: ALL, label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]} />
          <FilterSelect value={severityFilter} onChange={setSeverityFilter} ariaLabel="Filter by severity"
            options={[{ value: ALL, label: "All severities" }, { value: "Minor", label: "Minor" }, { value: "Major", label: "Major" }, { value: "Critical", label: "Critical" }]} />
          <FilterSelect value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)} ariaLabel="Filter by due date"
            options={[{ value: ALL, label: "All dates" }, { value: "overdue", label: "Overdue" }, { value: "next_7_days", label: "Due next 7 days" }, { value: "updated_30_days", label: "Updated last 30 days" }]} />
        </FilterCard>
      </div>

      {/* ── Results count ────────────────────────────────────────────── */}
      <div style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--fg-3)",
        marginBottom: "10px",
      }}>
        {filteredRows.length} CAPA case{filteredRows.length !== 1 ? "s" : ""}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        maxWidth: "100%",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "var(--table-head-bg)", borderBottom: "1px solid var(--line-2)" }}>
                {["CAPA", "Type", "Severity", "Status", "Quality", "PIC", "Due date", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--fg-2)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "24px" }}>
                    <EmptyState
                      title="No CAPA cases"
                      description="No CAPA cases match the current filters."
                    />
                  </td>
                </tr>
              )}
              {filteredRows.map(({ capa, nextDueDate }) => {
                const overdue = nextDueDate && isOverdue(nextDueDate);
                return (
                  <tr
                    key={capa.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open CAPA ${capa.id}: ${capa.title}`}
                    style={{ borderTop: "1px solid var(--line-1)", verticalAlign: "middle", transition: "background var(--dur-fast) var(--ease-out)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => navigate(`/capa/${capa.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/capa/${capa.id}`);
                      }
                    }}
                  >
                    {/* CAPA ID + title */}
                    <td style={{ padding: "12px 14px", maxWidth: "320px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", marginBottom: "3px" }}>
                        {capa.id}
                      </div>
                      <div style={{ fontWeight: 500, color: "var(--fg-1)", lineHeight: "1.4" }}>
                        {capa.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--fg-3)", marginTop: "3px" }}>
                        {capa.findingId} · {capa.department}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <TypePill type={capa.type} />
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <SeverityBadge severity={capa.impact.severity} />
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={capa.status} />
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <ScorePill score={capa.score.total} compact />
                    </td>

                    <td style={{ padding: "12px 14px", color: "var(--fg-2)", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {getPersonaName(capa.assignedTo as PersonaID)}
                    </td>

                    {/* Due date */}
                    <td style={{ padding: "12px 14px" }}>
                      {nextDueDate ? (
                        <>
                          <div style={{ color: overdue ? "var(--danger)" : "var(--fg-2)", fontSize: "13px" }}>
                            {formatDate(nextDueDate)}
                          </div>
                          <div style={{ fontSize: "11px", color: overdue ? "var(--danger)" : "var(--fg-3)", marginTop: "2px" }}>
                            {formatRelativeTime(nextDueDate)}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--fg-3)" }}>No open action</span>
                      )}
                    </td>

                    {/* Open button */}
                    <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/capa/${capa.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-line)",
                          borderRadius: "var(--r-sm)",
                          color: "var(--accent)",
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "var(--font-sans)",
                          textDecoration: "none",
                          transition: "background var(--dur-fast) var(--ease-out)",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 20%, transparent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-soft)")}
                      >
                        Open
                        <ArrowRight size={12} strokeWidth={2} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
