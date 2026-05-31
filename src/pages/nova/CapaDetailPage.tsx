import { useMemo, useState } from "react";
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
import { EightDEmbedProvider } from "@/components/layout/EightDShell";
import { D1ProblemPage } from "@/pages/nova/eight-d/D1ProblemPage";
import { D2ContainmentPage } from "@/pages/nova/eight-d/D2ContainmentPage";
import { D3RCAPage } from "@/pages/nova/eight-d/D3RCAPage";
import { D4CorrectiveActionPage } from "@/pages/nova/eight-d/D4CorrectiveActionPage";
import { D5PreventiveActionPage } from "@/pages/nova/eight-d/D5PreventiveActionPage";
import { D6VerificationPage } from "@/pages/nova/eight-d/D6VerificationPage";
import { D7SignOffPage } from "@/pages/nova/eight-d/D7SignOffPage";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore, usePersonaStore, useUIStore } from "@/store";
import type { CAPACase, EightDStep, PreFillContext } from "@/types";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";
import { getScoreLiftTips } from "@/utils/scoring";

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

const EMBEDDED_STEP_COMPONENTS: Record<EightDStep, React.ComponentType> = {
  problem: D1ProblemPage,
  containment: D2ContainmentPage,
  rca: D3RCAPage,
  ca: D4CorrectiveActionPage,
  pa: D5PreventiveActionPage,
  verification: D6VerificationPage,
  signoff: D7SignOffPage,
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
        letterSpacing: "0.18em",
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
  isSelected,
  onSelect,
}: {
  step: EightDStep;
  state: "done" | "active" | "locked";
  isSelected: boolean;
  onSelect: () => void;
}) {
  const visualState = isSelected ? "active" : state;
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
  }[visualState];

  const content = (
    <div
      style={{
        ...styles[visualState],
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "var(--r-sm)",
        fontSize: "12px",
        fontFamily: "var(--font-sans)",
        transition: "background 180ms",
        textDecoration: "none",
        color: styles[visualState].color,
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
    <button
      type="button"
      onClick={onSelect}
      style={{
        all: "unset",
        display: "block",
        width: "100%",
        cursor: "pointer",
      }}
    >
      {content}
    </button>
  );
}

function LeftColumn({
  capa,
  selectedStep,
  onSelectStep,
  onOverview,
}: {
  capa: CAPACase;
  selectedStep: EightDStep | null;
  onSelectStep: (step: EightDStep) => void;
  onOverview: () => void;
}) {
  const personas = usePersonaStore((s) => s.personas);
  const pic = personas.find((p) => p.id === capa.disposisi?.assignedTo);
  const scoreTips = getScoreLiftTips(capa.score);
  const scoreRows = [
    { label: "Problem", value: capa.score.problemSpecificity },
    { label: "RCA", value: capa.score.rootCauseDepth },
    { label: "Actions", value: capa.score.effectiveness },
    { label: "Containment", value: capa.score.containment },
  ];
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
      {/* Overview shortcut */}
      <button
        type="button"
        onClick={onOverview}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "7px 10px",
          borderRadius: "var(--r-sm)",
          border: selectedStep === null ? "1px solid var(--accent-line)" : "1px solid var(--line-2)",
          background: selectedStep === null ? "var(--accent-soft)" : "var(--bg-2)",
          color: selectedStep === null ? "var(--accent)" : "var(--fg-2)",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
        }}
      >
        Overview
      </button>

      {/* 8D Progress */}
      <div>
        <EyebrowLeft>8D Progress</EyebrowLeft>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {eightDSteps.map((step) => (
            <StepItem
              key={step}
              step={step}
              state={getStepState(step, capa.currentStep, capa.status)}
              isSelected={selectedStep === step}
              onSelect={() => onSelectStep(step)}
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
                  letterSpacing: "0.18em",
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
        <div
          id="score"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-md)",
            padding: "14px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "44px",
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
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: capa.score.isAuditReady ? "var(--success)" : "var(--warning)",
                background: capa.score.isAuditReady ? "var(--success-soft)" : "var(--warning-soft)",
                borderRadius: "var(--r-full)",
                padding: "2px 7px",
                whiteSpace: "nowrap",
              }}
            >
              {capa.score.isAuditReady ? "Audit ready" : "Needs lift"}
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--fg-3)",
              margin: "6px 0 12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Total / 100
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {scoreRows.map((row) => {
              const pct = (row.value / 25) * 100;
              const color =
                row.value >= 20
                  ? "var(--success)"
                  : row.value >= 15
                    ? "var(--warning)"
                    : "var(--danger)";
              return (
                <div key={row.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--fg-2)", fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
                      {row.value}/25
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--bg-4)",
                      borderRadius: "var(--r-full)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: "var(--r-full)",
                        transition: "width var(--dur-tab) var(--ease-out)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {scoreTips.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--line-1)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "var(--fg-3)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Lift tips
              </p>
              {scoreTips.map((tip) => (
                <div
                  key={`${tip.field}-${tip.subScore}`}
                  style={{
                    background: "var(--bg-3)",
                    border: "1px solid var(--line-1)",
                    borderRadius: "var(--r-sm)",
                    padding: "8px 9px",
                  }}
                >
                  <p style={{ margin: "0 0 3px", color: "var(--fg-2)", fontSize: "11px", fontWeight: 600 }}>
                    {tip.field} +{tip.scoreGain}
                  </p>
                  <p style={{ margin: 0, color: "var(--fg-3)", fontSize: "11px", lineHeight: 1.5 }}>
                    {tip.suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
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
                letterSpacing: "0.18em",
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
        letterSpacing: "0.18em",
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
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>
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

function statusTone(status: string): { bg: string; color: string } {
  if (["completed", "verified", "approved"].includes(status)) {
    return { bg: "var(--success-soft)", color: "var(--success)" };
  }
  if (["overdue", "rejected"].includes(status)) {
    return { bg: "var(--danger-soft)", color: "var(--danger)" };
  }
  if (["in_progress", "pending"].includes(status)) {
    return { bg: "var(--warning-soft)", color: "var(--warning)" };
  }
  return { bg: "var(--bg-4)", color: "var(--fg-3)" };
}

function EmptyStepState({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-3)",
        border: "1px solid var(--line-1)",
        borderRadius: "var(--r-md)",
        padding: "16px",
        color: "var(--fg-3)",
        fontSize: "13px",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function StepDetailView({
  capa,
  step,
  onBackToOverview,
}: {
  capa: CAPACase;
  step: EightDStep;
  onBackToOverview: () => void;
}) {
  const stepState = getStepState(step, capa.currentStep, capa.status);
  const containmentAnswer = capa.gateAnswers.find((answer) => answer.questionId === "containment");
  const problemAnswer = capa.gateAnswers.find((answer) => answer.questionId === "observation");
  const stepTone = stepState === "done"
    ? { bg: "var(--success-soft)", color: "var(--success)" }
    : stepState === "active"
      ? { bg: "var(--accent-soft)", color: "var(--accent)" }
      : { bg: "var(--bg-4)", color: "var(--fg-3)" };

  const renderStepBody = () => {
    switch (step) {
      case "problem":
        return (
          <Card>
            <CardLabel>Problem statement</CardLabel>
            <p style={{ margin: 0, color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.7 }}>
              {problemAnswer?.answer || "Problem statement has not been saved yet."}
            </p>
          </Card>
        );
      case "containment":
        return (
          <Card>
            <CardLabel>Immediate containment</CardLabel>
            {containmentAnswer ? (
              <p style={{ margin: 0, whiteSpace: "pre-line", color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.7 }}>
                {containmentAnswer.answer}
              </p>
            ) : (
              <EmptyStepState>No containment action has been saved yet.</EmptyStepState>
            )}
          </Card>
        );
      case "rca":
        return (
          <Card>
            <CardLabel>Root cause analysis</CardLabel>
            <InfoGrid rows={[{ label: "Method", value: capa.rca.method }]} />
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {capa.rca.confirmedRootCauses.length > 0 ? (
                capa.rca.confirmedRootCauses.map((cause, index) => (
                  <div
                    key={`${cause}-${index}`}
                    style={{
                      background: "var(--bg-3)",
                      border: "1px solid var(--line-1)",
                      borderRadius: "var(--r-sm)",
                      padding: "10px 12px",
                      color: "var(--fg-2)",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {cause}
                  </div>
                ))
              ) : (
                <EmptyStepState>No confirmed root cause yet.</EmptyStepState>
              )}
            </div>
          </Card>
        );
      case "ca":
        return (
          <Card>
            <CardLabel>Corrective actions</CardLabel>
            {capa.correctiveActions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {capa.correctiveActions.map((action) => {
                  const tone = statusTone(action.status);
                  return (
                    <div
                      key={action.id}
                      style={{
                        background: "var(--bg-3)",
                        border: "1px solid var(--line-1)",
                        borderRadius: "var(--r-md)",
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                        <p style={{ margin: 0, color: "var(--fg-1)", fontSize: "13px", fontWeight: 600 }}>
                          {action.id}
                        </p>
                        <Pill bg={tone.bg} color={tone.color}>{action.status.replace("_", " ")}</Pill>
                      </div>
                      <p style={{ margin: "0 0 10px", color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.6 }}>
                        {action.description}
                      </p>
                      <InfoGrid
                        rows={[
                          { label: "PIC", value: action.pic },
                          { label: "Due date", value: formatDate(action.dueDate) },
                          { label: "Linked root cause", value: action.linkedRootCause, span: true },
                          { label: "Verification", value: action.verificationMethod, span: true },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStepState>No corrective actions have been added yet.</EmptyStepState>
            )}
          </Card>
        );
      case "pa":
        return (
          <Card>
            <CardLabel>Preventive actions</CardLabel>
            {capa.preventiveActions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {capa.preventiveActions.map((action) => {
                  const tone = statusTone(action.status);
                  return (
                    <div
                      key={action.id}
                      style={{
                        background: "var(--bg-3)",
                        border: "1px solid var(--line-1)",
                        borderRadius: "var(--r-md)",
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                        <p style={{ margin: 0, color: "var(--fg-1)", fontSize: "13px", fontWeight: 600 }}>
                          {action.id}
                        </p>
                        <Pill bg={tone.bg} color={tone.color}>{action.status.replace("_", " ")}</Pill>
                      </div>
                      <p style={{ margin: "0 0 10px", color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.6 }}>
                        {action.description}
                      </p>
                      <InfoGrid
                        rows={[
                          { label: "PIC", value: action.pic },
                          { label: "Target date", value: formatDate(action.targetDate) },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStepState>No preventive actions have been added yet.</EmptyStepState>
            )}
          </Card>
        );
      case "verification":
        return (
          <Card>
            <CardLabel>Verification evidence</CardLabel>
            {capa.verification.result || capa.verification.evidenceFileNames.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <InfoGrid
                  rows={[
                    { label: "Method", value: capa.verification.method ?? "" },
                    { label: "Verified at", value: capa.verification.verifiedAt ? formatDateTime(capa.verification.verifiedAt) : "" },
                    { label: "Verified by", value: capa.verification.verifiedBy ?? "" },
                    { label: "Evidence files", value: capa.verification.evidenceFileNames.join(", ") },
                  ]}
                />
                {capa.verification.result && (
                  <p style={{ margin: 0, color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.7 }}>
                    {capa.verification.result}
                  </p>
                )}
              </div>
            ) : (
              <EmptyStepState>No verification result has been recorded yet.</EmptyStepState>
            )}
          </Card>
        );
      case "signoff":
        return (
          <Card>
            <CardLabel>Sign-off chain</CardLabel>
            {capa.approvals.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {capa.approvals.map((approval) => {
                  const tone = statusTone(approval.decision);
                  return (
                    <div
                      key={`${approval.approverPersonaId}-${approval.role}`}
                      style={{
                        background: "var(--bg-3)",
                        border: "1px solid var(--line-1)",
                        borderRadius: "var(--r-md)",
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                        <div>
                          <p style={{ margin: 0, color: "var(--fg-1)", fontSize: "13px", fontWeight: 600 }}>
                            {approval.approverName}
                          </p>
                          <p style={{ margin: "3px 0 0", color: "var(--fg-3)", fontSize: "12px" }}>
                            {approval.role}
                          </p>
                        </div>
                        <Pill bg={tone.bg} color={tone.color}>{approval.decision}</Pill>
                      </div>
                      {approval.notes && (
                        <p style={{ margin: "0 0 8px", color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.6 }}>
                          {approval.notes}
                        </p>
                      )}
                      {approval.signedAt && (
                        <p style={{ margin: 0, color: "var(--fg-3)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                          {formatDateTime(approval.signedAt)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStepState>No sign-off activity has been recorded yet.</EmptyStepState>
            )}
          </Card>
        );
    }
  };

  return (
    <div key={step} className="motion-tab-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ ...mono, fontSize: "12px", color: "var(--fg-3)", margin: 0 }}>
        <button
          type="button"
          onClick={onBackToOverview}
          style={{
            all: "unset",
            color: "var(--fg-4)",
            cursor: "pointer",
          }}
        >
          CAPA Overview
        </button>
        {" / "}
        <span style={{ color: "var(--fg-2)" }}>{STEP_LABELS[step]}</span>
      </p>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--fg-1)",
              margin: "0 0 6px",
            }}
          >
            {STEP_LABELS[step]}
          </h1>
          <p style={{ margin: 0, color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.6 }}>
            Inline 8D workspace for {capa.id}. The URL stays on the CAPA hub while this panel changes context.
          </p>
        </div>
        <Pill bg={stepTone.bg} color={stepTone.color}>
          {stepState}
        </Pill>
      </div>

      {renderStepBody()}

      <Card bg="var(--bg-3)" accentLeft="var(--accent)">
        <CardLabel>Nova context</CardLabel>
        <p style={{ margin: 0, color: "var(--fg-2)", fontSize: "13px", lineHeight: 1.7 }}>
          {capa.impact.rationale}
        </p>
      </Card>
    </div>
  );
}

function EditableStepWorkspace({
  step,
  onStepChange,
  onBackToOverview,
}: {
  step: EightDStep;
  onStepChange: (step: EightDStep) => void;
  onBackToOverview: () => void;
}) {
  const StepComponent = EMBEDDED_STEP_COMPONENTS[step];

  return (
    <div key={step} className="motion-tab-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ ...mono, fontSize: "12px", color: "var(--fg-3)", margin: 0 }}>
        <button
          type="button"
          onClick={onBackToOverview}
          style={{
            all: "unset",
            color: "var(--fg-4)",
            cursor: "pointer",
          }}
        >
          CAPA Overview
        </button>
        {" / "}
        <span style={{ color: "var(--fg-2)" }}>{STEP_LABELS[step]}</span>
      </p>

      <EightDEmbedProvider onStepChange={onStepChange}>
        <StepComponent />
      </EightDEmbedProvider>
    </div>
  );
}

function RightColumn({
  capa,
  selectedStep,
  onSelectStep,
  onBackToOverview,
}: {
  capa: CAPACase;
  selectedStep: EightDStep | null;
  onSelectStep: (step: EightDStep) => void;
  onBackToOverview: () => void;
}) {
  if (selectedStep) {
    if (capa.status === "closed") {
      return <StepDetailView capa={capa} step={selectedStep} onBackToOverview={onBackToOverview} />;
    }

    return (
      <EditableStepWorkspace
        step={selectedStep}
        onStepChange={onSelectStep}
        onBackToOverview={onBackToOverview}
      />
    );
  }

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
    closed: { bg: "var(--success-soft)", color: "var(--success)" },
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
        <button
          type="button"
          onClick={() => onSelectStep(capa.currentStep)}
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
            border: "none",
            cursor: "pointer",
          }}
        >
          {getCtaLabel(capa.currentStep)}
          <ArrowRight size={16} strokeWidth={2} />
        </button>
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
  const [selectedStep, setSelectedStep] = useState<EightDStep | null>(null);
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
        <LeftColumn
          capa={capa}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
          onOverview={() => setSelectedStep(null)}
        />
        <RightColumn
          capa={capa}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
          onBackToOverview={() => setSelectedStep(null)}
        />
      </div>
    </div>
  );
}
