import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CircleDot,
  Download,
  Lock,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore, usePersonaStore, useUIStore } from "@/store";
import type { CAPACase, EightDStep, PreFillContext } from "@/types";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";

/* ── Mock due dates (no dueDate field in data) ───────────────────── */
const MOCK_DUE: Record<string, string> = {
  "CAPA-2026-0341": "2026-06-06",
  "CAPA-2026-0089": "2026-05-28",
  "CAPA-2026-0112": "2026-06-12",
  "CAPA-2026-0298": "2026-06-04",
  "CAPA-2026-0275": "2026-06-17",
  "CAPA-2026-0188": "2026-03-07",
};

/* ── Step labels ─────────────────────────────────────────────────── */
const STEP_LABELS: Record<EightDStep, string> = {
  problem: "D1 Problem statement",
  containment: "D2 Containment",
  rca: "D3 Root cause analysis",
  ca: "D4 Corrective action",
  pa: "D5 Preventive action",
  verification: "D6 Verification",
  signoff: "D7 Sign-off",
};

const STEP_SHORT: Record<EightDStep, string> = {
  problem: "D1",
  containment: "D2",
  rca: "D3",
  ca: "D4",
  pa: "D5",
  verification: "D6",
  signoff: "D7",
};

/* ── Helpers ─────────────────────────────────────────────────────── */

function getStepState(
  step: EightDStep,
  currentStep: EightDStep,
  status: string,
): "done" | "active" | "locked" {
  if (status === "closed") return "done";
  const ci = eightDSteps.indexOf(currentStep);
  const si = eightDSteps.indexOf(step);
  if (si < ci) return "done";
  if (si === ci) return "active";
  return "locked";
}

function getCtaLabel(step: EightDStep): string {
  return `Continue working on ${STEP_SHORT[step]}`;
}

function getSourceSystem(prefill: PreFillContext): string {
  return prefill.source === "Bizzmine-Complaint" ? "Bizzmine Complaint" : prefill.source;
}

/* ── Design token shortcuts ──────────────────────────────────────── */
const mono = { fontFamily: "var(--font-mono)" };

/* ════════════════════════════════════════════════════════════════════
   LEFT COLUMN — 8D Progress + CAPA Info + Score
   ════════════════════════════════════════════════════════════════════ */

function EyebrowLeft({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: "var(--fg-4)",
        margin: "0 0 8px",
      }}
    >
      {children}
    </p>
  );
}

function StepItem({
  step,
  state,
  capaId,
}: {
  step: EightDStep;
  state: "done" | "active" | "locked";
  capaId: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    done: {
      background: "var(--bg-2)",
      color: "var(--fg-3)",
      border: "1px solid var(--line-1)",
      cursor: "pointer",
    },
    active: {
      background: "var(--accent-soft)",
      color: "var(--accent)",
      border: "1px solid var(--accent-line)",
      borderLeft: "3px solid var(--accent)",
      fontWeight: 600,
      cursor: "pointer",
    },
    locked: {
      background: "var(--bg-1)",
      color: "var(--fg-4)",
      border: "1px solid var(--line-1)",
      cursor: "not-allowed",
    },
  };

  const icon = {
    done: <Check size={12} strokeWidth={2.5} />,
    active: <CircleDot size={12} strokeWidth={2} />,
    locked: <Lock size={11} strokeWidth={2} />,
  }[state];

  const content = (
    <div
      style={{
        ...styles[state],
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "var(--r-sm)",
        fontSize: "12px",
        fontFamily: "var(--font-sans)",
        transition: "background 180ms",
        textDecoration: "none",
        color: styles[state].color,
      }}
    >
      <span style={{ flexShrink: 0, opacity: state === "locked" ? 0.5 : 1 }}>{icon}</span>
      <span
        style={{
          ...mono,
          fontSize: "10px",
          fontWeight: 600,
          marginRight: "2px",
          opacity: state === "locked" ? 0.5 : 1,
        }}
      >
        {STEP_SHORT[step]}
      </span>
      <span style={{ flex: 1, fontSize: "12px" }}>
        {STEP_LABELS[step].replace(/^D\d+ /, "")}
      </span>
    </div>
  );

  if (state === "locked") {
    return <div>{content}</div>;
  }

  return (
    <Link to={`/capa/${capaId}/8d/${step}`} style={{ textDecoration: "none", display: "block" }}>
      {content}
    </Link>
  );
}

