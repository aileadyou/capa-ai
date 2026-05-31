import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, PenLine, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { EightDShell } from "@/components/layout/EightDShell";
import { ScorePill } from "@/components/shared/ScorePill";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore, useNotificationStore } from "@/store";
import type { ApprovalEvent, CAPACase } from "@/types";
import type { PersonaID } from "@/types/persona";
import { formatDateTime } from "@/utils/formatters";

// ── Types ────────────────────────────────────────────────────────────────────

interface Approver {
  personaId: PersonaID;
  name: string;
  role: string;
}

const approvers: Record<PersonaID, Omit<Approver, "personaId">> = {
  initiator: { name: "Andi Wijaya", role: "Initiator" },
  qa_deviation: { name: "Siti Rahmawati", role: "QA Deviation / QA Compliance / QA Complaint" },
  head_of_dept: { name: "Bambang Saputra", role: "Department Head" },
  head_of_qa: { name: "Dewi Anggraini", role: "Head of QA" },
  sme: { name: "Dr. Ahmad Pratomo", role: "SME Microbiology" },
};

function getApprovalChain(capa: CAPACase): Approver[] {
  const chain: PersonaID[] =
    capa.type === "complaint"
      ? ["qa_deviation", "head_of_dept", "head_of_qa"]
      : ["head_of_dept", "qa_deviation", "head_of_qa"];

  if (capa.impact.severity === "Critical") {
    chain.splice(chain.length - 1, 0, "sme");
  }

  return chain.map((personaId) => ({ personaId, ...approvers[personaId] }));
}

function getApprovalFor(approvals: ApprovalEvent[], personaId: PersonaID) {
  return approvals.find((a) => a.approverPersonaId === personaId);
}

// ── E-Signature Modal ────────────────────────────────────────────────────────

