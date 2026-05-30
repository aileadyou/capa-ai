import { useMemo, useState } from "react";
import { fireConfetti } from "@/utils/confetti";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, MessageSquareText, PenLine, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BlockerBanner } from "@/components/shared/BlockerBanner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ScorePill } from "@/components/shared/ScorePill";
import { ScoreSidebar } from "@/components/score/ScoreSidebar";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore, useNotificationStore, useUIStore } from "@/store";
import type { ApprovalEvent, CAPACase } from "@/types";
import type { PersonaID } from "@/types/persona";
import { formatCAPAType, formatDateTime } from "@/utils/formatters";

interface Approver {
  personaId: PersonaID;
  name: string;
  role: string;
}

const approvers: Record<PersonaID, Omit<Approver, "personaId">> = {
  initiator: {
    name: "Andi Wijaya",
    role: "Initiator",
  },
  qa_deviation: {
    name: "Siti Rahmawati",
    role: "QA Deviation / QA Compliance / QA Complaint",
  },
  head_of_dept: {
    name: "Bambang Saputra",
    role: "Department Head",
  },
  head_of_qa: {
    name: "Dewi Anggraini",
    role: "Head of QA",
  },
  sme: {
    name: "Dr. Ahmad Pratomo",
    role: "SME Microbiology",
  },
};

function getApprovalChain(capa: CAPACase): Approver[] {
  const chain: PersonaID[] =
    capa.type === "complaint"
      ? ["qa_deviation", "head_of_dept", "head_of_qa"]
      : ["head_of_dept", "qa_deviation", "head_of_qa"];

  if (capa.impact.severity === "Critical") {
    chain.splice(chain.length - 1, 0, "sme");
  }

  return chain.map((personaId) => ({
    personaId,
    ...approvers[personaId],
  }));
}

