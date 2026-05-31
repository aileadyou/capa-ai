/**
 * CapaListPage — All CAPAs view (wireframe section 06)
 *
 * Filterable table of all CAPA cases with quality score, severity,
 * status, PIC, and due-date visibility.
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useCapaStore, usePersonaStore } from "@/store";
import type { CAPACase, CAPAStatus, CAPAType, CorrectiveAction, PersonaID, PreventiveAction, Severity } from "@/types";
import { formatCAPAStatus, formatCAPAType, formatDate, formatRelativeTime } from "@/utils/formatters";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "all";
const DATE_FILTERS = ["all", "overdue", "next_7_days", "updated_30_days"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

// ── Color maps (CSS vars only) ────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, { bg: string; border: string; text: string }> = {
  Minor: { bg: "var(--accent-soft)", border: "var(--accent-line)", text: "var(--accent)" },
  Major: { bg: "var(--warning-soft)", border: "color-mix(in srgb, var(--warning) 38%, transparent)", text: "var(--warning)" },
  Critical: { bg: "var(--danger-soft)", border: "color-mix(in srgb, var(--danger) 38%, transparent)", text: "var(--danger)" },
};

const STATUS_COLORS: Record<CAPAStatus, { bg: string; border: string; text: string }> = {
  draft: { bg: "var(--bg-4)", border: "var(--line-2)", text: "var(--fg-3)" },
  disposisi: { bg: "var(--warning-soft)", border: "color-mix(in srgb, var(--warning) 38%, transparent)", text: "var(--warning)" },
  investigation: { bg: "var(--accent-soft)", border: "var(--accent-line)", text: "var(--accent)" },
  approval: { bg: "var(--warning-soft)", border: "color-mix(in srgb, var(--warning) 38%, transparent)", text: "var(--warning)" },
  closed: { bg: "var(--success-soft)", border: "color-mix(in srgb, var(--success) 38%, transparent)", text: "var(--success)" },
};

const TYPE_COLORS: Record<CAPAType, { bg: string; text: string }> = {
  deviation: { bg: "var(--accent-soft)", text: "var(--accent)" },
  audit: { bg: "var(--success-soft)", text: "var(--success)" },
  complaint: { bg: "var(--warning-soft)", text: "var(--warning)" },
};

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

// ── Sub-components ────────────────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "36px",
          background: "var(--bg-4)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-sm)",
          color: "var(--fg-2)",
          fontSize: "13px",
          fontFamily: "var(--font-sans)",
          padding: "0 32px 0 10px",
          appearance: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M3 5l3 3 3-3" stroke="var(--fg-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const c = SEVERITY_COLORS[severity];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      fontFamily: "var(--font-mono)",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
    }}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: CAPAStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      fontFamily: "var(--font-mono)",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
    }}>
      {formatCAPAStatus(status)}
    </span>
  );
}

function TypePill({ type }: { type: CAPAType }) {
  const c = TYPE_COLORS[type];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 500,
      fontFamily: "var(--font-mono)",
      background: c.bg,
      color: c.text,
    }}>
      {formatCAPAType(type)}
    </span>
  );
}

function ScorePill({ score }: { score: number }) {
  const isReady = score >= 80;
  const isWarn = score >= 60 && score < 80;
  const color = isReady ? "var(--success)" : isWarn ? "var(--warning)" : "var(--danger)";
  const bg = isReady ? "var(--success-soft)" : isWarn ? "var(--warning-soft)" : "var(--danger-soft)";
  const border = isReady
    ? "color-mix(in srgb, var(--success) 38%, transparent)"
    : isWarn
      ? "color-mix(in srgb, var(--warning) 38%, transparent)"
      : "color-mix(in srgb, var(--danger) 38%, transparent)";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 8px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 700,
      fontFamily: "var(--font-mono)",
      background: bg,
      border: `1px solid ${border}`,
      color,
    }}>
      {score}
    </span>
  );
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
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        padding: "16px",
        marginBottom: "16px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 1.5fr) repeat(5, minmax(130px, 1fr))",
          gap: "10px",
          alignItems: "end",
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} strokeWidth={1.75} style={{
              position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--fg-3)",
            }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search CAPA, finding, title, or department"
              style={{
                width: "100%",
                height: "36px",
                background: "var(--bg-4)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-sm)",
                color: "var(--fg-1)",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                padding: "0 12px 0 32px",
                outline: "none",
                transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <StyledSelect value={typeFilter} onChange={setTypeFilter}
            options={[{ value: ALL, label: "All types" }, { value: "deviation", label: "Deviation" }, { value: "audit", label: "Audit Finding" }, { value: "complaint", label: "Complaint" }]} />

          <StyledSelect value={statusFilter} onChange={setStatusFilter}
            options={[{ value: ALL, label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "disposisi", label: "Disposition" }, { value: "investigation", label: "Investigation" }, { value: "approval", label: "Approval" }, { value: "closed", label: "Closed" }]} />

          <StyledSelect value={departmentFilter} onChange={setDepartmentFilter}
            options={[{ value: ALL, label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]} />

          <StyledSelect value={severityFilter} onChange={setSeverityFilter}
            options={[{ value: ALL, label: "All severities" }, { value: "Minor", label: "Minor" }, { value: "Major", label: "Major" }, { value: "Critical", label: "Critical" }]} />

          <StyledSelect value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)}
            options={[{ value: ALL, label: "All dates" }, { value: "overdue", label: "Overdue" }, { value: "next_7_days", label: "Due next 7 days" }, { value: "updated_30_days", label: "Updated last 30 days" }]} />
        </div>
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
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "var(--bg-3)", borderBottom: "1px solid var(--line-1)" }}>
                {["CAPA", "Type", "Severity", "Status", "Quality", "PIC", "Due date", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--fg-3)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: "13px" }}>
                    No CAPA cases match the current filters.
                  </td>
                </tr>
              )}
              {filteredRows.map(({ capa, nextDueDate }) => {
                const overdue = nextDueDate && isOverdue(nextDueDate);
                return (
                  <tr
                    key={capa.id}
                    style={{ borderTop: "1px solid var(--line-1)", verticalAlign: "middle", transition: "background var(--dur-fast) var(--ease-out)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => navigate(`/capa/${capa.id}`)}
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
                      <ScorePill score={capa.score.total} />
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
