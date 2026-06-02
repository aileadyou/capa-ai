import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCapaStore, usePersonaStore } from "@/store";
import type { CAPACase, Finding, PersonaID } from "@/types";
import { SeverityBadge } from "@/components/shared/SeverityBadge";

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
  return 2; // draft | disposisi | investigation
}

/* ════════════════════════════════════════════════════════════
   MOCK DUE DATES  (no dueDate field in mock data)
   ════════════════════════════════════════════════════════════ */

const MOCK_DUE: Record<string, string> = {
  "CAPA-2026-0341": "2026-06-06",
  "CAPA-2026-0089": "2026-05-28", // 3d overdue
  "CAPA-2026-0112": "2026-06-12",
  "CAPA-2026-0298": "2026-06-04",
  "CAPA-2026-0275": "2026-06-17",
  "CAPA-2026-0188": "2026-03-07", // very overdue (investigation since Feb)
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

const T = {
  cardBase: {
    background: "var(--bg-2)",
    border: "1px solid var(--line-2)",
    borderRadius: "var(--r-md)",
    boxShadow: "var(--shadow-sm)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  } as React.CSSProperties,
  monoId: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--fg-1)",
  } as React.CSSProperties,
  title: {
    fontSize: "13px",
    color: "var(--fg-2)",
    margin: "3px 0 10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
};

/* ── Primitives ─────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--fg-4)",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function StepBadge({ step }: { step: string }) {
  return (
    <span
      style={{
        background: "var(--accent-soft)",
        color: "var(--accent)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "var(--r-full)",
      }}
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
      style={{
        background: d.overdue ? "var(--danger-soft)" : d.soon ? "var(--warning-soft)" : "transparent",
        color: d.overdue ? "var(--danger)" : d.soon ? "var(--warning)" : "var(--fg-3)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: d.overdue || d.soon ? 600 : 400,
        padding: "2px 8px",
        borderRadius: "var(--r-full)",
      }}
    >
      {d.label}
    </span>
  );
}

/** Mini 4-stage lifecycle pill bar */
function LifecyclePill({ stage }: { stage: LifecycleStage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {([1, 2, 3, 4] as LifecycleStage[]).map((s) => {
        const active = s === stage;
        const done = s < stage;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div
              title={LIFECYCLE_LABELS[s]}
              style={{
                width: "20px",
                height: "4px",
                borderRadius: "2px",
                background: done
                  ? "var(--success)"
                  : active
                    ? s === 3
                      ? "var(--warning)"
                      : "var(--accent)"
                    : "var(--bg-4)",
                transition: "background 200ms",
              }}
            />
          </div>
        );
      })}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color:
            stage === 3 ? "var(--warning)" : stage === 4 ? "var(--success)" : "var(--fg-3)",
          marginLeft: "4px",
        }}
      >
        {LIFECYCLE_LABELS[stage]}
      </span>
    </div>
  );
}

function OpenLink({ to, label = "Open", color = "var(--accent)" }: { to: string; label?: string; color?: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontFamily: "var(--font-sans)",
        fontSize: "13px",
        fontWeight: 600,
        color,
        textDecoration: "none",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
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
    <section style={{ marginTop: mt }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
        <Eyebrow>{label}</Eyebrow>
        {count !== undefined && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--fg-4)",
            }}
          >
            {count}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{children}</div>
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "var(--r-md)",
        border: "1px dashed var(--line-2)",
        textAlign: "center",
        color: "var(--fg-4)",
        fontSize: "13px",
      }}
    >
      {text}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD VARIANTS
   ════════════════════════════════════════════════════════════ */

