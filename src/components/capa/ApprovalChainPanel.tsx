import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "@/hooks/use-dialog";
import { CheckCircle2, Circle, PenLine, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { usePersonaStore } from "@/store";
import { useAddNotification, useRecordApproval } from "@/hooks/api";
import type { ApprovalEvent, ApprovalStage, CAPACase } from "@/types";
import type { PersonaID } from "@/types/persona";
import {
  approverRoleLabel,
  getCycleByStage,
  resolveCycleApprovers,
} from "@/config/workflows";
import { formatDateTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface ResolvedApprover {
  personaId: PersonaID;
  name: string;
  role: string;
}

// ── E-Signature Modal ────────────────────────────────────────────────────────

function ESignatureModal({
  approver,
  cycleTitle,
  isSubmitting,
  onApprove,
  onReject,
  onClose,
}: {
  approver: ResolvedApprover;
  cycleTitle: string;
  isSubmitting: boolean;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const { ref } = useDialog<HTMLDivElement>(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--glass-dark)] backdrop-blur"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="esig-title"
        tabIndex={-1}
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[440px] animate-[leadReveal_var(--dur-tab)_var(--ease-out)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-[var(--r-xl)] border border-[var(--line-2)] bg-card p-6 shadow-lg"
      >
        <div>
          <p className="mb-1.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            E-Signature · {cycleTitle}
          </p>
          <h2 id="esig-title" className="mb-1 mt-0 font-sans text-lg font-bold text-foreground">
            Approval Decision
          </h2>
          <p className="m-0 text-[13px] text-foreground-tertiary">
            {approver.name} will sign this CAPA with a mocked electronic signature and timestamp.
          </p>
        </div>

        <div className="rounded-[var(--r-md)] border border-border-subtle bg-elevated px-3.5 py-3">
          <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-foreground">
            {approver.name}
          </p>
          <p className="mb-1.5 mt-0 font-sans text-xs text-foreground-tertiary">{approver.role}</p>
          <p className="m-0 font-sans text-[11px] text-foreground-faint">
            {new Date().toLocaleString()}
          </p>
        </div>

        <div>
          <label
            htmlFor="esig-notes"
            className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary"
          >
            Notes (optional)
          </label>
          <textarea
            id="esig-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Approval or rejection notes…"
            className="box-border w-full resize-y rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-2.5 font-sans text-[13px] leading-[1.6] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <button
            onClick={() => onReject(notes)}
            disabled={isSubmitting}
            className={cn(
              "rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-4 py-2 font-sans text-[13px] font-semibold text-destructive transition-opacity [transition-duration:var(--dur-fast)]",
              isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(notes)}
            disabled={isSubmitting}
            className={cn(
              "rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold text-primary-foreground transition-opacity [transition-duration:var(--dur-fast)]",
              isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
          >
            {isSubmitting ? "Signing…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Chain Panel ─────────────────────────────────────────────────────

/**
 * Renders one workflow approval cycle (resolved from the per-type WorkflowConfig)
 * and drives e-signature decisions through the store's recordApproval. Reusable
 * across the 8D seams: complaint Round-1 / audit Plan on D5, audit Actual on D6,
 * and the closing cycle (deviation sign-off / audit + complaint closure) on D7.
 *
 * The score ≥ 80 hard gate applies ONLY to the closing cycle (cycle.final).
 */
export function ApprovalChainPanel({
  capa,
  stage,
}: {
  capa: CAPACase;
  stage: ApprovalStage;
}) {
  const personas = usePersonaStore((state) => state.personas);
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const recordApproval = useRecordApproval();
  const addNotification = useAddNotification();

  const [selected, setSelected] = useState<ResolvedApprover | undefined>();
  const [triedBlocked, setTriedBlocked] = useState(false);

  const cycle = getCycleByStage(capa, stage);

  const chain: ResolvedApprover[] = useMemo(() => {
    if (!cycle) return [];
    return resolveCycleApprovers(cycle, capa).map((personaId) => {
      const persona = personas.find((p) => p.id === personaId);
      return {
        personaId,
        name: persona?.displayName ?? personaId,
        role: approverRoleLabel(cycle, personaId, persona?.role ?? personaId),
      };
    });
  }, [cycle, capa, personas]);

  if (!cycle) return null;

  const isFinal = cycle.final === true;
  const requiresScore = isFinal;
  const scoreReady = capa.score.total >= 80;
  const isClosed = capa.status === "closed";

  // Approvals scoped to THIS cycle's stage. Legacy/stageless events count only
  // for the closing cycle (they predate multi-cycle stage tagging).
  const stageApprovalFor = (personaId: PersonaID): ApprovalEvent | undefined =>
    capa.approvals.find(
      (event) =>
        event.approverPersonaId === personaId &&
        (event.stage === stage || (event.stage == null && isFinal)),
    );

  const approvedIds = new Set(
    chain
      .map((a) => stageApprovalFor(a.personaId))
      .filter((e): e is ApprovalEvent => e?.decision === "approved")
      .map((e) => e.approverPersonaId),
  );
  const cycleComplete = chain.length > 0 && chain.every((a) => approvedIds.has(a.personaId));
  const activeGates = (cycle.gated ?? []).filter((g) => g.when(capa));

  function openESignature(approver: ResolvedApprover) {
    if (approver.personaId !== activePersonaId) {
      toast.error("Approval belongs to another persona", {
        description: `Switch to ${approver.name} to sign this approval gate.`,
      });
      return;
    }
    setSelected(approver);
  }

  async function submitDecision(decision: "approved" | "rejected", notes: string) {
    if (!selected || !cycle) return;

    const approval: ApprovalEvent = {
      approverPersonaId: selected.personaId,
      approverName: selected.name,
      role: selected.role,
      decision,
      notes: notes.trim() || undefined,
      signedAt: new Date().toISOString(),
      stage,
    };

    // The server records the e-signature audit event for both approved and
    // rejected decisions, and on rejection it flips the case to
    // revision_requested and notifies the assignee — so the client only adds
    // the forward "next approver" notification below.
    try {
      await recordApproval.mutateAsync({ capaId: capa.id, stage, approval });
    } catch (error) {
      toast.error("Approval blocked", {
        description:
          error instanceof Error
            ? error.message
            : "This approval can only be signed by the active persona assigned to the current approval gate.",
      });
      setSelected(undefined);
      return;
    }

    if (decision === "rejected") {
      toast.error("Approval rejected", {
        description: `${selected.name} rejected the ${cycle.title} for ${capa.id}.`,
      });
      setSelected(undefined);
      return;
    }

    const nextApproved = new Set(approvedIds);
    nextApproved.add(selected.personaId);
    const allSigned = chain.every((a) => nextApproved.has(a.personaId));

    if (allSigned && isFinal) {
      toast.success(`${capa.id} closed as Audit Ready`, {
        description: "All approvers signed off. CAPA is now Audit Ready.",
      });
    } else if (allSigned) {
      toast.success(`${cycle.title} complete`, {
        description: "All approvers in this cycle have signed off.",
      });
    } else {
      toast.success("Approval recorded", {
        description: `${selected.name} signed off on ${cycle.title}.`,
      });
    }

    setSelected(undefined);
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border-subtle bg-elevated px-4 py-3.5">
          <div className="min-w-0">
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {cycle.title}
            </p>
            {cycle.subtitle && (
              <p className="mb-0 mt-0.5 font-sans text-[11px] text-foreground-faint">
                {cycle.subtitle}
              </p>
            )}
          </div>
          {cycleComplete && (
            <span className="ml-auto shrink-0 rounded-[var(--r-full)] border border-success/40 bg-[var(--success-soft)] px-2 py-0.5 font-sans text-[11px] font-semibold text-success">
              Complete
            </span>
          )}
        </div>

        {/* Gated-approver note (e.g. SME required for Major/Critical) */}
        {activeGates.length > 0 && (
          <div className="flex flex-col gap-1 border-b border-border-subtle bg-[var(--warning-soft)]/40 px-4 py-2.5">
            {activeGates.map((gate) => (
              <p
                key={gate.personaId}
                className="m-0 flex items-center gap-1.5 font-sans text-[11px] font-medium text-warning"
              >
                <ShieldAlert size={12} className="shrink-0" />
                {gate.label ?? `${gate.personaId} approval is required for this case.`}
              </p>
            ))}
          </div>
        )}

        {/* Score gate hint for the closing cycle */}
        {requiresScore && (!scoreReady || triedBlocked) && (
          <div
            role="alert"
            className="flex gap-2.5 border-b border-border-subtle bg-[var(--danger-soft)] px-4 py-2.5"
          >
            <ShieldAlert size={14} className="mt-px shrink-0 text-destructive" />
            <p className="m-0 font-sans text-[11px] text-foreground-tertiary">
              {scoreReady
                ? "All required e-signatures are recorded. This CAPA can close as Audit Ready."
                : `Quality score is ${capa.score.total}; e-signatures can be recorded, but closure as Audit Ready waits until the score reaches 80.`}
            </p>
          </div>
        )}

        {/* Progress bar — X of N approved */}
        {chain.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border-subtle bg-elevated px-4 py-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
              <div
                className="h-full rounded-full bg-success transition-all [transition-duration:var(--dur-tab)]"
                style={{ width: `${(approvedIds.size / chain.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 font-sans text-[11px] text-foreground-faint">
              {approvedIds.size} / {chain.length} signed
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {chain.map((approver) => {
            const approval = stageApprovalFor(approver.personaId);
            const isApproved = approval?.decision === "approved";
            const isRejected = approval?.decision === "rejected";
            const isActivePersonaApprover = activePersonaId === approver.personaId;
            const canAct = !isClosed && !approval && isActivePersonaApprover;

            return (
              <div
                key={approver.personaId}
                className={cn(
                  "flex flex-col gap-3 p-4",
                  isApproved
                    ? "bg-[var(--success-soft)]"
                    : isRejected
                      ? "bg-[var(--danger-soft)]"
                      : "bg-transparent",
                )}
              >
                {/* Status icon + name */}
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 pt-0.5">
                    {isApproved ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : isRejected ? (
                      <XCircle size={18} className="text-destructive" />
                    ) : (
                      <Circle size={18} className="text-foreground-faint" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-foreground">
                      {approver.name}
                    </p>
                    <p className="m-0 text-xs text-foreground-tertiary">{approver.role}</p>
                    {approval?.signedAt && (
                      <p className="mb-0 mt-1.5 font-sans text-[11px] text-foreground-faint">
                        Signed {formatDateTime(approval.signedAt)}
                      </p>
                    )}
                    {approval?.notes && (
                      <p className="mb-0 mt-2 rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-2.5 py-1.5 text-xs italic text-foreground-tertiary">
                        {approval.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status badge + sign button */}
                <div className="flex items-center gap-2">
                  {isApproved && (
                    <span className="rounded-[var(--r-full)] border border-success/40 bg-[var(--success-soft)] px-2 py-0.5 font-sans text-[11px] font-semibold text-success">
                      Approved
                    </span>
                  )}
                  {isRejected && (
                    <span className="rounded-[var(--r-full)] border border-destructive/40 bg-[var(--danger-soft)] px-2 py-0.5 font-sans text-[11px] font-semibold text-destructive">
                      Rejected
                    </span>
                  )}
                  {!approval && (
                    <span
                      className={cn(
                        "rounded-[var(--r-full)] border px-2 py-0.5 font-sans text-[11px] font-semibold",
                        isActivePersonaApprover
                          ? "border-warning/40 bg-[var(--warning-soft)] text-warning"
                          : "border-border-subtle bg-elevated text-foreground-faint",
                      )}
                    >
                      {isActivePersonaApprover ? "Awaiting you" : "Pending"}
                    </span>
                  )}
                  {!approval && (
                    <button
                      type="button"
                      disabled={!canAct}
                      onClick={() => openESignature(approver)}
                      title={
                        !isActivePersonaApprover
                          ? `Switch to ${approver.name} to sign.`
                          : undefined
                      }
                      className={cn(
                        "ml-auto flex items-center gap-1.5 rounded-[var(--r-sm)] px-3 py-[6px] font-sans text-xs font-semibold",
                        canAct
                          ? "cursor-pointer border-0 bg-[image:var(--grad-brand)] text-primary-foreground"
                          : "cursor-not-allowed border border-[var(--line-2)] bg-field text-foreground-faint opacity-50",
                      )}
                    >
                      <PenLine size={12} />
                      Sign
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected &&
        createPortal(
          <ESignatureModal
            approver={selected}
            cycleTitle={cycle.title}
            isSubmitting={recordApproval.isPending}
            onApprove={(notes) => submitDecision("approved", notes)}
            onReject={(notes) => submitDecision("rejected", notes)}
            onClose={() => setSelected(undefined)}
          />,
          document.body,
        )}
    </>
  );
}
