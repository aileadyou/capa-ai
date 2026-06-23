import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePersonaStore } from "@/store";
import { useCapas, useFindings, useNotifications } from "@/hooks/api";
import type { CAPACase, Finding, Notification, PersonaID } from "@/types";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════
   LIFECYCLE MODEL
   The 4-stage concept the user sees on every card:

   1 · Finding open      finding exists, no CAPA started
   2 · In progress       draft / disposisi / investigation
   3 · Pending approval  approval status
   4 · Closed            closed

   This is separate from the internal CAPAStatus enum.
   ════════════════════════════════════════════════════════════ */

type LifecycleStage = 1 | 2 | 3 | 4;

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  1: "Finding open",
  2: "In progress",
  3: "Pending approval",
  4: "Closed",
};

function getLifecycleStage(status: string): LifecycleStage {
  if (status === "closed") return 4;
  if (status === "approval") return 3;
  return 2; // draft | pending_review | revision_requested | investigation
}

/* ════════════════════════════════════════════════════════════
   MOCK DUE DATES  (no dueDate field in mock data)
   ════════════════════════════════════════════════════════════ */

const MOCK_DUE: Record<string, string> = {
  "CAPA-2026-0341": "2026-06-06", // D2 containment in progress
  "CAPA-2026-0089": "2026-06-03", // D7 sign-off pending
  "CAPA-2026-0112": "2026-06-12", // D7 sign-off pending
};

const TODAY = new Date("2026-05-31");

