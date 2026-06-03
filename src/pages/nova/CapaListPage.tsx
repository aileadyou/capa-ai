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
    <div className="animate-page-enter ">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 font-sans text-4xl font-semibold tracking-[-0.025em] text-foreground">
            CAPA list
          </h1>
          <p className="mt-1.5 max-w-[560px] text-sm leading-normal text-foreground-tertiary">
            Track every deviation, audit finding, and complaint CAPA with quality score, due date, and workflow status.
          </p>
        </div>
        <Link
          to="/capa/new"
          className="inline-flex items-center gap-[7px] rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-[18px] py-[9px] font-sans text-sm font-semibold text-primary-foreground no-underline transition-[filter] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:brightness-110 active:scale-[0.99]"
        >
          <Plus size={14} strokeWidth={2} />
          New CAPA
        </Link>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="mb-4">
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
            options={[{ value: ALL, label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "pending_review", label: "Pending Review" }, { value: "revision_requested", label: "Revision Requested" }, { value: "rejected", label: "Rejected" }, { value: "investigation", label: "Investigation" }, { value: "approval", label: "Approval" }, { value: "closed", label: "Closed" }]} />
          <FilterSelect value={departmentFilter} onChange={setDepartmentFilter} ariaLabel="Filter by department"
            options={[{ value: ALL, label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]} />
          <FilterSelect value={severityFilter} onChange={setSeverityFilter} ariaLabel="Filter by severity"
            options={[{ value: ALL, label: "All severities" }, { value: "Ungraded", label: "Ungraded" }, { value: "Minor", label: "Minor" }, { value: "Major", label: "Major" }, { value: "Critical", label: "Critical" }]} />
          <FilterSelect value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)} ariaLabel="Filter by due date"
            options={[{ value: ALL, label: "All dates" }, { value: "overdue", label: "Overdue" }, { value: "next_7_days", label: "Due next 7 days" }, { value: "updated_30_days", label: "Updated last 30 days" }]} />
        </FilterCard>
      </div>

      {/* ── Results count ────────────────────────────────────────────── */}
      <div className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
        {filteredRows.length} CAPA case{filteredRows.length !== 1 ? "s" : ""}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="max-w-full overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-[var(--line-2)] bg-[var(--table-head-bg)]">
                {["CAPA", "Type", "Severity", "Status", "Quality", "PIC", "Due date", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3.5 py-2.5 text-left font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--table-head-fg)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6">
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
                    className="cursor-pointer border-t border-[var(--line-1)] align-middle transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated"
                    onClick={() => navigate(`/capa/${capa.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/capa/${capa.id}`);
                      }
                    }}
                  >
                    {/* CAPA ID + title */}
                    <td className="max-w-[320px] px-3.5 py-3">
                      <div className="mb-[3px] font-sans text-[11px] text-primary">
                        {capa.id}
                      </div>
                      <div className="font-medium leading-[1.4] text-foreground">
                        {capa.title}
                      </div>
                      <div className="mt-[3px] text-[11px] text-foreground-tertiary">
                        {capa.findingId} · {capa.department}
                      </div>
                    </td>

                    <td className="px-3.5 py-3">
                      <TypePill type={capa.type} />
                    </td>

                    <td className="px-3.5 py-3">
                      <SeverityBadge severity={capa.impact.severity} />
                    </td>

                    <td className="px-3.5 py-3">
                      <StatusBadge status={capa.status} />
                    </td>

                    <td className="px-3.5 py-3">
                      <ScorePill score={capa.score.total} compact />
                    </td>

                    <td className="whitespace-nowrap px-3.5 py-3 text-xs text-foreground-secondary">
                      {getPersonaName(capa.assignedTo as PersonaID)}
                    </td>

                    {/* Due date */}
                    <td className="px-3.5 py-3">
                      {nextDueDate ? (
                        <>
                          <div className={overdue ? "text-sm text-destructive" : "text-sm text-foreground-secondary"}>
                            {formatDate(nextDueDate)}
                          </div>
                          <div className={overdue ? "mt-0.5 text-[11px] text-destructive" : "mt-0.5 text-[11px] text-foreground-tertiary"}>
                            {formatRelativeTime(nextDueDate)}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-foreground-tertiary">No open action</span>
                      )}
                    </td>

                    {/* Open button */}
                    <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/capa/${capa.id}`}
                        className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1.5 font-sans text-xs font-semibold text-primary no-underline transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-primary/20"
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
