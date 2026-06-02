import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
} from "lucide-react";
import NotFound from "@/pages/NotFound";
import { useCapaStore } from "@/store";
import type { CAPACase, PreFillContext } from "@/types";
import type { Finding } from "@/types/finding";
import type { CAPAType, EightDStep } from "@/types";
import {
  formatCAPAStatus,
  formatCAPAType,
  formatDateTime,
} from "@/utils/formatters";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypePill } from "@/components/shared/TypePill";
import { ScorePill } from "@/components/shared/ScorePill";

// ── Nova classification copy (mirrors FindingsListPage) ───────────────────────

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

const STEP_LABELS: Record<EightDStep, string> = {
  problem: "D1 Problem",
  containment: "D2 Containment",
  rca: "D3 Root Cause",
  ca: "D4 Corrective Action",
  pa: "D5 Preventive Action",
  verification: "D6 Verification",
  signoff: "D7 Sign-Off",
};

// ── Badge components: SeverityBadge / StatusBadge / TypePill / ScorePill now
//    live in src/components/shared/* (single tokenized source of truth).

// ── Shared building blocks ────────────────────────────────────────────────────

const eyebrow: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--fg-4)",
  margin: "0 0 4px",
};

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "13px 18px",
          borderBottom: "1px solid var(--line-1)",
        }}
      >
        {icon}
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--fg-1)",
            margin: 0,
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p style={eyebrow}>{label}</p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--fg-1)",
          margin: 0,
          lineHeight: "1.5",
          fontFamily: "var(--font-sans)",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "14px 16px",
      }}
    >
      <p style={eyebrow}>{label}</p>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--fg-1)",
          margin: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Imported source data (per source variant) ─────────────────────────────────

