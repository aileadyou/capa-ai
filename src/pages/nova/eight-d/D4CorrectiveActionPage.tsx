import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ListPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BlockerBanner } from "@/components/shared/BlockerBanner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NovaCoachTip } from "@/components/nova/NovaCoachTip";
import { NovaSuggestionCard } from "@/components/nova/NovaSuggestionCard";
import { ScoreSidebar } from "@/components/score/ScoreSidebar";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { CorrectiveAction, NovaSuggestionStatus } from "@/types";
import { computeActionEffectiveness, computeTotalQualityScore } from "@/utils/scoring";
import { formatCAPAType, formatDate } from "@/utils/formatters";

const caSuggestions: Record<string, string[]> = {
  "CAPA-2026-0341": [
    "Replace HEPA-FILL-02 filter, perform airflow requalification for the filling suite, and complete QA review of affected batch VAX-2406-A17 before release decision.",
    "Review environmental monitoring trend data and document QA product impact assessment for the affected vaccine filling batch.",
  ],
  "CAPA-2026-0089": [
    "Perform QA review of affected records, document reconciliation outcome, correct records according to GMP documentation procedure, and retrain involved operators and supervisors on real-time documentation requirements.",
    "Run retrospective spot check of recent WH-02 material transfer records and document any additional data integrity corrections.",
  ],
  "CAPA-2026-0112": [
    "Review complaint sample evidence, inspect retained samples from lot VX-2405-22, perform batch record review, assess final visual inspection reconciliation, and document QA batch impact assessment.",
    "Review the complaint response decision with QA Complaint and Production before issuing customer or market action conclusions.",
  ],
};

const caReplacements: Record<string, string> = {
  "CAPA-2026-0341":
    "Replace the affected HEPA filter, requalify the Grade A filling suite, and complete QA disposition for VAX-2406-A17 before any release decision.",
  "CAPA-2026-0089":
    "Correct affected transfer records, reconcile material movement, and retrain warehouse and supervisor roles on same-time verification expectations.",
  "CAPA-2026-0112":
    "Inspect complaint and retained samples, review batch and inspection records, and document a QA batch impact assessment for lot VX-2405-22.",
};

