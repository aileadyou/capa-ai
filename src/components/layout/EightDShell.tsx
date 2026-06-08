import { createContext, ReactNode, useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Check, CircleDot, Lock, Users } from "lucide-react";
import { eightDSteps } from "@/routes";
import { useCapa } from "@/hooks/api";
import type { CAPACase, EightDStep } from "@/types";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

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
      <Check size={13} className="shrink-0 text-foreground-tertiary" />
    ) : state === "active" ? (
      <CircleDot size={13} className="shrink-0 text-primary" />
    ) : (
      <Lock size={12} className="shrink-0 text-foreground-faint" />
    );

  const inner = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--r-sm)] border-l-2 px-2.5 py-[7px] font-sans text-xs leading-[1.3] transition-[background,color,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
        state === "active" && "border-l-primary bg-[var(--accent-soft)] font-semibold text-primary",
        state === "done" && "border-l-transparent font-normal text-foreground-tertiary",
        state === "locked" && "cursor-not-allowed border-l-transparent font-normal text-foreground-faint",
        state !== "locked" && "cursor-pointer",
      )}
    >
      {icon}
      <span className="leading-[1.3]">{label}</span>
    </div>
  );

  if (!href || state === "locked") {
    return <div>{inner}</div>;
  }

  return (
    <Link to={href} className="block no-underline">
      {inner}
    </Link>
  );
}

// ── Audit context header ──────────────────────────────────────────────────────
// Audit CAPAs run a two-phase CAPA Plan → CAPA Actual lifecycle. The phase badge
// shows on every 8D step; the read-only schedule card surfaces on D1.

function AuditContextHeader({
  capa,
  activeStep,
}: {
  capa: CAPACase;
  activeStep: EightDStep;
}) {
  if (capa.type !== "audit" || !capa.auditContext) return null;
  const { variant, schedule } = capa.auditContext;
  const phase = capa.auditPhase ?? "plan";
  const showSchedule = activeStep === "problem";

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[var(--r-full)] border border-primary/30 bg-[var(--accent-soft)] px-2.5 py-[3px] font-sans text-[11px] font-semibold text-primary">
          Phase: {phase === "plan" ? "CAPA Plan" : "CAPA Actual"}
        </span>
        <span className="rounded-[var(--r-full)] border border-border-subtle bg-elevated px-2.5 py-[3px] font-sans text-[11px] font-medium capitalize text-foreground-secondary">
          {variant} audit
        </span>
      </div>

      {showSchedule && (
        <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-4 py-3.5 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <CalendarDays size={13} className="shrink-0 text-primary" />
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Audit Schedule
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <ScheduleField label="Date range">
              {formatDate(schedule.dateRange.start)} – {formatDate(schedule.dateRange.end)}
            </ScheduleField>
            <ScheduleField label="Auditee">{schedule.auditee || "—"}</ScheduleField>
            <ScheduleField label="Scope" full>
              {schedule.scope || "—"}
            </ScheduleField>
            {schedule.auditTeam.length > 0 && (
              <ScheduleField label="Audit team" full>
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Users size={11} className="shrink-0 text-foreground-faint" />
                  {schedule.auditTeam.map((m) => `${m.name} (${m.role})`).join(", ")}
                </span>
              </ScheduleField>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleField({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(full && "col-span-2")}>
      <p className="mb-0.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-faint">
        {label}
      </p>
      <p className="m-0 font-sans text-[12px] leading-[1.5] text-foreground-secondary">{children}</p>
    </div>
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

interface EightDEmbedContextValue {
  embedded: boolean;
  onStepChange?: (step: EightDStep) => void;
  /** When true the user is a non-owner observer: forms are read-only and
   *  "Use suggestion" buttons are hidden; "Discuss with Nova" stays active. */
  readOnly: boolean;
}

const EightDEmbedContext = createContext<EightDEmbedContextValue>({
  embedded: false,
  readOnly: false,
});

export function EightDEmbedProvider({
  children,
  onStepChange,
  readOnly = false,
}: {
  children: ReactNode;
  onStepChange: (step: EightDStep) => void;
  readOnly?: boolean;
}) {
  return (
    <EightDEmbedContext.Provider value={{ embedded: true, onStepChange, readOnly }}>
      {children}
    </EightDEmbedContext.Provider>
  );
}

export function useEightDEmbed() {
  return useContext(EightDEmbedContext);
}

export function EightDShell({ capaId, activeStep, children, sidebar }: EightDShellProps) {
  const { embedded } = useEightDEmbed();
  const { data: capa } = useCapa(capaId);
  const capaCurrentIndex = eightDSteps.indexOf(capa?.currentStep ?? "problem");

  function getStepState(step: EightDStep): "done" | "active" | "locked" {
    if (step === activeStep) return "active";
    const idx = eightDSteps.indexOf(step);
    if (idx <= capaCurrentIndex) return "done";
    return "locked";
  }

  if (embedded) {
    return (
      <div key={activeStep} className="motion-tab-content min-w-0 flex-1">
        {capa && <AuditContextHeader capa={capa} activeStep={activeStep} />}
        {children}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-5">
      {/* ── Left: step progress panel ──────────────────────────────────── */}
      <div
        className="sticky top-20 max-h-[calc(100vh-100px)] w-44 shrink-0 overflow-y-auto"
      >
        {/* Back to CAPA Hub */}
        <Link
          to={`/capa/${capaId}`}
          className="mb-5 flex items-center gap-1.5 py-0.5 font-sans text-xs text-foreground-tertiary no-underline"
        >
          <ArrowLeft size={13} className="shrink-0" />
          Back to CAPA Hub
        </Link>

        {/* Eyebrow label */}
        <p
          className="mb-2 ml-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-primary"
        >
          8D Workflow
        </p>

        {/* Step list */}
        <div className="flex flex-col gap-0.5">
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
      <div className="flex min-w-0 flex-1 items-start gap-5">
        <div key={activeStep} className="motion-tab-content min-w-0 flex-1">
          {capa && <AuditContextHeader capa={capa} activeStep={activeStep} />}
          {children}
        </div>

        {sidebar && (
          <div
            className="motion-reveal sticky top-20 max-h-[calc(100vh-100px)] w-[280px] shrink-0 overflow-y-auto"
          >
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}