function SourceDataGrid({ prefill, finding }: { prefill?: PreFillContext; finding: Finding }) {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
  };

  if (!prefill) {
    return (
      <div style={gridStyle}>
        <InfoRow label="Source" value={finding.source} />
        <InfoRow label="Department" value={finding.department} />
        <InfoRow label="Reported" value={formatDateTime(finding.reportedAt)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <InfoRow label="Description" value={finding.shortDescription} />
        </div>
      </div>
    );
  }

  if (prefill.source === "Bizzmine") {
    return (
      <div style={gridStyle}>
        <InfoRow label="Deviation ID" value={prefill.deviationId} />
        <InfoRow label="Reported" value={formatDateTime(prefill.reportedAt)} />
        <InfoRow label="Occurred" value={formatDateTime(prefill.occurredAt)} />
        <InfoRow label="Area" value={prefill.location.area} />
        <InfoRow label="Line" value={prefill.location.line} />
        <InfoRow label="Equipment ID" value={prefill.location.equipmentId} />
        <InfoRow label="Initiator" value={`${prefill.initiator.name} · ${prefill.initiator.role}`} />
        <InfoRow label="Affected batches" value={prefill.affectedBatches.join(", ")} />
        <InfoRow label="SOP references" value={prefill.sopReferences.join(", ")} />
        <div style={{ gridColumn: "1 / -1" }}>
          <InfoRow label="Initial observation" value={prefill.initialObservation} />
        </div>
      </div>
    );
  }

  if (prefill.source === "Q100+") {
    return (
      <div style={gridStyle}>
        <InfoRow label="Finding ID" value={prefill.findingId} />
        <InfoRow label="Audit ID" value={prefill.auditId} />
        <InfoRow label="Audit type" value={prefill.auditType} />
        <InfoRow label="Audit date" value={formatDateTime(prefill.auditDate)} />
        <InfoRow label="Auditor" value={`${prefill.auditor.name} · ${prefill.auditor.organization}`} />
        <InfoRow label="Auditee" value={`${prefill.auditee.department} · ${prefill.auditee.contactPerson}`} />
        <InfoRow label="Finding category" value={prefill.findingCategory} />
        <InfoRow label="Regulation reference" value={prefill.regulationReference.join(", ")} />
        <InfoRow label="SOP references" value={prefill.sopReferences.join(", ")} />
        <div style={{ gridColumn: "1 / -1" }}>
          <InfoRow label="Finding description" value={prefill.findingDescription} />
        </div>
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      <InfoRow label="Complaint ID" value={prefill.complaintId} />
      <InfoRow label="Reported" value={formatDateTime(prefill.reportedAt)} />
      <InfoRow label="Customer" value={`${prefill.customer.name} · ${prefill.customer.type}`} />
      <InfoRow label="Product" value={prefill.product.name} />
      <InfoRow label="Lot number" value={prefill.product.lotNumber} />
      <InfoRow label="Expiry date" value={prefill.product.expiryDate} />
      <InfoRow label="Complaint type" value={prefill.complaintType} />
      <div style={{ gridColumn: "1 / -1" }}>
        <InfoRow label="Complaint description" value={prefill.description} />
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ finding, capa }: { finding: Finding; capa?: CAPACase }) {
  const items = [
    {
      label: "Finding reported",
      description: `${finding.id} imported from ${finding.source}.`,
      active: true,
    },
    {
      label: "CAPA linked",
      description: capa ? `${capa.id} is connected to this finding.` : "CAPA has not been created yet.",
      active: Boolean(capa),
    },
    {
      label: "Investigation started",
      description: capa
        ? `Current step is ${STEP_LABELS[capa.currentStep]}.`
        : "Create CAPA with Nova to start the investigation.",
      active: Boolean(capa && capa.status !== "draft"),
    },
    {
      label: "Audit Ready closure",
      description: capa?.status === "closed" ? "CAPA was closed as Audit Ready." : "Closure is pending.",
      active: capa?.status === "closed",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, index) => (
        <div key={item.label} style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {item.active ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: "var(--success)" }} />
            ) : (
              <Circle size={16} style={{ flexShrink: 0, color: "var(--fg-4)" }} />
            )}
            {index < items.length - 1 && (
              <div
                style={{
                  width: "1px",
                  flex: 1,
                  minHeight: "22px",
                  background: "var(--line-2)",
                  margin: "4px 0",
                }}
              />
            )}
          </div>
          <div style={{ paddingBottom: index < items.length - 1 ? "14px" : 0 }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: item.active ? "var(--fg-1)" : "var(--fg-3)",
                margin: "0 0 2px",
                fontFamily: "var(--font-sans)",
                lineHeight: "1.3",
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--fg-4)",
                margin: 0,
                fontFamily: "var(--font-sans)",
                lineHeight: "1.45",
              }}
            >
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function FindingDetailPage() {
  const { id } = useParams();
  const finding = useCapaStore((state) =>
    id ? state.findings.find((record) => record.id === id) : undefined,
  );
  const capa = useCapaStore((state) =>
    finding
      ? state.capas.find(
          (record) => record.id === finding.linkedCapaId || record.findingId === finding.id,
        )
      : undefined,
  );

  if (!finding) {
    return <NotFound message={`Finding ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const createCAPAUrl = `/capa/new?type=${finding.type}&sourceId=${finding.id}`;

  const primaryBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
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
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        to="/findings"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--fg-3)",
          textDecoration: "none",
          fontFamily: "var(--font-sans)",
          width: "fit-content",
        }}
      >
        <ArrowLeft size={13} style={{ flexShrink: 0 }} />
        Back to Findings
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={eyebrow}>Quality event</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--fg-1)",
                margin: 0,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.01em",
              }}
            >
              {finding.id}
            </h1>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <TypePill type={finding.type} />
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
            </div>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "var(--fg-3)",
              margin: "10px 0 0",
              maxWidth: "640px",
              lineHeight: "1.6",
              fontFamily: "var(--font-sans)",
            }}
          >
            {finding.shortDescription}
          </p>
        </div>

        {capa ? (
          <Link to={`/capa/${capa.id}`} style={primaryBtnStyle}>
            Open linked CAPA
            <ArrowRight size={14} />
          </Link>
        ) : (
          <Link to={createCAPAUrl} style={primaryBtnStyle}>
            <Plus size={14} />
            Create CAPA with Nova
          </Link>
        )}
      </div>

      {/* ── Stat strip ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
        }}
      >
        <StatCard label="Type" value={formatCAPAType(finding.type)} />
        <StatCard label="Department" value={finding.department} />
        <StatCard label="Reported" value={formatDateTime(finding.reportedAt)} />
        <StatCard label="Linked CAPA" value={capa?.id ?? "Not created"} />
      </div>

      {/* ── Two-column body ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Left: source data + Nova */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
          <SectionCard title="Imported source data">
            <SourceDataGrid prefill={capa?.preFill} finding={finding} />
          </SectionCard>

          {/* Nova classification */}
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-sm)",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Sparkles size={14} style={{ flexShrink: 0, color: "var(--accent)" }} />
              <p
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  margin: 0,
                }}
              >
                Nova classification
              </p>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--fg-2)",
                lineHeight: "1.65",
                margin: 0,
                fontFamily: "var(--font-sans)",
              }}
            >
              {novaText(finding)}
            </p>
          </div>
        </div>

        {/* Right: summary + linked CAPA + timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {capa && (
            <SectionCard title="Linked CAPA">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <Link
                    to={`/capa/${capa.id}`}
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--accent)",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {capa.id}
                  </Link>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--fg-3)",
                      margin: "4px 0 0",
                      lineHeight: "1.5",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {capa.title}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "var(--r-full)",
                      fontSize: "11px",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      background: capa.status === "closed" ? "var(--success-soft)" : "var(--accent-soft)",
                      color: capa.status === "closed" ? "var(--success)" : "var(--accent)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {formatCAPAStatus(capa.status)}
                  </span>
                  <ScorePill score={capa.score.total} compact />
                </div>
                <Link
                  to={`/capa/${capa.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "transparent",
                    color: "var(--fg-2)",
                    border: "1px solid var(--line-2)",
                    borderRadius: "var(--r-sm)",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: 500,
                    textDecoration: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  View CAPA
                  <ArrowRight size={13} />
                </Link>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Finding summary">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <InfoRow label="Source system" value={finding.source} />
              <InfoRow label="Severity" value={finding.severity} />
              <InfoRow label="CAPA type" value={formatCAPAType(finding.type)} />
              <InfoRow label="Department" value={finding.department} />
            </div>
          </SectionCard>

          <SectionCard title="Timeline">
            <Timeline finding={finding} capa={capa} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default FindingDetailPage;
