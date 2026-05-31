import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { useCapaStore } from "@/store";
import type { CAPAType, Severity } from "@/types";
import type { Finding, FindingStatus } from "@/types/finding";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";

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

// ── Badge components ──────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, { bg: string; color: string; label: string }> = {
    Critical: { bg: "rgba(229,87,92,0.15)", color: "#E5575C", label: "Critical" },
    Major: { bg: "rgba(229,87,92,0.10)", color: "#E5575C", label: "Major" },
    Minor: { bg: "rgba(224,163,62,0.12)", color: "#E0A33E", label: "Minor" },
  };
  const s = map[severity] ?? map.Minor;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--r-full)",
        fontSize: "11px",
        fontWeight: severity === "Critical" ? 700 : 600,
        fontFamily: "var(--font-mono)",
        background: s.bg,
        color: s.color,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function StatusBadge({ status }: { status: FindingStatus }) {
  const map: Record<FindingStatus, { bg: string; color: string; label: string }> = {
    capa_in_progress: {
      bg: "var(--accent-soft)",
      color: "var(--accent)",
      label: "CAPA in progress",
    },
    pending_capa: {
      bg: "var(--bg-4)",
      color: "var(--fg-3)",
      label: "No CAPA",
    },
    capa_closed: {
      bg: "rgba(63,185,132,0.10)",
      color: "#3FB984",
      label: "CAPA closed",
    },
    overdue: {
      bg: "rgba(229,87,92,0.10)",
      color: "#E5575C",
      label: "Overdue",
    },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--r-full)",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        background: s.bg,
        color: s.color,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function TypePill({ type }: { type: CAPAType }) {
  const map: Record<CAPAType, { color: string }> = {
    deviation: { color: "var(--accent)" },
    audit: { color: "#3FB984" },
    complaint: { color: "#E0A33E" },
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--r-full)",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        background: "var(--bg-4)",
        color: map[type]?.color ?? "var(--fg-3)",
        border: "1px solid var(--line-2)",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {formatCAPAType(type)}
    </span>
  );
}

function SourceChip({ source }: { source: string }) {
  return (
    <span
      style={{
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: "var(--fg-4)",
        background: "var(--bg-3)",
        border: "1px solid var(--line-1)",
        borderRadius: "var(--r-full)",
        padding: "1px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {source}
    </span>
  );
}

// ── Styled native select ──────────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: "var(--bg-4)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-sm)",
          padding: "8px 32px 8px 12px",
          fontSize: "13px",
          color: "var(--fg-2)",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          outline: "none",
          height: "36px",
          minWidth: "130px",
        }}
      >
        {children}
      </select>
      {/* Chevron icon */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        style={{
          position: "absolute",
          right: "10px",
          pointerEvents: "none",
          color: "var(--fg-3)",
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2,4 6,8 10,4" />
      </svg>
    </div>
  );
}

// ── Finding slide-over panel ──────────────────────────────────────────────────

function FieldPair({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <div
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--line-1)",
          borderRadius: "var(--r-sm)",
          padding: "8px 12px",
          fontSize: "13px",
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
          lineHeight: "1.5",
        }}
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

  // trap focus / close on Escape
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6,8,12,0.55)",
          zIndex: 50,
          backdropFilter: "blur(2px)",
          animation: "fadeIn 200ms ease",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Finding detail"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "400px",
          background: "var(--bg-2)",
          borderLeft: "1px solid var(--line-2)",
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 380ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--line-1)",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                margin: "0 0 2px",
              }}
            >
              Finding detail
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--fg-1)",
                margin: 0,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.02em",
              }}
            >
              {finding.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "var(--r-sm)",
              background: "var(--bg-4)",
              border: "1px solid var(--line-2)",
              color: "var(--fg-3)",
              cursor: "pointer",
            }}
            aria-label="Close panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Badge row */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
            style={{
              background: "var(--bg-3)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "var(--r-md)",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--accent)",
                margin: "0 0 8px",
              }}
            >
              Nova classification
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--fg-2)",
                lineHeight: "1.6",
                margin: 0,
                fontFamily: "var(--font-sans)",
              }}
            >
              {novaText(finding)}
            </p>
          </div>
        </div>

        {/* Action footer */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "16px 20px",
            borderTop: "1px solid var(--line-1)",
            flexShrink: 0,
          }}
        >
          {finding.linkedCapaId ? (
            <Link
              to={`/capa/${finding.linkedCapaId}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "var(--grad-brand)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
              onClick={onClose}
            >
              Open CAPA
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              to={`/capa/new?type=${finding.type}&sourceId=${finding.id}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "var(--grad-brand)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
              onClick={onClose}
            >
              Create CAPA
              <ArrowRight size={14} />
            </Link>
          )}
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--fg-3)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)",
              padding: "9px 16px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Filter helpers ────────────────────────────────────────────────────────────

const allValue = "all";