function ActiveCard({ capa, accentLeft }: { capa: CAPACase; accentLeft?: string }) {
  const stage = getLifecycleStage(capa.status);
  const d = dueDays(capa.id);
  return (
    <div
      style={{
        ...T.cardBase,
        ...(accentLeft ? { borderLeft: `3px solid ${accentLeft}` } : {}),
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={T.monoId}>{capa.id}</span>
        </div>
        <p style={T.title}>{capa.title}</p>
        <div style={T.badgeRow}>
          <SeverityBadge severity={capa.impact.severity} />
          <StepBadge step={capa.currentStep} />
          <DueBadge id={capa.id} />
        </div>
        <div style={{ marginTop: "8px" }}>
          <LifecyclePill stage={stage} />
        </div>
        {d?.overdue && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--danger)",
              margin: "6px 0 0",
            }}
          >
            ⚠ {d.label}
          </p>
        )}
      </div>
      <OpenLink to={`/capa/${capa.id}`} />
    </div>
  );
}

function ReviewCard({ capa }: { capa: CAPACase }) {
  return (
    <div style={{ ...T.cardBase, borderLeft: "3px solid var(--warning)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={T.monoId}>{capa.id}</span>
          <SeverityBadge severity={capa.impact.severity} />
        </div>
        <p style={T.title}>{capa.title}</p>
        <div style={T.badgeRow}>
          <span
            style={{
              background: "var(--warning-soft)",
              color: "var(--warning)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: "var(--r-full)",
            }}
          >
            D7 Sign-off
          </span>
          <DueBadge id={capa.id} />
        </div>
        <div style={{ marginTop: "8px" }}>
          <LifecyclePill stage={3} />
        </div>
      </div>
      <OpenLink to={`/capa/${capa.id}`} label="Review" color="var(--warning)" />
    </div>
  );
}

function ClosedCard({ capa }: { capa: CAPACase }) {
  return (
    <div style={{ ...T.cardBase, opacity: 0.45, alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ ...T.monoId, textDecoration: "line-through", color: "var(--fg-2)" }}>
            {capa.id}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "var(--r-full)",
              background: "var(--bg-4)",
              color: "var(--fg-4)",
            }}
          >
            Closed
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--fg-3)",
            }}
          >
            Score {capa.score.total}
          </span>
        </div>
        <p style={{ ...T.title, margin: "2px 0 0", color: "var(--fg-3)" }}>{capa.title}</p>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const isMajor = finding.severity === "Major" || finding.severity === "Critical";
  const noCapa = finding.status === "pending_capa";
  const overdue = finding.status === "overdue";
  return (
    <div
      style={{
        ...T.cardBase,
        ...(overdue ? { borderLeft: "3px solid var(--danger)" } : {}),
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={T.monoId}>{finding.id}</span>
          <span
            style={{
              background: isMajor ? "var(--danger-soft)" : "var(--warning-soft)",
              color: isMajor ? "var(--danger)" : "var(--warning)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "var(--r-full)",
            }}
          >
            {finding.severity}
          </span>
        </div>
        <p style={T.title}>{finding.shortDescription}</p>
        <div style={T.badgeRow}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "var(--r-full)",
              background: noCapa ? "var(--warning-soft)" : "var(--accent-soft)",
              color: noCapa ? "var(--warning)" : "var(--accent)",
            }}
          >
            {noCapa ? "No CAPA yet" : overdue ? "Overdue" : "CAPA in progress"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--fg-4)",
            }}
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
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "var(--fg-3)",
            textDecoration: "none",
          }}
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
  const capas = useCapaStore((s) => s.capas);

  const { overdue, active, closed } = useMemo(() => {
    const mine = capas.filter((c) => c.assignedTo === activePersonaId);
    const open = mine.filter((c) => c.status !== "closed");
    return {
      overdue: open.filter((c) => isOverdue(c.id)),
      active: open.filter((c) => !isOverdue(c.id)),
      closed: mine.filter((c) => c.status === "closed").slice(0, 3),
    };
  }, [capas, activePersonaId]);

  const totalOpen = overdue.length + active.length;

  return (
    <>
      {overdue.length > 0 && (
        <Section label="Needs attention" count={overdue.length} mt={0}>
          {overdue.map((c) => (
            <ActiveCard key={c.id} capa={c} accentLeft="var(--danger)" />
          ))}
        </Section>
      )}
      <Section label="My active CAPAs" count={active.length} mt={overdue.length ? 32 : 0}>
        {active.length > 0 ? (
          active.map((c) => <ActiveCard key={c.id} capa={c} />)
        ) : (
          <EmptyCard text="No active CAPAs assigned to you." />
        )}
      </Section>
      {closed.length > 0 && (
        <Section label="Recently closed" count={closed.length}>
          {closed.map((c) => <ClosedCard key={c.id} capa={c} />)}
        </Section>
      )}
    </>
  );
}