function dueDays(id: string): { label: string; overdue: boolean; soon: boolean } | null {
  const raw = MOCK_DUE[id];
  if (!raw) return null;
  const diff = Math.round((new Date(raw).getTime() - TODAY.getTime()) / 86_400_000);
  if (diff < 0) return { label: `Overdue ${Math.abs(diff)}d`, overdue: true, soon: false };
  if (diff === 0) return { label: "Due today", overdue: false, soon: true };
  if (diff <= 7) return { label: `Due in ${diff}d`, overdue: false, soon: true };
  return {
    label: `Due ${new Date(raw).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    overdue: false,
    soon: false,
  };
}

function isOverdue(id: string) {
  return dueDays(id)?.overdue ?? false;
}

/* ════════════════════════════════════════════════════════════
   STEP LABELS
   ════════════════════════════════════════════════════════════ */

const STEP_LABEL: Record<string, string> = {
  problem: "D1 Problem",
  containment: "D2 Containment",
  rca: "D3 Root cause",
  ca: "D4 Corrective action",
  pa: "D5 Preventive action",
  verification: "D6 Verification",
  signoff: "D7 Sign-off",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ════════════════════════════════════════════════════════════
   SHARED DESIGN TOKENS / PRIMITIVES
   ════════════════════════════════════════════════════════════ */

const CARD_CLASS = "flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--line-2)] bg-card px-4 py-3.5 shadow-sm";
const MONO_ID_CLASS = "font-sans text-xs font-semibold text-foreground";
const TITLE_CLASS = "mb-2.5 mt-[3px] truncate text-sm text-foreground-secondary";
const BADGE_ROW_CLASS = "flex flex-wrap items-center gap-1.5";

/* ── Primitives ─────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="m-0 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-primary"
    >
      {children}
    </p>
  );
}

function StepBadge({ step }: { step: string }) {
  return (
    <span
      className="rounded-[var(--r-full)] bg-[var(--accent-soft)] px-2 py-0.5 font-sans text-[11px] font-medium text-primary"
    >
      {STEP_LABEL[step] ?? step}
    </span>
  );
}

function DueBadge({ id }: { id: string }) {
  const d = dueDays(id);
  if (!d) return null;
  return (
    <span
      className={cn(
        "rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[11px]",
        d.overdue && "bg-[var(--danger-soft)] font-semibold text-destructive",
        d.soon && "bg-[var(--warning-soft)] font-semibold text-warning",
        !d.overdue && !d.soon && "bg-transparent font-normal text-foreground-tertiary",
      )}
    >
      {d.label}
    </span>
  );
}

/** Mini 4-stage lifecycle pill bar */
function LifecyclePill({ stage }: { stage: LifecycleStage }) {
  return (
    <div className="flex items-center gap-[3px]">
      {([1, 2, 3, 4] as LifecycleStage[]).map((s) => {
        const active = s === stage;
        const done = s < stage;
        return (
          <div key={s} className="flex items-center gap-[3px]">
            <div
              title={LIFECYCLE_LABELS[s]}
              className={cn(
                "h-1 w-5 rounded-sm transition-[background] duration-200",
                done && "bg-success",
                active && s === 3 && "bg-warning",
                active && s !== 3 && "bg-primary",
                !done && !active && "bg-field",
              )}
            />
          </div>
        );
      })}
      <span
        className={cn(
          "ml-1 font-sans text-[10px]",
          stage === 3 && "text-warning",
          stage === 4 && "text-success",
          stage !== 3 && stage !== 4 && "text-foreground-tertiary",
        )}
      >
        {LIFECYCLE_LABELS[stage]}
      </span>
    </div>
  );
}

function OpenLink({ to, label = "Open", tone = "primary" }: { to: string; label?: string; tone?: "primary" | "warning" }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-sans text-sm font-semibold no-underline",
        tone === "warning" ? "text-warning" : "text-primary",
      )}
    >
      {label}
      <ArrowRight size={13} strokeWidth={2} />
    </Link>
  );
}

function Section({
  label,
  count,
  children,
  mt = 32,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
  mt?: number;
}) {
  return (
    <section className={mt === 0 ? undefined : "mt-8"}>
      <div className="mb-3 flex items-baseline gap-2">
        <Eyebrow>{label}</Eyebrow>
        {count !== undefined && (
          <span
            className="font-sans text-[10px] text-foreground-faint"
          >
            {count}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] p-4 text-center text-sm text-foreground-faint"
    >
      {text}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD VARIANTS
   ════════════════════════════════════════════════════════════ */

function ActiveCard({ capa, accentTone }: { capa: CAPACase; accentTone?: "danger" }) {
  const stage = getLifecycleStage(capa.status);
  const d = dueDays(capa.id);
  return (
    <div
      className={cn(CARD_CLASS, accentTone === "danger" && "border-l-[3px] border-l-destructive")}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={MONO_ID_CLASS}>{capa.id}</span>
        </div>
        <p className={TITLE_CLASS}>{capa.title}</p>
        <div className={BADGE_ROW_CLASS}>
          <SeverityBadge severity={capa.impact.severity} />
          <StepBadge step={capa.currentStep} />
          <DueBadge id={capa.id} />
        </div>
        <div className="mt-2">
          <LifecyclePill stage={stage} />
        </div>
        {d?.overdue && (
          <p
            className="mb-0 mt-1.5 font-sans text-[11px] font-bold text-destructive"
          >
            ! {d.label}
          </p>
        )}
      </div>
      <OpenLink to={`/capa/${capa.id}`} />
    </div>
  );
}

function ReviewCard({ capa }: { capa: CAPACase }) {
  return (
    <div className={cn(CARD_CLASS, "border-l-[3px] border-l-warning")}>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={MONO_ID_CLASS}>{capa.id}</span>
          <SeverityBadge severity={capa.impact.severity} />
        </div>
        <p className={TITLE_CLASS}>{capa.title}</p>
        <div className={BADGE_ROW_CLASS}>
          <span
            className="rounded-[var(--r-full)] bg-[var(--warning-soft)] px-2 py-0.5 font-sans text-[11px] font-medium text-warning"
          >
            D7 Sign-off
          </span>
          <DueBadge id={capa.id} />
        </div>
        <div className="mt-2">
          <LifecyclePill stage={3} />
        </div>
      </div>
      <OpenLink to={`/capa/${capa.id}`} label="Review" tone="warning" />
    </div>
  );
}

function IntakeReviewCard({ capa }: { capa: CAPACase }) {
  return (
    <div className={cn(CARD_CLASS, "border-l-[3px] border-l-warning")}>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={MONO_ID_CLASS}>{capa.id}</span>
          <SeverityBadge severity={capa.impact.severity} />
        </div>
        <p className={TITLE_CLASS}>{capa.title}</p>
        <div className={BADGE_ROW_CLASS}>
          <span className="rounded-[var(--r-full)] bg-[var(--warning-soft)] px-2 py-0.5 font-sans text-[11px] font-medium text-warning">
            Intake Review
          </span>
          <DueBadge id={capa.id} />
        </div>
        <div className="mt-2">
          <LifecyclePill stage={2} />
        </div>
      </div>
      <OpenLink to={`/capa/${capa.id}`} label="Review" tone="warning" />
    </div>
  );
}

function ClosedCard({ capa }: { capa: CAPACase }) {
  const rejected = capa.status === "rejected";
  return (
    <Link
      to={`/capa/${capa.id}`}
      className={cn(CARD_CLASS, "items-center no-underline opacity-60 transition-opacity duration-200 hover:opacity-100")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-semibold text-foreground-secondary line-through">
            {capa.id}
          </span>
          {rejected ? (
            <span className="rounded-[var(--r-full)] bg-[var(--danger-soft)] px-[7px] py-0.5 font-sans text-[10px] font-medium text-destructive">
              Rejected
            </span>
          ) : (
            <span className="rounded-[var(--r-full)] bg-field px-[7px] py-0.5 font-sans text-[10px] text-foreground-faint">
              Closed
            </span>
          )}
          <span className="font-sans text-[11px] font-semibold text-foreground-tertiary">
            {rejected ? "No CAPA needed" : `Score ${capa.score.total}`}
          </span>
        </div>
        <p className="mb-0 mt-0.5 truncate text-sm text-foreground-tertiary">{capa.title}</p>
      </div>
    </Link>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const isMajor = finding.severity === "Major" || finding.severity === "Critical";
  const noCapa = finding.status === "pending_capa";
  const underReview = finding.status === "pending_review";
  const overdue = finding.status === "overdue";
  const rejected = finding.status === "rejected";
  return (
    <div
      className={cn(CARD_CLASS, overdue && "border-l-[3px] border-l-destructive")}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={MONO_ID_CLASS}>{finding.id}</span>
          <span
            className={cn(
              "rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[11px]",
              isMajor ? "bg-[var(--danger-soft)] text-destructive" : "bg-[var(--warning-soft)] text-warning",
            )}
          >
            {finding.severity}
          </span>
        </div>
        <p className={TITLE_CLASS}>{finding.shortDescription}</p>
        <div className={BADGE_ROW_CLASS}>
          <span
            className={cn(
              "rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[10px]",
              noCapa && "bg-[var(--warning-soft)] text-warning",
              rejected && "bg-[var(--danger-soft)] text-destructive",
              !noCapa && !rejected && "bg-[var(--accent-soft)] text-primary",
            )}
          >
            {noCapa
              ? "No CAPA yet"
              : underReview
                ? "Intake under review"
                : overdue
                  ? "Overdue"
                  : rejected
                    ? "Rejected — no CAPA"
                    : "CAPA in progress"}
          </span>
          <span
            className="font-sans text-[10px] text-foreground-faint"
          >
            {finding.department} · {finding.source}
          </span>
        </div>
      </div>
      {finding.linkedCapaId ? (
        <OpenLink to={`/capa/${finding.linkedCapaId}`} label="CAPA" />
      ) : (
        <Link
          to="/findings"
          className="font-sans text-xs text-foreground-tertiary no-underline"
        >
          View
        </Link>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PERSONA VIEWS
   ════════════════════════════════════════════════════════════ */

/** QA Deviation / QA Analyst — full operational view */
function QADeviationView() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const capas = useCapas().data ?? [];

  const { pendingIntake, overdue, active, closed } = useMemo(() => {
    const mine = capas.filter((c) => c.assignedTo === activePersonaId);
    const open = mine.filter((c) => c.status !== "closed" && c.status !== "rejected");
    const pendingIntake = capas.filter(
      (c) => c.status === "pending_review" &&
        c.intakeReviews?.some((r) => r.reviewerPersonaId === activePersonaId && !r.decision),
    );
    return {
      pendingIntake,
      overdue: open.filter((c) => isOverdue(c.id)),
      active: open.filter((c) => !isOverdue(c.id) && c.status !== "pending_review"),
      closed: mine.filter((c) => c.status === "closed" || c.status === "rejected").slice(0, 3),
    };
  }, [capas, activePersonaId]);

  return (
    <>
      {pendingIntake.length > 0 && (
        <Section label="Intake review needed" count={pendingIntake.length} mt={0}>
          {pendingIntake.map((c) => <IntakeReviewCard key={c.id} capa={c} />)}
        </Section>
      )}
      {overdue.length > 0 && (
        <Section label="Needs attention" count={overdue.length} mt={pendingIntake.length ? 32 : 0}>
          {overdue.map((c) => (
            <ActiveCard key={c.id} capa={c} accentTone="danger" />
          ))}
        </Section>
      )}
      <Section label="My active CAPAs" count={active.length} mt={overdue.length || pendingIntake.length ? 32 : 0}>
        {active.length > 0 ? (
          active.map((c) => <ActiveCard key={c.id} capa={c} />)
        ) : (
          <EmptyCard text="No active CAPAs assigned to you." />
        )}
      </Section>
      {closed.length > 0 && (
        <Section label="Closed & rejected" count={closed.length}>
          {closed.map((c) => <ClosedCard key={c.id} capa={c} />)}
        </Section>
      )}
    </>
  );
}

// ── Initiator-specific cards ────────────────────────────────────────────────

/**
 * CAPA card for Andi's "My CAPAs" section.
 * Shows a colour-coded blocking label when the CAPA is waiting on someone else.
 */
function InitiatorCapaCard({ capa }: { capa: CAPACase }) {
  const stage = getLifecycleStage(capa.status);

  const blockingLabel: Record<string, { text: string; class: string }> = {
    pending_review:    { text: "Waiting: intake review",  class: "bg-[var(--warning-soft)] text-warning" },
    revision_requested:{ text: "Action needed: revision", class: "bg-[var(--danger-soft)] text-destructive" },
    approval:          { text: "Waiting: approvals",      class: "bg-[var(--warning-soft)] text-warning" },
  };
  const blocking = blockingLabel[capa.status];

  return (
    <div
      className={cn(
        CARD_CLASS,
        capa.status === "revision_requested" && "border-l-[3px] border-l-destructive",
        (capa.status === "pending_review" || capa.status === "approval") && "border-l-[3px] border-l-warning",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={MONO_ID_CLASS}>{capa.id}</span>
          <SeverityBadge severity={capa.impact.severity} />
        </div>
        <p className={TITLE_CLASS}>{capa.title}</p>
        <div className={BADGE_ROW_CLASS}>
          {blocking ? (
            <span className={cn("rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[11px] font-semibold", blocking.class)}>
              {blocking.text}
            </span>
          ) : (
            <StepBadge step={capa.currentStep} />
          )}
          <DueBadge id={capa.id} />
        </div>
        <div className="mt-2">
          <LifecyclePill stage={stage} />
        </div>
      </div>
      <OpenLink to={`/capa/${capa.id}`} />
    </div>
  );
}

/** Single approval/rejection notification card for the "CAPA updates" feed. */
function ApprovalUpdateCard({ notif }: { notif: Notification }) {
  const isApproved = notif.type === "approval";
  const isRejected = notif.title.toLowerCase().includes("rejected") || notif.type === "rejected";
  return (
    <Link
      to={notif.actionUrl ?? (notif.capaId ? `/capa/${notif.capaId}` : "#")}
      className={cn(
        CARD_CLASS,
        "items-start no-underline transition-opacity duration-200 hover:opacity-80",
        isApproved && !isRejected && "border-l-[3px] border-l-success",
        isRejected && "border-l-[3px] border-l-destructive",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          {notif.capaId && <span className={MONO_ID_CLASS}>{notif.capaId}</span>}
          {!notif.read && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mb-1 mt-0 font-sans text-[13px] font-semibold text-foreground">
          {notif.title}
        </p>
        <p className="m-0 text-xs leading-[1.5] text-foreground-secondary">
          {notif.description}
        </p>
      </div>
      <ArrowRight size={13} strokeWidth={2} className="mt-1 shrink-0 text-foreground-faint" />
    </Link>
  );
}

/** Initiator / Senior Operator — tracking view only, no approvals */
function InitiatorView() {
  const persona = usePersonaStore((s) => s.activePersona());
  const capas = useCapas().data ?? [];
  const findings = useFindings().data ?? [];
  const notifications = useNotifications("initiator").data ?? [];

  const { myCAPAs, myClosed, myFindings, approvalUpdates } = useMemo(() => {
    const initiated = capas.filter((c) => c.createdBy === "initiator");
    const deptFindings = findings.filter((f) => f.department === persona.department);

    // CAPAs that are active or blocked — show to Andi so he can track them.
    const active = initiated.filter((c) => c.status !== "closed" && c.status !== "rejected");
    const closed  = initiated.filter((c) => c.status === "closed").slice(0, 2);

    // Findings in his area that don't yet have a CAPA, or are still open.
    const openFindings = deptFindings.filter((f) => f.status !== "capa_closed");

    // Approval + rejection notifications for the initiator, most-recent first.
    const updates = notifications
      .filter((n) => n.capaId && (n.type === "approval" || n.title.toLowerCase().includes("reject")))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return { myCAPAs: active, myClosed: closed, myFindings: openFindings, approvalUpdates: updates };
  }, [capas, findings, notifications, persona.department]);

  return (
    <>
      {/* CAPAs Andi initiated — shows blocking status prominently */}
      <Section label="My CAPAs" count={myCAPAs.length} mt={0}>
        {myCAPAs.length > 0 ? (
          myCAPAs.map((c) => <InitiatorCapaCard key={c.id} capa={c} />)
        ) : (
          <EmptyCard text="No active CAPAs yet." />
        )}
      </Section>

      {/* Approval / rejection notifications feed */}
      {approvalUpdates.length > 0 && (
        <Section label="CAPA updates" count={approvalUpdates.length}>
          {approvalUpdates.map((n) => (
            <ApprovalUpdateCard key={n.id} notif={n} />
          ))}
        </Section>
      )}

      {/* Open findings in Andi's area that haven't started a CAPA yet */}
      <Section label="Findings from my area" count={myFindings.length}>
        {myFindings.length > 0 ? (
          myFindings.map((f) => <FindingCard key={f.id} finding={f} />)
        ) : (
          <EmptyCard text="No open findings from your area." />
        )}
      </Section>

      {myClosed.length > 0 && (
        <Section label="Recently resolved" count={myClosed.length}>
          {myClosed.map((c) => <ClosedCard key={c.id} capa={c} />)}
        </Section>
      )}

      <div
        className="mt-6 rounded-[var(--r-md)] border border-[var(--line-2)] bg-card px-4 py-3.5 text-sm text-foreground-tertiary"
      >
        To create a CAPA from a finding,{" "}
        <Link to="/findings" className="font-semibold text-primary no-underline">
          open the Findings page →
        </Link>
      </div>
    </>
  );
}

/** Department Head — approve queue + dept oversight */
function DeptHeadView() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const capas = useCapas().data ?? [];

  const { pendingIntake, overdue, active, review } = useMemo(() => {
    const mine = capas.filter((c) => c.assignedTo === activePersonaId);
    const open = mine.filter((c) => c.status !== "closed");
    const pendingApproval = capas.filter((c) => c.status === "approval");
    const pendingIntake = capas.filter(
      (c) => c.status === "pending_review" &&
        c.intakeReviews?.some((r) => r.reviewerPersonaId === activePersonaId && !r.decision),
    );
    return {
      pendingIntake,
      overdue: open.filter((c) => isOverdue(c.id)),
      active: open.filter((c) => !isOverdue(c.id)),
      review: pendingApproval,
    };
  }, [capas, activePersonaId]);

  return (
    <>
      {pendingIntake.length > 0 && (
        <Section label="Intake review needed" count={pendingIntake.length} mt={0}>
          {pendingIntake.map((c) => <IntakeReviewCard key={c.id} capa={c} />)}
        </Section>
      )}
      {overdue.length > 0 && (
        <Section label="Overdue — needs action" count={overdue.length} mt={pendingIntake.length ? 32 : 0}>
          {overdue.map((c) => (
            <ActiveCard key={c.id} capa={c} accentTone="danger" />
          ))}
        </Section>
      )}
      <Section label="Investigations in progress" count={active.length} mt={overdue.length || pendingIntake.length ? 32 : 0}>
        {active.length > 0 ? (
          active.map((c) => <ActiveCard key={c.id} capa={c} />)
        ) : (
          <EmptyCard text="No active investigations assigned to you." />
        )}
      </Section>
      {review.length > 0 && (
        <Section label="Pending my approval" count={review.length}>
          {review.map((c) => <ReviewCard key={c.id} capa={c} />)}
        </Section>
      )}
    </>
  );
}

/** Head of QA — approval queue is primary, with all-dept escalations */
function HeadOfQAView() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const capas = useCapas().data ?? [];

  const { forApproval, mine, allOverdue } = useMemo(() => {
    const forApproval = capas.filter((c) => c.status === "approval");
    const mine = capas
      .filter((c) => c.assignedTo === activePersonaId && c.status !== "closed")
      .filter((c) => !isOverdue(c.id));
    const allOverdue = capas.filter(
      (c) => c.status !== "closed" && isOverdue(c.id),
    );
    return { forApproval, mine, allOverdue };
  }, [capas, activePersonaId]);

  return (
    <>
      {forApproval.length > 0 && (
        <Section label="Pending my approval" count={forApproval.length} mt={0}>
          {forApproval.map((c) => <ReviewCard key={c.id} capa={c} />)}
        </Section>
      )}
      {allOverdue.length > 0 && (
        <Section label="Org-wide overdue CAPAs" count={allOverdue.length}>
          {allOverdue.map((c) => (
            <ActiveCard key={c.id} capa={c} accentTone="danger" />
          ))}
        </Section>
      )}
      {mine.length > 0 && (
        <Section label="Assigned to me" count={mine.length}>
          {mine.map((c) => <ActiveCard key={c.id} capa={c} />)}
        </Section>
      )}
      {forApproval.length === 0 && allOverdue.length === 0 && mine.length === 0 && (
        <EmptyCard text="No pending items. All CAPAs are on track." />
      )}
    </>
  );
}

/** SME — consultation view; shows CAPAs in investigation where they may be needed */
function SMEView() {
  const capas = useCapas().data ?? [];

  const consulting = useMemo(
    () => capas.filter((c) => c.status === "investigation" && c.currentStep === "rca"),
    [capas],
  );

  return (
    <>
      <Section label="CAPAs awaiting root cause input" count={consulting.length} mt={0}>
        {consulting.length > 0 ? (
          consulting.map((c) => <ActiveCard key={c.id} capa={c} />)
        ) : (
          <EmptyCard text="No CAPAs currently require your input." />
        )}
      </Section>
      <div
        className="mt-6 rounded-[var(--r-md)] border border-[var(--line-2)] bg-card px-4 py-3.5 text-sm leading-relaxed text-foreground-tertiary"
      >
        <span className="font-semibold text-foreground-secondary">Your role as SME —</span> You are
        consulted on root cause and corrective action review for cases in your domain. Navigate to{" "}
        <Link to="/capa/list" className="font-semibold text-primary no-underline">
          All CAPAs
        </Link>{" "}
        to browse or search all active investigations.
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE — persona-aware header + view dispatch
   ════════════════════════════════════════════════════════════ */

const PERSONA_VIEWS: Record<PersonaID, () => React.ReactElement> = {
  initiator: InitiatorView,
  qa_deviation: QADeviationView,
  head_of_dept: DeptHeadView,
  head_of_qa: HeadOfQAView,
  sme: SMEView,
};

const PERSONA_SUBTITLES: Record<PersonaID, (name: string, count: number) => string> = {
  initiator: (n, c) => `${c} open finding${c !== 1 ? "s" : ""} from your area`,
  qa_deviation: (n, c) => `You have ${c} active CAPA${c !== 1 ? "s" : ""}`,
  head_of_dept: (n, c) =>
    `${c} investigation${c !== 1 ? "s" : ""} assigned to you`,
  head_of_qa: (_, c) => `${c} CAPA${c !== 1 ? "s" : ""} pending approval or overdue`,
  sme: () => "CAPAs awaiting your root cause consultation",
};

export function MyWorkPage() {
  const persona = usePersonaStore((s) => s.activePersona());
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const capas = useCapas().data ?? [];
  const findings = useFindings().data ?? [];

  const subtitleCount = useMemo(() => {
    if (activePersonaId === "initiator") {
      return findings.filter(
        (f) => f.department === persona.department && f.status !== "capa_closed",
      ).length;
    }
    if (activePersonaId === "head_of_qa") {
      return capas.filter((c) => c.status === "approval" || isOverdue(c.id)).length;
    }
    return capas.filter(
      (c) =>
        c.assignedTo === activePersonaId &&
        c.status !== "closed" &&
        c.status !== "rejected",
    ).length;
  }, [capas, findings, activePersonaId, persona.department]);

  const View = PERSONA_VIEWS[activePersonaId] ?? QADeviationView;

  return (
    <div
      className="max-w-[760px] font-sans"
    >
      {/* ── Greeting header ──────────────────────────────────── */}
      <div className="mb-8">
        <h2
          className="mb-1.5 mt-0 text-4xl font-semibold tracking-[-0.02em] text-foreground"
        >
          {getGreeting()}, {persona.displayName.split(" ")[0]}
        </h2>
        <p
          className="m-0 font-sans text-sm text-foreground-secondary"
        >
          {new Date("2026-05-31").toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          ·{" "}
          <span className="font-semibold text-foreground">
            {PERSONA_SUBTITLES[activePersonaId]?.(persona.displayName.split(" ")[0], subtitleCount) ??
              `${subtitleCount} active`}
          </span>
        </p>
      </div>

      {/* ── Persona view ─────────────────────────────────────── */}
      <View />
    </div>
  );
}
