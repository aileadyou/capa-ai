import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Plus, X } from "lucide-react";
import { useCapaStore } from "@/store";
import type { CAPAType } from "@/types";
import type { Finding } from "@/types/finding";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { useDialog } from "@/hooks/use-dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterCard, FilterSearchInput, FilterSelect } from "@/components/shared/FilterControls";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypePill } from "@/components/shared/TypePill";
import { cn } from "@/lib/utils";

// ── Static Nova classification copy ──────────────────────────────────────────

const NOVA_BY_ID: Record<string, string> = {
  "DEV-2026-0341":
    "Critical aseptic environment deviation. HEPA unit failure pattern matches 2 prior CAPAs (91% similarity). Full 8D CAPA with containment, HEPA PM schedule overhaul, and SOP update is recommended.",
  "AUD-2026-0089":
    "Systematic GMP documentation gap in warehouse material transfer process. Second-person verification breakdown detected across 3 lots. Audit-type 8D CAPA with SOP revision and targeted retraining is recommended.",
  "CMP-2026-0112":
    "Product quality complaint with potential particulate contamination. Probable visual inspection gap during batch release. 8D CAPA with retained sample review and full distribution impact assessment is recommended.",
};

const NOVA_BY_TYPE: Record<CAPAType, string> = {
  deviation:
    "Process deviation detected. Pattern analysis indicates potential systemic root cause. Standard 8D CAPA workflow with documented containment actions is recommended.",
  audit:
    "Compliance gap identified during audit activity. Documentation or procedure deficiency is likely. 8D CAPA with systemic root cause analysis and procedure review is recommended.",
  complaint:
    "Customer quality complaint received. Potential product or process impact requires assessment. 8D CAPA with retained sample review is recommended.",
};

function novaText(finding: Finding) {
  return NOVA_BY_ID[finding.id] ?? NOVA_BY_TYPE[finding.type];
}

// ── Badge components: SeverityBadge / StatusBadge / TypePill now live in
//    src/components/shared/* (single tokenized source of truth).

function SourceChip({ source }: { source: string }) {
  return (
    <span
      className="whitespace-nowrap rounded-[var(--r-full)] border border-[var(--line-1)] bg-elevated px-1.5 py-px font-sans text-[10px] text-foreground-faint"
    >
      {source}
    </span>
  );
}

// ── Finding slide-over panel ──────────────────────────────────────────────────

function FieldPair({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p
        className="mb-1 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-faint"
      >
        {label}
      </p>
      <div
        className="rounded-[var(--r-sm)] border border-[var(--line-1)] bg-elevated px-3 py-2 font-sans text-sm leading-normal text-foreground"
      >
        {value}
      </div>
    </div>
  );
}