/** Initiator / Senior Operator — tracking view only, no approvals */
function InitiatorView() {
  const persona = usePersonaStore((s) => s.activePersona());
  const capas = useCapaStore((s) => s.capas);
  const findings = useCapaStore((s) => s.findings);

  const { myFindings, myClosed } = useMemo(() => {
    const initiated = capas.filter((c) => c.createdBy === "initiator");
    const deptFindings = findings.filter((f) => f.department === persona.department);
    return {
      myFindings: deptFindings.filter((f) => f.status !== "capa_closed"),
      myClosed: initiated.filter((c) => c.status === "closed").slice(0, 2),
    };
  }, [capas, findings, persona.department]);

  return (
    <>
      <Section label="Findings from my area" count={myFindings.length} mt={0}>
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
        style={{
          marginTop: "24px",
          padding: "14px 16px",
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          fontSize: "13px",
          color: "var(--fg-3)",
        }}
      >
        To create a CAPA from a finding,{" "}
        <Link to="/findings" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
          open the Findings page →
        </Link>
      </div>
    </>
  );
}

/** Department Head — approve queue + dept oversight */
function DeptHeadView() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const capas = useCapaStore((s) => s.capas);

  const { overdue, active, review } = useMemo(() => {
    const mine = capas.filter((c) => c.assignedTo === activePersonaId);
    const open = mine.filter((c) => c.status !== "closed");
    const pendingApproval = capas.filter((c) => c.status === "approval");
    return {
      overdue: open.filter((c) => isOverdue(c.id)),
      active: open.filter((c) => !isOverdue(c.id)),
      review: pendingApproval,
    };
  }, [capas, activePersonaId]);

  return (
    <>
      {overdue.length > 0 && (
        <Section label="Overdue — needs action" count={overdue.length} mt={0}>
          {overdue.map((c) => (
            <ActiveCard key={c.id} capa={c} accentLeft="var(--danger)" />
          ))}
        </Section>
      )}
      <Section label="Investigations in progress" count={active.length} mt={overdue.length ? 32 : 0}>
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
  const capas = useCapaStore((s) => s.capas);

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
            <ActiveCard key={c.id} capa={c} accentLeft="var(--danger)" />
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
  const capas = useCapaStore((s) => s.capas);

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
        style={{
          marginTop: "24px",
          padding: "14px 16px",
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          fontSize: "13px",
          color: "var(--fg-3)",
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--fg-2)" }}>Your role as SME —</span> You are
        consulted on root cause and corrective action review for cases in your domain. Navigate to{" "}
        <Link to="/capa" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
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
  const capas = useCapaStore((s) => s.capas);
  const findings = useCapaStore((s) => s.findings);

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
      (c) => c.assignedTo === activePersonaId && c.status !== "closed",
    ).length;
  }, [capas, findings, activePersonaId, persona.department]);

  const View = PERSONA_VIEWS[activePersonaId] ?? QADeviationView;

  return (
    <div
      style={{
        maxWidth: "760px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Greeting header ──────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "26px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--fg-1)",
            margin: "0 0 6px",
          }}
        >
          {getGreeting()}, {persona.displayName.split(" ")[0]}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--fg-2)",
            margin: 0,
          }}
        >
          {new Date("2026-05-31").toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          ·{" "}
          <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>
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
