/**
 * AuditTrailPage — Global Audit Trail (wireframe section 17)
 *
 * Full-system event log for BPOM audit compliance and ALCOA+ traceability.
 * Read-only append log. Filterable. Exportable to CSV/PDF.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuditTrailStore } from "@/store";
import type { AuditDomain, AuditEvent, AuditEventType } from "@/types";
import { formatDateTime } from "@/utils/formatters";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterCard, FilterSearchInput, FilterSelect } from "@/components/shared/FilterControls";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "all";
const DATE_FILTERS = ["all", "today", "last_7_days", "last_30_days"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

const DOMAIN_COLORS: Record<AuditDomain, { bg: string; border: string; text: string }> = {
  system: { bg: "var(--accent-soft)", border: "var(--accent-line)", text: "var(--accent)" },
  ai_decision: { bg: "var(--accent-soft)", border: "var(--accent-line)", text: "var(--accent)" },
  integration: { bg: "var(--success-soft)", border: "color-mix(in srgb, var(--success) 38%, transparent)", text: "var(--success)" },
  clear_labeling: { bg: "var(--success-soft)", border: "color-mix(in srgb, var(--success) 38%, transparent)", text: "var(--success)" },
};

const DOMAIN_LABELS: Record<AuditDomain, string> = {
  system: "System",
  ai_decision: "AI Decision",
  integration: "Integration",
  clear_labeling: "Clear Labeling",
};

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: "All dates",
  today: "Today",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEventType(eventType: AuditEventType): string {
  return eventType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isInDateFilter(timestamp: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const d = new Date(timestamp);
  const now = new Date();
  if (filter === "today") return d.toDateString() === now.toDateString();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (filter === "last_7_days" ? 7 : 30));
  return d >= cutoff;
}

// ── Styled sub-components ─────────────────────────────────────────────────────

function DomainBadge({ domain }: { domain: AuditDomain }) {
  const colors = DOMAIN_COLORS[domain];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        whiteSpace: "nowrap",
      }}
    >
      {DOMAIN_LABELS[domain]}
    </span>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
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
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AuditTrailPage() {
  const events = useAuditTrailStore((s) => s.events);
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>(ALL);
  const [capaFilter, setCapaFilter] = useState(ALL);
  const [findingFilter, setFindingFilter] = useState(ALL);
  const [actorFilter, setActorFilter] = useState(ALL);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [events],
  );

  const capaIds = useMemo(
    () => Array.from(new Set(events.map((e) => e.capaId).filter(Boolean) as string[])).sort(),
    [events],
  );
  const findingIds = useMemo(
    () => Array.from(new Set(events.map((e) => e.findingId).filter(Boolean) as string[])).sort(),
    [events],
  );
  const actors = useMemo(
    () => Array.from(new Set(events.map((e) => e.actorName))).sort(),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedEvents.filter((evt) => {
      if (domainFilter !== ALL && evt.domain !== domainFilter) return false;
      if (capaFilter !== ALL && evt.capaId !== capaFilter) return false;
      if (findingFilter !== ALL && evt.findingId !== findingFilter) return false;
      if (actorFilter !== ALL && evt.actorName !== actorFilter) return false;
      if (!isInDateFilter(evt.timestamp, dateFilter)) return false;
      if (!q) return true;
      return [evt.id, evt.actorName, evt.actorRole, evt.action, evt.capaId, evt.findingId, evt.before, evt.after, evt.eventType, evt.domain]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [actorFilter, capaFilter, dateFilter, domainFilter, findingFilter, query, sortedEvents]);

  const aiDecisionCount = useMemo(() => events.filter((e) => e.domain === "ai_decision").length, [events]);
  const integrationCount = useMemo(() => events.filter((e) => e.domain === "integration").length, [events]);

  function handleExport(format: "csv" | "pdf") {
    toast.success(`Audit trail ${format.toUpperCase()} export prepared`, {
      description: `${format.toUpperCase()} export is mocked in this frontend demo.`,
    });
  }

  return (
    <div className="animate-page-enter" style={{ maxWidth: "1400px" }}>
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
            Global audit trail
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", marginTop: "6px", maxWidth: "600px", lineHeight: "1.5" }}>
            Read-only event log for system actions, Nova decisions, integration imports, and approvals. ALCOA+ compliant.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleExport("csv")}
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
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
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
            <FileText size={14} strokeWidth={1.75} />
            Export PDF
          </button>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <KpiCard label="Total events" value={events.length} />
        <KpiCard label="AI decisions" value={aiDecisionCount} />
        <KpiCard label="Integrations" value={integrationCount} />
        <KpiCard label="Showing" value={filteredEvents.length} />
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <FilterCard>
          <FilterSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search actor, event, CAPA, before/after"
            ariaLabel="Search audit events"
          />
          <FilterSelect
            value={domainFilter}
            onChange={setDomainFilter}
            ariaLabel="Filter by domain"
            options={[
              { value: ALL, label: "All domains" },
              { value: "system", label: "System" },
              { value: "ai_decision", label: "AI Decision" },
              { value: "integration", label: "Integration" },
              { value: "clear_labeling", label: "Clear Labeling" },
            ]}
          />
          <FilterSelect
            value={capaFilter}
            onChange={setCapaFilter}
            ariaLabel="Filter by CAPA"
            options={[{ value: ALL, label: "All CAPAs" }, ...capaIds.map((id) => ({ value: id, label: id }))]}
          />
          <FilterSelect
            value={findingFilter}
            onChange={setFindingFilter}
            ariaLabel="Filter by finding"
            options={[{ value: ALL, label: "All findings" }, ...findingIds.map((id) => ({ value: id, label: id }))]}
          />
          <FilterSelect
            value={actorFilter}
            onChange={setActorFilter}
            ariaLabel="Filter by actor"
            options={[{ value: ALL, label: "All actors" }, ...actors.map((a) => ({ value: a, label: a }))]}
          />
          <FilterSelect
            value={dateFilter}
            onChange={(v) => setDateFilter(v as DateFilter)}
            ariaLabel="Filter by date"
            options={DATE_FILTERS.map((f) => ({ value: f, label: DATE_FILTER_LABELS[f] }))}
          />
        </FilterCard>
      </div>

      {/* ── Results count ─────────────────────────────────────────────── */}
      <div
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--fg-3)",
          marginBottom: "10px",
        }}
      >
        {filteredEvents.length} audit events
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--table-head-bg)",
                  borderBottom: "1px solid var(--line-2)",
                }}
              >
                {["Timestamp", "Domain", "Actor", "Action", "CAPA / Finding", "Before / After", "Nova metadata"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
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
              {filteredEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "24px" }}
                  >
                    <EmptyState
                      title="No audit events"
                      description="No audit events match the current filters."
                    />
                  </td>
                </tr>
              )}
              {filteredEvents.map((evt: AuditEvent) => (
                <tr
                  key={evt.id}
                  style={{
                    borderBottom: "1px solid var(--line-1)",
                    verticalAlign: "top",
                    transition: "background var(--dur-fast) var(--ease-out)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Timestamp */}
                  <td style={{ padding: "12px", minWidth: "120px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--fg-3)" }}>{evt.id}</div>
                    <div style={{ fontSize: "12px", color: "var(--fg-2)", marginTop: "3px" }}>{formatDateTime(evt.timestamp)}</div>
                  </td>

                  {/* Domain */}
                  <td style={{ padding: "12px", minWidth: "130px" }}>
                    <DomainBadge domain={evt.domain} />
                    <div style={{ fontSize: "11px", color: "var(--fg-3)", marginTop: "5px" }}>
                      {formatEventType(evt.eventType)}
                    </div>
                  </td>

                  {/* Actor */}
                  <td style={{ padding: "12px", minWidth: "130px" }}>
                    <div style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: "13px" }}>{evt.actorName}</div>
                    <div style={{ fontSize: "11px", color: "var(--fg-3)", marginTop: "2px" }}>{evt.actorRole}</div>
                  </td>

                  {/* Action */}
                  <td style={{ padding: "12px", maxWidth: "320px", color: "var(--fg-2)", lineHeight: "1.5" }}>
                    {evt.action}
                  </td>

                  {/* CAPA / Finding */}
                  <td style={{ padding: "12px", minWidth: "130px" }}>
                    {evt.capaId ? (
                      <Link
                        to={`/capa/${evt.capaId}`}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        {evt.capaId}
                      </Link>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--fg-3)" }}>No CAPA</span>
                    )}
                    {evt.findingId && (
                      <div style={{ marginTop: "4px" }}>
                        <Link
                          to={`/findings/${evt.findingId}`}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "var(--accent)",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {evt.findingId}
                        </Link>
                      </div>
                    )}
                  </td>

                  {/* Before / After */}
                  <td style={{ padding: "12px", maxWidth: "240px" }}>
                    {evt.before || evt.after ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {evt.before && (
                          <div
                            style={{
                              background: "var(--bg-4)",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              fontSize: "11px",
                              color: "var(--fg-3)",
                              lineHeight: "1.4",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "var(--fg-3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                              Before
                            </span>
                            <div style={{ marginTop: "2px" }}>{evt.before}</div>
                          </div>
                        )}
                        {evt.after && (
                          <div
                            style={{
                              background: "var(--bg-4)",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              fontSize: "11px",
                              color: "var(--fg-2)",
                              lineHeight: "1.4",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "var(--fg-3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                              After
                            </span>
                            <div style={{ marginTop: "2px" }}>{evt.after}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--fg-3)" }}>No field diff</span>
                    )}
                  </td>

                  {/* Nova metadata */}
                  <td style={{ padding: "12px", minWidth: "140px" }}>
                    {evt.novaMetadata ? (
                      <div
                        style={{
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-line)",
                          borderRadius: "var(--r-sm)",
                          padding: "8px 10px",
                          fontSize: "11px",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--accent)" }}>{evt.novaMetadata.modelName}</div>
                        <div style={{ color: "var(--fg-3)", marginTop: "2px" }}>{evt.novaMetadata.modelVersion}</div>
                        <div style={{ color: "var(--fg-2)", marginTop: "2px" }}>
                          Confidence: {evt.novaMetadata.confidenceScore}%
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--fg-3)" }}>Not AI-generated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