function ESignatureModal({
  approver,
  onApprove,
  onReject,
  onClose,
}: {
  approver: Approver;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--glass-dark)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-xl)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "leadReveal var(--dur-tab) var(--ease-out)",
        }}
      >
        {/* Header */}
        <div>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 6px" }}>
            E-Signature
          </p>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--fg-1)", margin: "0 0 4px", fontFamily: "var(--font-sans)" }}>
            Approval Decision
          </h2>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0 }}>
            {approver.name} will sign this CAPA with a mocked electronic signature and timestamp.
          </p>
        </div>

        {/* Approver info */}
        <div
          style={{
            padding: "12px 14px",
            background: "var(--bg-3)",
            border: "1px solid var(--line-1)",
            borderRadius: "var(--r-md)",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-1)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
            {approver.name}
          </p>
          <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: "0 0 6px", fontFamily: "var(--font-sans)" }}>
            {approver.role}
          </p>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--fg-4)", margin: 0 }}>
            {new Date().toLocaleString()}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="esig-notes"
            style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}
          >
            Notes (optional)
          </label>
          <textarea
            id="esig-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Approval or rejection notes…"
            style={{
              width: "100%",
              background: "var(--bg-4)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)",
              padding: "10px 12px",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
          <button
            onClick={() => onReject(notes)}
            style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)", borderRadius: "var(--r-sm)", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(notes)}
            style={{ background: "var(--grad-brand)", color: "var(--on-accent)", border: "none", borderRadius: "var(--r-sm)", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function D7SignOffPage() {
  const { id } = useParams();
  const rawCapa = useCapaStore((state) => state.capas.find((c) => c.id === id));
  const allCAs = useCapaStore((state) => state.correctiveActions);
  const allPAs = useCapaStore((state) => state.preventiveActions);
  const capa = useMemo(() => {
    if (!rawCapa) return undefined;
    return {
      ...rawCapa,
      correctiveActions: allCAs.filter((a) => a.capaId === rawCapa.id),
      preventiveActions: allPAs.filter((a) => a.capaId === rawCapa.id),
    };
  }, [rawCapa, allCAs, allPAs]);

  const approveSignOff = useCapaStore((state) => state.approveSignOff);
  const closeCAPA = useCapaStore((state) => state.closeCAPA);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [selectedApprover, setSelectedApprover] = useState<Approver | undefined>();
  const [hasTriedApproval, setHasTriedApproval] = useState(false);

  const approvalChain = useMemo(() => (capa ? getApprovalChain(capa) : []), [capa]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const isAuditReady = capa.score.total >= 80;
  const isClosed = capa.status === "closed";
  const approvedIds = new Set(
    capa.approvals.filter((a) => a.decision === "approved").map((a) => a.approverPersonaId),
  );
  const nextApprover = approvalChain.find((a) => !approvedIds.has(a.personaId));
  const allApproved = approvalChain.every((a) => approvedIds.has(a.personaId));
  const showScoreBlocker = hasTriedApproval && !isAuditReady;

  function openESignature(approver: Approver) {
    setHasTriedApproval(true);

    if (!isAuditReady) {
      toast.error("Sign-off blocked", {
        description: "Quality score must be at least 80 before final approval.",
      });
      return;
    }

    setSelectedApprover(approver);
  }

  function submitDecision(decision: "approved" | "rejected", notes: string) {
    if (!selectedApprover) return;

    const approval: ApprovalEvent = {
      approverPersonaId: selectedApprover.personaId,
      approverName: selectedApprover.name,
      role: selectedApprover.role,
      decision,
      notes: notes.trim() || undefined,
      signedAt: new Date().toISOString(),
    };

    approveSignOff(capa.id, approval);
    addAuditEvent({
      actorPersonaId: selectedApprover.personaId,
      actorName: selectedApprover.name,
      actorRole: selectedApprover.role,
      domain: "system",
      eventType: decision === "approved" ? "capa_approved" : "notification_sent",
      action:
        decision === "approved"
          ? `${selectedApprover.name} approved ${capa.id} in the D7 sign-off chain.`
          : `${selectedApprover.name} rejected ${capa.id} in the D7 sign-off chain.`,
      capaId: capa.id,
      findingId: capa.findingId,
      after: notes.trim() || undefined,
    });

    const nextApprovedIds = new Set(approvedIds);
    if (decision === "approved") nextApprovedIds.add(selectedApprover.personaId);
    const upcomingApprover = approvalChain.find((a) => !nextApprovedIds.has(a.personaId));

    if (decision === "rejected") {
      addNotification({
        recipientPersonaId: "qa_deviation",
        type: "rejected",
        title: "CAPA sign-off rejected",
        description: `${selectedApprover.name} rejected ${capa.id}. Review notes and resubmit.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}`,
      });
      toast.error("CAPA rejected", { description: `${selectedApprover.name} rejected ${capa.id}.` });
    } else if (upcomingApprover) {
      addNotification({
        recipientPersonaId: upcomingApprover.personaId,
        type: "approval",
        title: "CAPA awaiting your approval",
        description: `${capa.id} is ready for ${upcomingApprover.name} to approve.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}`,
      });
      addAuditEvent({
        actorName: "System",
        actorRole: "Demo Runtime",
        domain: "system",
        eventType: "notification_sent",
        action: `Notification sent to ${upcomingApprover.name} for ${capa.id} sign-off.`,
        capaId: capa.id,
        findingId: capa.findingId,
      });
      toast.success("Approval recorded", { description: `Notification sent to ${upcomingApprover.name}.` });
    } else {
      closeCAPA(capa.id);
      approvalChain.forEach((approver) => {
        addNotification({
          recipientPersonaId: approver.personaId,
          type: "closed",
          title: "CAPA closed as Audit Ready",
          description: `${capa.id} has been approved and marked as Audit Ready.`,
          capaId: capa.id,
          actionUrl: `/capa/${capa.id}`,
        });
      });
      toast.success(`${capa.id} closed as Audit Ready`, {
        description: "All approvers signed off. CAPA is now Audit Ready.",
      });
    }

    setSelectedApprover(undefined);
  }

  return (
    <>
      <EightDShell capaId={capa.id} activeStep="signoff">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* ── Page header ───────────────────────────────────────────── */}
          <div>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", margin: "0 0 6px", letterSpacing: "0.18em" }}>
              {capa.id} · D7
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--fg-1)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Sign-Off
              </h1>
              {isAuditReady && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: "var(--success)",
                    background: "var(--success-soft)",
                    border: "1px solid color-mix(in srgb, var(--success) 38%, transparent)",
                    borderRadius: "var(--r-full)",
                    padding: "3px 10px",
                  }}
                >
                  <ShieldCheck size={11} />
                  Audit Ready
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
              Complete the e-signature approval chain for {capa.id}. Final closure requires quality score 80 or higher and all required approvals.
            </p>
          </div>

          {/* ── Score blocker ─────────────────────────────────────────── */}
          {(!isAuditReady || showScoreBlocker) && (
            <div style={{ display: "flex", gap: "10px", padding: "12px 14px", background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)", borderRadius: "var(--r-sm)" }}>
              <AlertTriangle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                  {showScoreBlocker ? "Approval attempt blocked" : "Sign-off blocked by quality score"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                  {showScoreBlocker
                    ? "Improve the CAPA score through D1–D6 before attempting electronic sign-off."
                    : "Quality score must reach 80 before this CAPA can be approved and closed as Audit Ready."}
                </p>
              </div>
            </div>
          )}

          {/* ── Final quality gate ────────────────────────────────────── */}
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line-1)", background: "var(--bg-3)", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: 0 }}>
                Final Quality Gate
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0" }}>
              {[
                {
                  label: "Final Score",
                  value: <ScorePill score={capa.score.total} />,
                },
                {
                  label: "Required Status",
                  value: (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: isAuditReady ? "var(--success)" : "var(--warning)", fontFamily: "var(--font-sans)" }}>
                      {isAuditReady ? "Audit Ready" : "Needs Improvement"}
                    </span>
                  ),
                },
                {
                  label: "Closure State",
                  value: (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}>
                      {isClosed ? "Closed" : allApproved ? "Ready to Close" : "Approval Pending"}
                    </span>
                  ),
                },
              ].map((cell, i) => (
                <div
                  key={cell.label}
                  style={{
                    padding: "14px 16px",
                    borderRight: i < 2 ? "1px solid var(--line-1)" : "none",
                  }}
                >
                  <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: "0 0 8px" }}>
                    {cell.label}
                  </p>
                  {cell.value}
                </div>
              ))}
            </div>
          </div>

          {/* ── Approval chain ────────────────────────────────────────── */}
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line-1)", background: "var(--bg-3)" }}>
              <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: 0 }}>
                Approval Chain
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {approvalChain.map((approver, index) => {
                const approval = getApprovalFor(capa.approvals, approver.personaId);
                const isApproved = approval?.decision === "approved";
                const isRejected = approval?.decision === "rejected";
                const canAct = isAuditReady && !isClosed && nextApprover?.personaId === approver.personaId;

                return (
                  <div
                    key={approver.personaId}
                    style={{
                      padding: "16px",
                      borderBottom: index < approvalChain.length - 1 ? "1px solid var(--line-1)" : "none",
                      background: isApproved ? "color-mix(in srgb, var(--success) 3%, transparent)" : isRejected ? "color-mix(in srgb, var(--danger) 3%, transparent)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: 0 }}>
                        {/* Status icon */}
                        <div style={{ paddingTop: "2px", flexShrink: 0 }}>
                          {isApproved ? (
                            <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                          ) : isRejected ? (
                            <XCircle size={18} style={{ color: "var(--danger)" }} />
                          ) : (
                            <Circle size={18} style={{ color: "var(--fg-4)" }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-1)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                            {index + 1}. {approver.name}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0 }}>{approver.role}</p>
                          {approval?.signedAt && (
                            <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--fg-4)", margin: "6px 0 0" }}>
                              Signed {formatDateTime(approval.signedAt)}
                            </p>
                          )}
                          {approval?.notes && (
                            <p style={{ fontSize: "12px", color: "var(--fg-3)", background: "var(--bg-3)", border: "1px solid var(--line-1)", borderRadius: "var(--r-sm)", padding: "6px 10px", margin: "8px 0 0", fontStyle: "italic" }}>
                              {approval.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: status badge + action */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        {isApproved && (
                          <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--success)", background: "var(--success-soft)", border: "1px solid color-mix(in srgb, var(--success) 38%, transparent)", borderRadius: "var(--r-full)", padding: "2px 8px" }}>
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)", borderRadius: "var(--r-full)", padding: "2px 8px" }}>
                            Rejected
                          </span>
                        )}
                        {!approval && (
                          <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-mono)", color: canAct ? "var(--warning)" : "var(--fg-4)", background: canAct ? "var(--warning-soft)" : "var(--bg-3)", border: `1px solid ${canAct ? "color-mix(in srgb, var(--warning) 38%, transparent)" : "var(--line-1)"}`, borderRadius: "var(--r-full)", padding: "2px 8px" }}>
                            {canAct ? "Awaiting" : "Pending"}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={!canAct}
                          onClick={() => openESignature(approver)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: canAct ? "var(--grad-brand)" : "var(--bg-4)",
                            color: canAct ? "var(--on-accent)" : "var(--fg-4)",
                            border: canAct ? "none" : "1px solid var(--line-2)",
                            borderRadius: "var(--r-sm)",
                            padding: "7px 14px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: canAct ? "pointer" : "not-allowed",
                            fontFamily: "var(--font-sans)",
                            opacity: canAct ? 1 : 0.5,
                          }}
                        >
                          <PenLine size={13} />
                          Approve with E-Sig
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Closed state banner ───────────────────────────────────── */}
          {isClosed && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                padding: "14px 16px",
                background: "color-mix(in srgb, var(--success) 6%, transparent)",
                border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                borderRadius: "var(--r-md)",
              }}
            >
              <ShieldCheck size={18} style={{ color: "var(--success)", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--success)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                  CAPA Closed as Audit Ready
                </p>
                <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0 }}>
                  All required approvers have signed off. {capa.id} is now marked Audit Ready and closed.
                </p>
              </div>
            </div>
          )}

        </div>
      </EightDShell>

      {/* ── E-signature modal ───────────────────────────────────────────── */}
      {selectedApprover && (
        <ESignatureModal
          approver={selectedApprover}
          onApprove={(notes) => submitDecision("approved", notes)}
          onReject={(notes) => submitDecision("rejected", notes)}
          onClose={() => setSelectedApprover(undefined)}
        />
      )}
    </>
  );
}