function LeftColumn({ capa }: { capa: CAPACase }) {
  const personas = usePersonaStore((s) => s.personas);
  const pic = personas.find((p) => p.id === capa.disposisi?.assignedTo);
  const dueRaw = MOCK_DUE[capa.id];
  const dueStr = dueRaw
    ? new Date(dueRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const isDue = dueRaw ? new Date(dueRaw) < new Date("2026-05-31") : false;
  const sourceId = capa.preFill.source === "Q100+"
    ? (capa.preFill as any).findingId ?? capa.findingId
    : (capa.preFill as any).deviationId ?? (capa.preFill as any).complaintId ?? capa.findingId;

  return (
    <div
      style={{
        width: "220px",
        flexShrink: 0,
        position: "sticky",
        top: "72px",
        height: "calc(100vh - 96px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        paddingRight: "4px",
      }}
    >
      {/* 8D Progress */}
      <div>
        <EyebrowLeft>8D Progress</EyebrowLeft>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {eightDSteps.map((step) => (
            <StepItem
              key={step}
              step={step}
              state={getStepState(step, capa.currentStep, capa.status)}
              capaId={capa.id}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--line-1)" }} />

      {/* CAPA Info */}
      <div>
        <EyebrowLeft>CAPA Info</EyebrowLeft>
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-md)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {[
            { label: "PIC", value: pic?.displayName ?? capa.disposisi?.assignedTo ?? "—" },
            { label: "Dept", value: capa.department },
            {
              label: "Due date",
              value: dueStr,
              color: isDue ? "var(--danger)" : undefined,
            },
            { label: "Source", value: sourceId },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  color: "var(--fg-4)",
                  margin: "0 0 2px",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  color: color ?? "var(--fg-2)",
                  margin: 0,
                  overflowWrap: "break-word",
                  fontWeight: color ? 600 : 400,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Score */}
      <div>
        <EyebrowLeft>Quality Score</EyebrowLeft>
        <Link
          to={`/capa/${capa.id}#score`}
          style={{ textDecoration: "none" }}
          onClick={(e) => {
            e.preventDefault();
            toast.info("Score breakdown", {
              description: `Current score: ${capa.score.total}/100. Navigate to All CAPAs for full breakdown.`,
            });
          }}
        >
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-md)",
              padding: "16px 12px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 180ms",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "48px",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color:
                  capa.score.total >= 80
                    ? "var(--success)"
                    : capa.score.total >= 60
                      ? "var(--warning)"
                      : "var(--danger)",
                margin: 0,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {capa.score.total}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--fg-4)",
                margin: "6px 0 0",
                letterSpacing: "0.04em",
              }}
            >
              Click for breakdown
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   RIGHT COLUMN — Content
   ════════════════════════════════════════════════════════════════════ */

function Pill({
  children,
  bg = "var(--bg-3)",
  color = "var(--fg-2)",
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
}) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "var(--r-full)",
        border: "1px solid var(--line-2)",
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </span>
  );
}

function InfoGrid({ rows }: { rows: Array<{ label: string; value: string; span?: boolean }> }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px 24px",
      }}
    >
      {rows.map(({ label, value, span }) =>
        value ? (
          <div key={label} style={span ? { gridColumn: "1 / -1" } : {}}>
            <p
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--fg-4)",
                margin: "0 0 3px",
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                color: "var(--fg-2)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {value}
            </p>
          </div>
        ) : null,
      )}
    </div>
  );
}

function Card({
  children,
  accentLeft,
  bg = "var(--bg-2)",
}: {
  children: React.ReactNode;
  accentLeft?: string;
  bg?: string;
}) {
  return (
    <div
      style={{
        background: bg,
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-md)",
        borderLeft: accentLeft ? `3px solid ${accentLeft}` : undefined,
        padding: "16px 20px",
      }}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--fg-3)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        margin: "0 0 12px",
      }}
    >
      {children}
    </p>
  );
}

