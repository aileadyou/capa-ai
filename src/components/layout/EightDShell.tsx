import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, CircleDot, Lock } from "lucide-react";
import { eightDSteps } from "@/routes";
import { useCapaStore } from "@/store";
import type { EightDStep } from "@/types";

// ── Step metadata ────────────────────────────────────────────────────────────

const STEP_LABELS: Record<EightDStep, string> = {
  problem: "D1 Problem",
  containment: "D2 Containment",
  rca: "D3 Root Cause",
  ca: "D4 Corrective Action",
  pa: "D5 Preventive Action",
  verification: "D6 Verification",
  signoff: "D7 Sign-Off",
};

const STEP_PATHS: Record<EightDStep, string> = {
  problem: "problem",
  containment: "containment",
  rca: "rca",
  ca: "ca",
  pa: "pa",
  verification: "verification",
  signoff: "signoff",
};

// ── StepItem ─────────────────────────────────────────────────────────────────

function StepItem({
  label,
  state,
  href,
}: {
  label: string;
  state: "done" | "active" | "locked";
  href?: string;
}) {
  const icon =
    state === "done" ? (
      <Check size={13} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
    ) : state === "active" ? (
      <CircleDot size={13} style={{ flexShrink: 0, color: "var(--accent)" }} />
    ) : (
      <Lock size={12} style={{ flexShrink: 0, color: "var(--fg-4)" }} />
    );

  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 10px",
        borderRadius: "var(--r-sm)",
        fontSize: "12px",
        lineHeight: "1.3",
        fontWeight: state === "active" ? 600 : 400,
        color:
          state === "active"
            ? "var(--accent)"
            : state === "done"
              ? "var(--fg-3)"
              : "var(--fg-4)",
        background: state === "active" ? "var(--accent-soft)" : "transparent",
        borderLeft: state === "active" ? "2px solid var(--accent)" : "2px solid transparent",
        cursor: state === "locked" ? "not-allowed" : "pointer",
        transition: "background 0.15s, color 0.15s",
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
      }}
    >
      {icon}
      <span style={{ lineHeight: "1.3" }}>{label}</span>
    </div>
  );

  if (!href || state === "locked") {
    return <div>{inner}</div>;
  }

  return (
    <Link to={href} style={{ textDecoration: "none", display: "block" }}>
      {inner}
    </Link>
  );
}

// ── EightDShell ───────────────────────────────────────────────────────────────

interface EightDShellProps {
  capaId: string;
  /** The step displayed in the current URL/page */
  activeStep: EightDStep;
  /** Main form content */
  children: ReactNode;
  /** Optional right sidebar (e.g. score panel) */
  sidebar?: ReactNode;
}

export function EightDShell({ capaId, activeStep, children, sidebar }: EightDShellProps) {
  const capa = useCapaStore((state) => state.capas.find((c) => c.id === capaId));
  const capaCurrentIndex = eightDSteps.indexOf(capa?.currentStep ?? "problem");

  function getStepState(step: EightDStep): "done" | "active" | "locked" {
    if (step === activeStep) return "active";
    const idx = eightDSteps.indexOf(step);
    if (idx <= capaCurrentIndex) return "done";
    return "locked";
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
      {/* ── Left: step progress panel ──────────────────────────────────── */}
      <div
        style={{
          width: "176px",
          flexShrink: 0,
          position: "sticky",
          top: "80px",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        {/* Back to CAPA Hub */}
        <Link
          to={`/capa/${capaId}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "var(--fg-3)",
            textDecoration: "none",
            marginBottom: "20px",
            padding: "2px 0",
            fontFamily: "var(--font-sans)",
          }}
        >
          <ArrowLeft size={13} style={{ flexShrink: 0 }} />
          Back to CAPA Hub
        </Link>

        {/* Eyebrow label */}
        <p
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            margin: "0 0 8px 10px",
          }}
        >
          8D Workflow
        </p>

        {/* Step list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {eightDSteps.map((step) => {
            const state = getStepState(step);
            return (
              <StepItem
                key={step}
                label={STEP_LABELS[step]}
                state={state}
                href={state !== "locked" ? `/capa/${capaId}/8d/${STEP_PATHS[step]}` : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* ── Center + optional right sidebar ───────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-start", gap: "20px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>

        {sidebar && (
          <div
            style={{
              width: "280px",
              flexShrink: 0,
              position: "sticky",
              top: "80px",
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
            }}
          >
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}