function FindingSlideOver({
  finding,
  onClose,
}: {
  finding: Finding;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const getCAPAById = useCapaStore((state) => state.getCAPAById);
  const capa = finding.linkedCapaId ? getCAPAById(finding.linkedCapaId) : undefined;

  // Enrich with CAPA pre-fill data
  let areaEquipment: string | null = null;
  let affectedBatches: string | null = null;
  let observation: string | null = null;

  if (capa) {
    const pf = capa.preFill;
    if (pf.source === "Bizzmine") {
      areaEquipment = `${pf.location.area} · ${pf.location.line} · ${pf.location.equipmentId}`;
      affectedBatches = pf.affectedBatches.join(", ");
      observation = pf.initialObservation;
    } else if (pf.source === "Q100+") {
      areaEquipment = `${pf.auditee.department} · ${pf.auditId}`;
      observation = pf.findingDescription;
    } else {
      areaEquipment = `${pf.product.name} · Lot ${pf.product.lotNumber}`;
      observation = pf.description;
    }
  }

  // focus trap + Escape + scroll lock
  const { ref: panelRef } = useDialog<HTMLDivElement>(true, onClose);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-[var(--glass-dark)] backdrop-blur-sm animate-[fadeIn_var(--dur-tab)_var(--ease-out)]"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Finding detail"
        tabIndex={-1}
        className="fixed bottom-0 right-0 top-0 z-[61] flex w-[400px] max-w-[100vw] flex-col overscroll-contain border-l border-[var(--line-2)] bg-card shadow-lg animate-[leadSlideOver_var(--dur-panel)_var(--ease-out)]"
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b border-[var(--line-1)] px-5 py-4"
        >
          <div>
            <p
              className="mb-0.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-faint"
            >
              Finding detail
            </p>
            <p
              className="m-0 font-sans text-[15px] font-bold tracking-[0.02em] text-foreground"
            >
              {finding.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--line-2)] bg-field text-foreground-tertiary"
            aria-label="Close panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-5"
        >
          {/* Badge row */}
          <div className="flex flex-wrap gap-1.5">
            <TypePill type={finding.type} />
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
          </div>

          {/* Core fields */}
          <FieldPair label="Source system" value={finding.source} />
          <FieldPair label="Department" value={finding.department} />
          <FieldPair label="Reported" value={formatDateTime(finding.reportedAt)} />
          {areaEquipment && <FieldPair label="Area / equipment" value={areaEquipment} />}
          {affectedBatches && <FieldPair label="Affected batches" value={affectedBatches} />}

          {/* Description / observation */}
          <FieldPair
            label={observation ? "Initial observation" : "Description"}
            value={observation ?? finding.shortDescription}
          />

          {/* Linked CAPA */}
          {finding.linkedCapaId && (
            <FieldPair label="Linked CAPA" value={finding.linkedCapaId} />
          )}

          {/* Nova classification block */}
          <div
            className="rounded-[var(--r-md)] border-l-[3px] border-l-primary bg-elevated px-4 py-3.5"
          >
            <p
              className="mb-2 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"
            >
              Nova classification
            </p>
            <p
              className="m-0 font-sans text-sm leading-relaxed text-foreground-secondary"
            >
              {novaText(finding)}
            </p>
          </div>

          {/* Details → full detail page (source grid, timeline, linked CAPA) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/findings/${finding.id}`);
            }}
            className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-4 py-[9px] font-sans text-[13px] font-medium text-foreground-secondary transition-colors duration-200 hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Details
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Action footer */}
        <div
          className="flex shrink-0 gap-2.5 border-t border-[var(--line-1)] px-5 py-4"
        >
          {finding.linkedCapaId ? (
            <Link
              to={`/capa/${finding.linkedCapaId}`}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-4 py-[9px] font-sans text-sm font-semibold tracking-[0.01em] text-primary-foreground no-underline hover:brightness-110 active:scale-[0.99]"
              onClick={onClose}
            >
              Open CAPA
              <ArrowRight size={14} />
            </Link>
          ) : (finding.status === "pending_capa" || finding.status === "overdue") ? (
            <Link
              to={`/capa/new?type=${finding.type}&sourceId=${finding.id}`}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-4 py-[9px] font-sans text-sm font-semibold tracking-[0.01em] text-primary-foreground no-underline hover:brightness-110 active:scale-[0.99]"
              onClick={onClose}
            >
              Create CAPA
              <ArrowRight size={14} />
            </Link>
          ) : null}
          <button
            onClick={onClose}
            className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-4 py-[9px] font-sans text-sm text-foreground-tertiary"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

const allValue = "all";

// ── Main page ─────────────────────────────────────────────────────────────────

export function FindingsListPage() {
  const navigate = useNavigate();
  const findings = useCapaStore((state) => state.findings);

  // Filters
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(allValue);
  const [severityFilter, setSeverityFilter] = useState(allValue);
  const [statusFilter, setStatusFilter] = useState(allValue);

  // Slide-over
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedFinding = useMemo(
    () => findings.find((f) => f.id === selectedId) ?? null,
    [findings, selectedId],
  );

  // Filtered results
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return findings.filter((f) => {
      if (typeFilter !== allValue && f.type !== typeFilter) return false;
      if (severityFilter !== allValue && f.severity !== severityFilter) return false;
      if (statusFilter !== allValue && f.status !== statusFilter) return false;
      if (!q) return true;
      return [f.id, f.shortDescription, f.department, f.source, f.linkedCapaId ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [findings, query, typeFilter, severityFilter, statusFilter]);

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>

            <h1
              className="mb-1.5 mt-0 font-sans text-4xl font-bold tracking-[-0.02em] text-foreground"
            >
              Findings
            </h1>
            <p
              className="m-0 max-w-[520px] font-sans text-sm text-foreground-secondary"
            >
              Deviations, audit findings, and complaints imported from source systems. New CAPAs are created from here.
            </p>
          </div>

          <Link
            to="/capa/new"
            className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-4 py-2 font-sans text-sm font-semibold tracking-[0.01em] text-primary-foreground no-underline hover:brightness-110 active:scale-[0.99]"
          >
            <Plus size={14} />
            New CAPA
          </Link>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <FilterCard>
          <FilterSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search finding, description, source, department…"
            ariaLabel="Search findings"
          />
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            ariaLabel="Filter by type"
            options={[
              { value: "all", label: "All types" },
              { value: "deviation", label: "Deviation" },
              { value: "audit", label: "Audit finding" },
              { value: "complaint", label: "Complaint" },
            ]}
          />
          <FilterSelect
            value={severityFilter}
            onChange={setSeverityFilter}
            ariaLabel="Filter by severity"
            options={[
              { value: "all", label: "All severities" },
              { value: "Ungraded", label: "Ungraded" },
              { value: "Critical", label: "Critical" },
              { value: "Major", label: "Major" },
              { value: "Minor", label: "Minor" },
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: "All statuses" },
              { value: "capa_in_progress", label: "CAPA in progress" },
              { value: "pending_capa", label: "No CAPA" },
              { value: "pending_review", label: "Under review" },
              { value: "overdue", label: "Overdue" },
              { value: "capa_closed", label: "CAPA closed" },
              { value: "rejected", label: "Rejected — no CAPA" },
            ]}
          />
        </FilterCard>

        {/* ── Results count ───────────────────────────────────────────────── */}
        <p
          className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint"
        >
          {filtered.length} {filtered.length === 1 ? "finding" : "findings"}
        </p>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div
          className="max-w-full overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm"
        >
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse font-sans"
            >
            {/* Table head */}
            <thead>
              <tr
                className="border-b border-[var(--line-2)] bg-[var(--table-head-bg)]"
              >
                {["ID / Source", "Type", "Description", "Severity", "Dept", "Reported", "Status", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap bg-transparent px-3.5 py-2.5 text-left font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--table-head-fg)]"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6"
                  >
                    <EmptyState
                      title="No findings"
                      description="No findings match the current filters."
                    />
                  </td>
                </tr>
              )}
              {filtered.map((finding) => {
                const dimmed = finding.status === "pending_capa";
                return (
                  <tr
                    key={finding.id}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    aria-label={`Preview finding ${finding.id}`}
                    className={cn(
                      "cursor-pointer border-t border-[var(--line-1)] transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]",
                      dimmed && "opacity-55",
                    )}
                    onClick={() => setSelectedId(finding.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(finding.id);
                      }
                    }}
                  >
                    {/* ID + source */}
                    <td
                      className="whitespace-nowrap px-3.5 py-3 align-top"
                    >
                      <p
                        className="mb-[5px] mt-0 font-sans text-xs font-semibold tracking-[0.03em] text-primary"
                      >
                        {finding.id}
                      </p>
                      <SourceChip source={finding.source} />
                    </td>

                    {/* Type */}
                    <td className="px-3.5 py-3 align-top">
                      <TypePill type={finding.type} />
                    </td>

                    {/* Description */}
                    <td
                      className="max-w-[300px] px-3.5 py-3 align-top"
                    >
                      <p
                        className={cn(
                          "m-0 line-clamp-2 text-sm leading-[1.45]",
                          finding.status === "pending_capa"
                            ? "text-foreground-faint"
                            : "text-foreground-secondary",
                        )}
                      >
                        {finding.shortDescription}
                      </p>
                    </td>

                    {/* Severity */}
                    <td className="px-3.5 py-3 align-top">
                      <SeverityBadge severity={finding.severity} />
                    </td>

                    {/* Department */}
                    <td
                      className="whitespace-nowrap px-3.5 py-3 align-top text-xs text-foreground-tertiary"
                    >
                      {finding.department}
                    </td>

                    {/* Reported */}
                    <td
                      className="whitespace-nowrap px-3.5 py-3 align-top font-sans text-xs text-foreground-tertiary"
                    >
                      {formatDate(finding.reportedAt)}
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3 align-top">
                      <StatusBadge status={finding.status} />
                    </td>

                    {/* Actions */}
                    <td
                      className="whitespace-nowrap px-3.5 py-3 align-top"
                      onClick={(e) => e.stopPropagation()} // don't let actions bubble to row click
                    >
                      <div className="flex items-center gap-1.5">
                        {/* Details → full detail page. (The row itself opens the
                            quick-preview sheet.) */}
                        <button
                          onClick={() => navigate(`/findings/${finding.id}`)}
                          aria-label={`Open details for finding ${finding.id}`}
                          title="Open details"
                          className="cursor-pointer whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-2.5 py-[5px] font-sans text-xs text-foreground-tertiary transition-colors duration-200 hover:bg-elevated hover:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        >
                          Details
                        </button>

                        {/* Open CAPA or Create CAPA */}
                        {finding.linkedCapaId ? (
                          <Link
                            to={`/capa/${finding.linkedCapaId}`}
                            className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-[5px] font-sans text-xs font-semibold text-primary no-underline hover:bg-primary/20"
                          >
                            Open CAPA
                            <ArrowRight size={12} />
                          </Link>
                        ) : (finding.status === "pending_capa" || finding.status === "overdue") ? (
                          <Link
                            to={`/capa/new?type=${finding.type}&sourceId=${finding.id}`}
                            className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-2.5 py-[5px] font-sans text-xs font-semibold text-primary-foreground no-underline hover:brightness-110 active:scale-[0.99]"
                          >
                            Create CAPA
                            <ArrowRight size={12} />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Slide-over ─────────────────────────────────────────────────────── */}
      {selectedFinding && (
        <FindingSlideOver
          finding={selectedFinding}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
