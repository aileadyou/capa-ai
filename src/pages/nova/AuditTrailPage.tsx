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
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "all";
const DATE_FILTERS = ["all", "today", "last_7_days", "last_30_days"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

const DOMAIN_CLASSES: Record<AuditDomain, string> = {
  system: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  ai_decision: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  integration: "border-success/40 bg-[var(--success-soft)] text-success",
  clear_labeling: "border-success/40 bg-[var(--success-soft)] text-success",
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
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-[20px] border px-2 py-[3px] font-sans text-[11px] font-semibold",
        DOMAIN_CLASSES[domain],
      )}
    >
      {DOMAIN_LABELS[domain]}
    </span>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-5 py-4 shadow-sm">
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
    <div className="animate-page-enter ">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="m-0 font-sans text-4xl font-bold tracking-[-0.025em] text-foreground"
          >
            Global audit trail
          </h1>
          <p className="mt-1.5 max-w-[600px] text-sm leading-normal text-foreground-tertiary">
            Read-only event log for system actions, Nova decisions, integration imports, and approvals. ALCOA+ compliant.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3.5 py-2 font-sans text-sm text-foreground-secondary transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] hover:bg-field"
          >
            <Download size={14} strokeWidth={1.75} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3.5 py-2 font-sans text-sm text-foreground-secondary transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] hover:bg-field"
          >
            <FileText size={14} strokeWidth={1.75} />
            Export PDF
          </button>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total events" value={events.length} />
        <KpiCard label="AI decisions" value={aiDecisionCount} />
        <KpiCard label="Integrations" value={integrationCount} />
        <KpiCard label="Showing" value={filteredEvents.length} />
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="mb-5">
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
        className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary"
      >
        {filteredEvents.length} audit events
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm"
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse font-sans text-sm"
          >
            <thead>
              <tr
                className="border-b border-[var(--line-2)] bg-[var(--table-head-bg)]"
              >
                {["Timestamp", "Domain", "Actor", "Action", "CAPA / Finding", "Before / After", "Nova metadata"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2.5 text-left font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--table-head-fg)]"
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
                    className="p-6"
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
                  className="border-b border-[var(--line-1)] align-top transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated"
                >
                  {/* Timestamp */}
                  <td className="min-w-[120px] p-3">
                    <div className="font-sans text-[11px] text-foreground-tertiary">{evt.id}</div>
                    <div className="mt-[3px] text-xs text-foreground-secondary">{formatDateTime(evt.timestamp)}</div>
                  </td>

                  {/* Domain */}
                  <td className="min-w-[130px] p-3">
                    <DomainBadge domain={evt.domain} />
                    <div className="mt-[5px] text-[11px] text-foreground-tertiary">
                      {formatEventType(evt.eventType)}
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="min-w-[130px] p-3">
                    <div className="text-sm font-semibold text-foreground">{evt.actorName}</div>
                    <div className="mt-0.5 text-[11px] text-foreground-tertiary">{evt.actorRole}</div>
                  </td>

                  {/* Action */}
                  <td className="max-w-[320px] p-3 leading-normal text-foreground-secondary">
                    {evt.action}
                  </td>

                  {/* CAPA / Finding */}
                  <td className="min-w-[130px] p-3">
                    {evt.capaId ? (
                      <Link
                        to={`/capa/${evt.capaId}`}
                        className="font-sans text-xs text-primary no-underline hover:underline"
                      >
                        {evt.capaId}
                      </Link>
                    ) : (
                      <span className="text-[11px] text-foreground-tertiary">No CAPA</span>
                    )}
                    {evt.findingId && (
                      <div className="mt-1">
                        <Link
                          to={`/findings/${evt.findingId}`}
                          className="font-sans text-xs text-primary no-underline hover:underline"
                        >
                          {evt.findingId}
                        </Link>
                      </div>
                    )}
                  </td>

                  {/* Before / After */}
                  <td className="max-w-[240px] p-3">
                    {evt.before || evt.after ? (
                      <div className="flex flex-col gap-1">
                        {evt.before && (
                          <div
                            className="rounded-md bg-field px-2 py-1.5 text-[11px] leading-[1.4] text-foreground-tertiary"
                          >
                            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                              Before
                            </span>
                            <div className="mt-0.5">{evt.before}</div>
                          </div>
                        )}
                        {evt.after && (
                          <div
                            className="rounded-md bg-field px-2 py-1.5 text-[11px] leading-[1.4] text-foreground-secondary"
                          >
                            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                              After
                            </span>
                            <div className="mt-0.5">{evt.after}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-foreground-tertiary">No field diff</span>
                    )}
                  </td>

                  {/* Nova metadata */}
                  <td className="min-w-[140px] p-3">
                    {evt.novaMetadata ? (
                      <div
                        className="rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-2 text-[11px]"
                      >
                        <div className="font-semibold text-primary">{evt.novaMetadata.modelName}</div>
                        <div className="mt-0.5 text-foreground-tertiary">{evt.novaMetadata.modelVersion}</div>
                        <div className="mt-0.5 text-foreground-secondary">
                          Confidence: {evt.novaMetadata.confidenceScore}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-foreground-tertiary">Not AI-generated</span>
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