function SourceDataCard({ prefill }: { prefill: PreFillContext }) {
  let rows: Array<{ label: string; value: string; span?: boolean }> = [];

  if (prefill.source === "Bizzmine") {
    rows = [
      { label: "Deviation ID", value: prefill.deviationId ?? "" },
      { label: "Reported", value: prefill.reportedAt ? formatDateTime(prefill.reportedAt) : "" },
      { label: "Area", value: prefill.location?.area ?? "" },
      { label: "Line", value: prefill.location?.line ?? "" },
      { label: "Equipment", value: prefill.location?.equipmentId ?? "" },
      { label: "Initiator", value: prefill.initiator ? `${prefill.initiator.name} · ${prefill.initiator.role}` : "" },
      { label: "Affected batches", value: prefill.affectedBatches?.join(", ") ?? "" },
      { label: "SOP references", value: prefill.sopReferences?.join(", ") ?? "" },
      { label: "Initial observation", value: prefill.initialObservation ?? "", span: true },
    ];
  } else if (prefill.source === "Q100+") {
    rows = [
      { label: "Finding ID", value: (prefill as any).findingId ?? "" },
      { label: "Audit ID", value: (prefill as any).auditId ?? "" },
      { label: "Audit type", value: (prefill as any).auditType ?? "" },
      { label: "Audit date", value: (prefill as any).auditDate ? formatDateTime((prefill as any).auditDate) : "" },
      { label: "Auditor", value: (prefill as any).auditor ? `${(prefill as any).auditor.name} · ${(prefill as any).auditor.organization}` : "" },
      { label: "Auditee dept", value: (prefill as any).auditee?.department ?? "" },
      { label: "Category", value: (prefill as any).findingCategory ?? "" },
      { label: "Regulation", value: (prefill as any).regulationReference?.join(", ") ?? "" },
      { label: "Finding description", value: (prefill as any).findingDescription ?? "", span: true },
    ];
  } else {
    rows = [
      { label: "Complaint ID", value: (prefill as any).complaintId ?? "" },
      { label: "Reported", value: prefill.reportedAt ? formatDateTime(prefill.reportedAt) : "" },
      { label: "Customer", value: (prefill as any).customer ? `${(prefill as any).customer.name} · ${(prefill as any).customer.type}` : "" },
      { label: "Product", value: (prefill as any).product?.name ?? "" },
      { label: "Lot number", value: (prefill as any).product?.lotNumber ?? "" },
      { label: "Complaint type", value: (prefill as any).complaintType ?? "" },
      { label: "Description", value: (prefill as any).description ?? "", span: true },
    ];
  }

  return (
    <Card>
      <CardLabel>Source data</CardLabel>
      <InfoGrid rows={rows} />
    </Card>
  );
}

function DispositionCard({ capa }: { capa: CAPACase }) {
  const personas = usePersonaStore((s) => s.personas);
  if (!capa.disposisi) return null;
  const { disposisi } = capa;
  const reviewer = personas.find((p) => p.id === disposisi.reviewerPersonaId);
  const assignee = personas.find((p) => p.id === disposisi.assignedTo);

  return (
    <Card>
      <CardLabel>QA Disposition</CardLabel>
      <InfoGrid
        rows={[
          { label: "Reviewed by", value: reviewer?.displayName ?? disposisi.reviewerPersonaId },
          { label: "Assigned to", value: assignee?.displayName ?? disposisi.assignedTo },
          { label: "Severity confirmed", value: disposisi.severity },
          { label: "Dispositioned on", value: formatDateTime(disposisi.dispositionAt) },
        ]}
      />
      <div
        style={{
          marginTop: "14px",
          padding: "12px 14px",
          background: "var(--bg-3)",
          borderRadius: "var(--r-sm)",
          fontSize: "13px",
          color: "var(--fg-2)",
          lineHeight: 1.65,
        }}
      >
        {disposisi.rationale}
      </div>
    </Card>
  );
}

function NovaSummaryCard({ capa }: { capa: CAPACase }) {
  const rootCause =
    capa.rca.confirmedRootCauses[0] ?? "Root cause confirmation is still in progress.";

  return (
    <Card bg="var(--bg-3)" accentLeft="var(--accent)">
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <Sparkles
          size={14}
          strokeWidth={1.75}
          style={{ color: "var(--accent)", flexShrink: 0 }}
        />
        <CardLabel>Nova Summary</CardLabel>
      </div>
      <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.65, margin: "0 0 12px" }}>
        {capa.impact.rationale}
      </p>
      {capa.rca.confirmedRootCauses.length > 0 && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--bg-4)",
            borderRadius: "var(--r-sm)",
            fontSize: "12px",
            color: "var(--fg-3)",
          }}
        >
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--fg-4)" }}>
            Confirmed root cause
          </span>
          <p style={{ margin: "4px 0 0", color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.6 }}>
            {rootCause}
          </p>
        </div>
      )}
    </Card>
  );
}