function WorkflowSteps({ capaId }: { capaId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">8D Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-7">
          {eightDSteps.map((step, index) => {
            const isCurrent = step === "signoff";
            return (
              <Link
                key={step}
                to={`/capa/${capaId}/8d/${step}`}
                className={`rounded border px-3 py-2 text-xs font-medium transition ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                D{index + 1} {step === "ca" ? "CA" : step === "pa" ? "PA" : step}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getApprovalFor(approvals: ApprovalEvent[], personaId: PersonaID) {
  return approvals.find((approval) => approval.approverPersonaId === personaId);
}

export function D7SignOffPage() {
  const { id } = useParams();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const approveSignOff = useCapaStore((state) => state.approveSignOff);
  const closeCAPA = useCapaStore((state) => state.closeCAPA);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const openNovaChat = useUIStore((state) => state.openNovaChat);
  const [selectedApprover, setSelectedApprover] = useState<Approver | undefined>();
  const [notes, setNotes] = useState("");
  const [hasTriedApproval, setHasTriedApproval] = useState(false);

  const approvalChain = useMemo(() => (capa ? getApprovalChain(capa) : []), [capa]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const isAuditReady = capa.score.total >= 80;
  const isClosed = capa.status === "closed";
  const approvedIds = new Set(
    capa.approvals
      .filter((approval) => approval.decision === "approved")
      .map((approval) => approval.approverPersonaId),
  );
  const nextApprover = approvalChain.find((approver) => !approvedIds.has(approver.personaId));
  const allApproved = approvalChain.every((approver) => approvedIds.has(approver.personaId));
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
    setNotes("");
  }

  function submitDecision(decision: "approved" | "rejected") {
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
    if (decision === "approved") {
      nextApprovedIds.add(selectedApprover.personaId);
    }
    const upcomingApprover = approvalChain.find((approver) => !nextApprovedIds.has(approver.personaId));

    if (decision === "rejected") {
      addNotification({
        recipientPersonaId: "qa_deviation",
        type: "rejected",
        title: "CAPA sign-off rejected",
        description: `${selectedApprover.name} rejected ${capa.id}. Review notes and resubmit.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}/8d/signoff`,
      });
      toast.error("CAPA rejected", {
        description: `${selectedApprover.name} rejected ${capa.id}.`,
      });
    } else if (upcomingApprover) {
      addNotification({
        recipientPersonaId: upcomingApprover.personaId,
        type: "approval",
        title: "CAPA awaiting your approval",
        description: `${capa.id} is ready for ${upcomingApprover.name} to approve.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}/8d/signoff`,
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
      toast.success("Approval recorded", {
        description: `Notification sent to ${upcomingApprover.name}.`,
      });
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
      fireConfetti();
    }

    setSelectedApprover(undefined);
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <SeverityBadge severity={capa.impact.severity} />
            <StatusBadge status={capa.status} />
            <span className="rounded border bg-muted px-2.5 py-0.5 text-xs font-medium">
              {formatCAPAType(capa.type)}
            </span>
            {isAuditReady && (
              <Badge variant="outline" className="gap-1.5 border-status-ready/30 bg-status-ready/10 text-status-ready">
                <ShieldCheck className="h-3 w-3" />
                Audit Ready
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">D7 Sign-Off</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Complete the e-signature approval chain for {capa.id}. Final closure requires quality score 80 or higher and all required approvals.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/capa/${capa.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CAPA
          </Link>
        </Button>
      </div>

      <WorkflowSteps capaId={capa.id} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {!isAuditReady && (
            <BlockerBanner
              title="Sign-off blocked by quality score"
              message="Quality score must reach 80 before this CAPA can be approved and closed as Audit Ready."
            />
          )}
          {showScoreBlocker && (
            <BlockerBanner
              title="Approval attempt blocked"
              message="Improve the CAPA score through D1-D6 before attempting electronic sign-off."
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Final Quality Gate
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded border p-3">
                <div className="text-xs font-medium uppercase text-muted-foreground">Final Score</div>
                <div className="mt-2">
                  <ScorePill score={capa.score.total} />
                </div>
              </div>
              <div className="rounded border p-3">
                <div className="text-xs font-medium uppercase text-muted-foreground">Required Status</div>
                <div className="mt-2 text-sm font-medium">{isAuditReady ? "Audit Ready" : "Needs Improvement"}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-xs font-medium uppercase text-muted-foreground">Closure State</div>
                <div className="mt-2 text-sm font-medium">{isClosed ? "Closed" : allApproved ? "Ready to Close" : "Approval Pending"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvalChain.map((approver, index) => {
                const approval = getApprovalFor(capa.approvals, approver.personaId);
                const isApproved = approval?.decision === "approved";
                const isRejected = approval?.decision === "rejected";
                const canAct = isAuditReady && !isClosed && nextApprover?.personaId === approver.personaId;

                return (
                  <div key={approver.personaId} className="rounded border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <div className="pt-0.5">
                          {isApproved ? (
                            <CheckCircle2 className="h-5 w-5 text-status-ready" />
                          ) : isRejected ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {index + 1}. {approver.name}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{approver.role}</div>
                          {approval?.signedAt && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Signed {formatDateTime(approval.signedAt)}
                            </div>
                          )}
                          {approval?.notes && (
                            <p className="mt-2 rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                              {approval.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isApproved && <StatusBadge status="completed" />}
                        {isRejected && (
                          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                            Rejected
                          </Badge>
                        )}
                        {!approval && <StatusBadge status={canAct ? "in_progress" : "open"} />}
                        <Button
                          type="button"
                          size="sm"
                          disabled={!canAct}
                          onClick={() => openESignature(approver)}
                        >
                          <PenLine className="mr-2 h-4 w-4" />
                          Approve with E-Signature
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={capa.score} />
          <Button variant="outline" className="w-full" onClick={() => openNovaChat({ step: "signoff", capaId: capa.id })}>
            <MessageSquareText className="mr-2 h-4 w-4" />
            Ask Nova
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedApprover)} onOpenChange={(open) => !open && setSelectedApprover(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Signature</DialogTitle>
            <DialogDescription>
              {selectedApprover?.name} will sign this CAPA decision with a mocked electronic signature and timestamp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded border bg-muted/30 p-3 text-sm">
              <div className="font-medium">{selectedApprover?.name}</div>
              <div className="text-muted-foreground">{selectedApprover?.role}</div>
              <div className="mt-2 text-xs text-muted-foreground">{new Date().toLocaleString()}</div>
            </div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Approval or rejection notes"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => submitDecision("rejected")}>
              Reject
            </Button>
            <Button onClick={() => submitDecision("approved")}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