const picOptions = [
  { value: "Andi Wijaya", label: "Andi Wijaya · Initiator" },
  { value: "Siti Rahmawati", label: "Siti Rahmawati · QA Deviation" },
  { value: "Bambang Saputra", label: "Bambang Saputra · Department Head" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini · Head of QA" },
  { value: "Dr. Ahmad Pratomo", label: "Dr. Ahmad Pratomo · SME" },
];

function getDefaultDueDate() {
  const target = new Date();
  target.setDate(target.getDate() + 7);
  return target.toISOString().slice(0, 10);
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
            const isCurrent = step === "ca";
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

function evaluateCorrectiveAction(
  description: string,
  pic: string,
  dueDate: string,
  linkedRootCause: string,
  verificationMethod: string,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDate ? new Date(`${dueDate}T00:00:00`) : undefined;

  const checks = [
    {
      label: "Description is at least 30 characters",
      passed: description.trim().length >= 30,
    },
    {
      label: "PIC selected",
      passed: pic.trim().length > 0,
    },
    {
      label: "Due date is today or future",
      passed: Boolean(due && due >= today),
    },
    {
      label: "Linked to confirmed root cause",
      passed: linkedRootCause.trim().length >= 20,
    },
    {
      label: "Verification method defined",
      passed: verificationMethod.trim().length >= 10,
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed),
  };
}

function ActionList({ actions }: { actions: CorrectiveAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Corrective Action List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 && (
          <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
            No corrective actions have been added yet.
          </div>
        )}
        {actions.map((action) => (
          <div key={action.id} className="rounded border p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-mono text-xs text-primary">{action.id}</div>
                <p className="mt-1 text-sm leading-6">{action.description}</p>
              </div>
              <StatusBadge status={action.status} />
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">PIC</div>
                <div className="mt-1">{action.pic}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Due Date</div>
                <div className="mt-1">{formatDate(action.dueDate)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Verification</div>
                <div className="mt-1">{action.verificationMethod}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function D4CorrectiveActionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const addCA = useCapaStore((state) => state.addCA);
  const updateScore = useCapaStore((state) => state.updateScore);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [suggestionStatuses, setSuggestionStatuses] = useState<Record<string, NovaSuggestionStatus>>({});

  const confirmedRootCauses = useMemo(
    () => capa?.rca.confirmedRootCauses.filter(Boolean) ?? [],
    [capa],
  );
  const initialDescription = capa ? caSuggestions[capa.id]?.[0] ?? "" : "";
  const [description, setDescription] = useState(initialDescription);
  const [pic, setPic] = useState("Siti Rahmawati");
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [linkedRootCause, setLinkedRootCause] = useState(confirmedRootCauses[0] ?? "");
  const [verificationMethod, setVerificationMethod] = useState("QA review of implementation evidence and documented effectiveness check.");

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const currentActions = capa.correctiveActions;
  const draftAction = {
    description,
    linkedRootCause,
    verificationMethod,
  };
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    effectiveness: computeActionEffectiveness(
      [...currentActions, draftAction],
      capa.preventiveActions,
    ),
  });
  const validation = evaluateCorrectiveAction(description, pic, dueDate, linkedRootCause, verificationMethod);
  const validExistingActionExists = currentActions.some(
    (action) => action.description.length >= 30 && action.linkedRootCause && action.verificationMethod,
  );
  const shouldShowBlocker = hasSubmitted && !validation.isValid;

  function handleSuggestionChange(suggestionId: string, status: NovaSuggestionStatus, content: string) {
    setSuggestionStatuses((current) => ({ ...current, [suggestionId]: status }));
    setDescription(content);
  }

  function addCorrectiveAction() {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Corrective action blocked", {
        description: "Complete description, PIC, due date, linked root cause, and verification method.",
      });
      return undefined;
    }

    const newAction = addCA(capa.id, {
      description: description.trim(),
      pic,
      dueDate: `${dueDate}T17:00:00+07:00`,
      linkedRootCause,
      verificationMethod,
      status: "open",
      novaGenerated: true,
      novaSuggestionStatus: "accepted",
    });

    const nextActions = [...currentActions, newAction];
    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness(nextActions, capa.preventiveActions),
    });
    updateScore(capa.id, nextScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "corrective_action_added",
      action: `Corrective action ${newAction.id} was added to ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });

    toast.success("Corrective action added", {
      description: `${newAction.id} is now available in CAPA detail and the global action store.`,
    });

    return newAction;
  }

  function continueToPreventiveAction() {
    setHasSubmitted(true);

    const hasValidAction = validExistingActionExists || validation.isValid;
    if (!hasValidAction) {
      toast.error("Corrective action is required", {
        description: "Add at least one corrective action linked to the confirmed root cause.",
      });
      return;
    }

    if (!validExistingActionExists) {
      const added = addCorrectiveAction();
      if (!added) return;
    }

    updateCurrentStep(capa.id, "pa");
    navigate(`/capa/${capa.id}/8d/pa`);
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
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">D4 Corrective Action</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Define corrective actions that address the confirmed root cause, assign ownership, and specify how effectiveness will be verified.
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
          <ActionList actions={currentActions} />

          <div className="space-y-3">
            {(caSuggestions[capa.id] ?? [initialDescription]).map((suggestion, index) => {
              const suggestionId = `ca-${capa.id}-${index + 1}`;
              return (
                <NovaSuggestionCard
                  key={suggestionId}
                  id={suggestionId}
                  capaId={capa.id}
                  context={`D4 Corrective Action Option ${index + 1}`}
                  content={suggestion}
                  replacementContent={caReplacements[capa.id] ?? suggestion}
                  status={suggestionStatuses[suggestionId] ?? "pending"}
                  onStatusChange={(status, content) => handleSuggestionChange(suggestionId, status, content)}
                />
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListPlus className="h-4 w-4 text-primary" />
                Add Corrective Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ca-description">Description</Label>
                <Textarea
                  id="ca-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>PIC</Label>
                  <Select value={pic} onValueChange={setPic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PIC" />
                    </SelectTrigger>
                    <SelectContent>
                      {picOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ca-due-date">Due date</Label>
                  <Input
                    id="ca-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Linked root cause</Label>
                <Select value={linkedRootCause} onValueChange={setLinkedRootCause}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select confirmed root cause" />
                  </SelectTrigger>
                  <SelectContent>
                    {confirmedRootCauses.map((rootCause) => (
                      <SelectItem key={rootCause} value={rootCause}>
                        {rootCause}
                      </SelectItem>
                    ))}
                    {confirmedRootCauses.length === 0 && (
                      <SelectItem value="missing-root-cause" disabled>
                        Complete D3 RCA first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-method">Verification method</Label>
                <Textarea
                  id="verification-method"
                  value={verificationMethod}
                  onChange={(event) => setVerificationMethod(event.target.value)}
                  rows={3}
                />
              </div>

              {shouldShowBlocker && (
                <BlockerBanner
                  title="Corrective action is incomplete"
                  message="Each CA needs a description, PIC, due date, linked root cause, and verification method before it can be added or advanced."
                />
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {validation.checks.map((check) => (
                  <div key={check.label} className="flex gap-2 rounded border p-3 text-sm">
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-ready" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={check.passed ? "" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                <Button type="button" variant="outline" onClick={addCorrectiveAction}>
                  <Save className="mr-2 h-4 w-4" />
                  Add CA
                </Button>
                <Button type="button" onClick={continueToPreventiveAction}>
                  Continue to Preventive Action
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={previewScore} />
          <NovaCoachTip>
            Corrective action should directly remove or control the confirmed root cause. Link it explicitly, assign an accountable PIC, set a due date, and define how QA can verify the fix.
          </NovaCoachTip>
        </div>
      </div>
    </div>
  );
}