function RightColumn({ capa }: { capa: CAPACase }) {
  const source = getSourceSystem(capa.preFill);
  const severityColors: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "var(--danger-soft)", color: "var(--danger)" },
    Major: { bg: "var(--danger-soft)", color: "var(--danger)" },
    Minor: { bg: "var(--warning-soft)", color: "var(--warning)" },
  };
  const sev = severityColors[capa.impact.severity] ?? { bg: "var(--bg-3)", color: "var(--fg-2)" };

  const statusColors: Record<string, { bg: string; color: string }> = {
    investigation: { bg: "var(--accent-soft)", color: "var(--accent)" },
    approval: { bg: "var(--warning-soft)", color: "var(--warning)" },
    closed: { bg: "var(--success-soft, rgba(63,185,132,0.14))", color: "var(--success)" },
    draft: { bg: "var(--bg-4)", color: "var(--fg-3)" },
    disposisi: { bg: "var(--bg-4)", color: "var(--fg-2)" },
  };
  const st = statusColors[capa.status] ?? { bg: "var(--bg-3)", color: "var(--fg-2)" };
  const statusLabel: Record<string, string> = {
    investigation: "In progress",
    approval: "Pending approval",
    closed: "Closed",
    draft: "Draft",
    disposisi: "QA disposition",
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Breadcrumb */}
      <p
        style={{
          ...mono,
          fontSize: "12px",
          color: "var(--fg-3)",
          margin: 0,
        }}
      >
        <Link to="/capa" style={{ color: "var(--fg-4)", textDecoration: "none" }}>
          All CAPAs
        </Link>
        {" / "}
        <span style={{ color: "var(--fg-2)" }}>{capa.id}</span>
      </p>

      {/* Badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
        <Pill>{source}</Pill>
        <Pill>{formatCAPAType(capa.type)}</Pill>
        <Pill bg={sev.bg} color={sev.color}>
          {capa.impact.severity}
        </Pill>
        <Pill bg={st.bg} color={st.color}>
          {statusLabel[capa.status] ?? capa.status}
        </Pill>
      </div>

      {/* Title */}
      <div>
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.018em",
            color: "var(--fg-1)",
            margin: "0 0 6px",
          }}
        >
          {capa.id}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            color: "var(--fg-2)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {capa.title}
        </p>
      </div>

      {/* Source data */}
      <SourceDataCard prefill={capa.preFill} />

      {/* QA Disposition */}
      {capa.disposisi && <DispositionCard capa={capa} />}

      {/* Nova Summary */}
      <NovaSummaryCard capa={capa} />

      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "32px" }}>
        <Link
          to={`/capa/${capa.id}/8d/${capa.currentStep}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--grad-brand)",
            color: "var(--on-accent)",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: "var(--r-sm)",
            textDecoration: "none",
          }}
        >
          {getCtaLabel(capa.currentStep)}
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PAGE ROOT
   ════════════════════════════════════════════════════════════════════ */

export function CapaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rawCapa = useCapaStore((s) => s.capas.find((c) => c.id === id));
  const allCAs = useCapaStore((s) => s.correctiveActions);
  const allPAs = useCapaStore((s) => s.preventiveActions);

  const capa = useMemo(() => {
    if (!rawCapa) return undefined;
    return {
      ...rawCapa,
      correctiveActions: allCAs.filter((a) => a.capaId === rawCapa.id),
      preventiveActions: allPAs.filter((a) => a.capaId === rawCapa.id),
    };
  }, [rawCapa, allCAs, allPAs]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* ── Top action bar ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() =>
            toast.info("Export PDF", { description: "PDF export is mocked in this demo." })
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            borderRadius: "var(--r-sm)",
            background: "transparent",
            border: "1px solid var(--line-2)",
            color: "var(--fg-2)",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "background 180ms, color 180ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
          }}
        >
          <Download size={14} strokeWidth={1.75} />
          Export PDF
        </button>
        <button
          onClick={() => navigate(`/audit-trail`)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            borderRadius: "var(--r-sm)",
            background: "transparent",
            border: "1px solid var(--line-2)",
            color: "var(--fg-2)",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "background 180ms, color 180ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
          }}
        >
          <ScrollText size={14} strokeWidth={1.75} />
          Audit trail
        </button>
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
        <LeftColumn capa={capa} />
        <RightColumn capa={capa} />
      </div>
    </div>
  );
}