function isWithinRange(dateStr: string, range: string): boolean {
  if (range === "all") return true;
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  const daysMap: Record<string, number> = {
    last_7_days: 7,
    last_30_days: 30,
    last_90_days: 90,
    last_12_months: 365,
  };
  return date >= now - (daysMap[range] ?? 0) * 86400000;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function FindingsListPage() {
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

  // Row style helpers
  function rowColor(f: Finding) {
    if (f.status === "pending_capa") return "var(--fg-4)";
    if (f.status === "overdue") return "var(--fg-2)";
    return "var(--fg-2)";
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                margin: "0 0 4px",
              }}
            >
              Quality events
            </p>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--fg-1)",
                margin: "0 0 6px",
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.02em",
              }}
            >
              Findings
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--fg-3)",
                margin: 0,
                fontFamily: "var(--font-sans)",
                maxWidth: "520px",
              }}
            >
              Deviations, audit findings, and complaints imported from source systems. New CAPAs are created from here.
            </p>
          </div>

          <Link
            to="/capa/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--grad-brand)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: "var(--r-sm)",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              textDecoration: "none",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={14} />
            New CAPA
          </Link>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--fg-4)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search finding, description, source, department…"
              style={{
                width: "100%",
                background: "var(--bg-3)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-sm)",
                padding: "8px 12px 8px 34px",
                fontSize: "13px",
                color: "var(--fg-1)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                height: "36px",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--line-2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Type filter */}
          <StyledSelect value={typeFilter} onChange={setTypeFilter}>
            <option value="all">All types</option>
            <option value="deviation">Deviation</option>
            <option value="audit">Audit finding</option>
            <option value="complaint">Complaint</option>
          </StyledSelect>

          {/* Severity filter */}
          <StyledSelect value={severityFilter} onChange={setSeverityFilter}>
            <option value="all">All severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </StyledSelect>

          {/* Status filter */}
          <StyledSelect value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All statuses</option>
            <option value="capa_in_progress">CAPA in progress</option>
            <option value="pending_capa">No CAPA</option>
            <option value="overdue">Overdue</option>
            <option value="capa_closed">CAPA closed</option>
          </StyledSelect>
        </div>

        {/* ── Results count ───────────────────────────────────────────────── */}
        <p
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            margin: 0,
          }}
        >
          {filtered.length} {filtered.length === 1 ? "finding" : "findings"}
        </p>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-sans)",
            }}
          >
            {/* Table head */}
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line-2)",
                }}
              >
                {["ID / Source", "Type", "Description", "Severity", "Dept", "Reported", "Status", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--fg-4)",
                        background: "var(--bg-3)",
                        whiteSpace: "nowrap",
                      }}
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
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      fontSize: "13px",
                      color: "var(--fg-4)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    No findings match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((finding) => {
                const dimmed = finding.status === "pending_capa";
                return (
                  <tr
                    key={finding.id}
                    style={{
                      borderTop: "1px solid var(--line-1)",
                      cursor: "pointer",
                      transition: "background 0.18s",
                      opacity: dimmed ? 0.55 : 1,
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background =
                        "var(--bg-3)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")
                    }
                    onClick={() => setSelectedId(finding.id)}
                  >
                    {/* ID + source */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          color: "var(--accent)",
                          margin: "0 0 5px",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {finding.id}
                      </p>
                      <SourceChip source={finding.source} />
                    </td>

                    {/* Type */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <TypePill type={finding.type} />
                    </td>

                    {/* Description */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "top",
                        maxWidth: "300px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: rowColor(finding),
                          margin: 0,
                          lineHeight: "1.45",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {finding.shortDescription}
                      </p>
                    </td>

                    {/* Severity */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <SeverityBadge severity={finding.severity} />
                    </td>

                    {/* Department */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "top",
                        fontSize: "12px",
                        color: "var(--fg-3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {finding.department}
                    </td>

                    {/* Reported */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "top",
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--fg-3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(finding.reportedAt)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <StatusBadge status={finding.status} />
                    </td>

                    {/* Actions */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                      onClick={(e) => e.stopPropagation()} // don't let actions bubble to row click
                    >
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {/* View (opens slide-over) */}
                        <button
                          onClick={() => setSelectedId(finding.id)}
                          style={{
                            background: "transparent",
                            color: "var(--fg-3)",
                            border: "1px solid var(--line-2)",
                            borderRadius: "var(--r-sm)",
                            padding: "5px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          View
                        </button>

                        {/* Open CAPA or Create CAPA */}
                        {finding.linkedCapaId ? (
                          <Link
                            to={`/capa/${finding.linkedCapaId}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                              border: "1px solid var(--accent-line)",
                              borderRadius: "var(--r-sm)",
                              padding: "5px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Open CAPA
                            <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <Link
                            to={`/capa/new?type=${finding.type}&sourceId=${finding.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "var(--grad-brand)",
                              color: "var(--on-accent)",
                              border: "none",
                              borderRadius: "var(--r-sm)",
                              padding: "5px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Create CAPA
                            <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
