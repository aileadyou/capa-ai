import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ListChecks, Save } from "lucide-react";
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
import type { NovaSuggestionStatus, PreventiveAction } from "@/types";
import { computeActionEffectiveness, computeTotalQualityScore } from "@/utils/scoring";
import { formatCAPAType, formatDate } from "@/utils/formatters";

const paSuggestions: Record<string, string[]> = {
  "CAPA-2026-0341": [
    "Revise SOP PM-HEPA-001 to require 12-month HEPA filter replacement for Grade A filling areas and add automated maintenance reminders 60 days before due date.",
    "Add quarterly QA and Engineering review of classified-area airflow deterioration signals and HEPA replacement trend triggers.",
  ],
  "CAPA-2026-0089": [
    "Revise the material transfer SOP to require same-time second-person verification, add an end-of-shift documentation checklist, and run weekly QA spot checks for three months.",
    "Add documentation timeliness KPI review for WH-02 transfer records during monthly quality meetings.",
  ],
  "CAPA-2026-0112": [
    "Update visual inspection reconciliation procedure to define escalation thresholds for reject variance, add QA reviewer checklist item, and retrain visual inspection reviewers and batch release QA personnel.",
    "Trend particulate complaints and visual inspection reconciliation signals by lot family during monthly quality review.",
  ],
};

const paReplacements: Record<string, string> = {
  "CAPA-2026-0341":
    "Revise the HEPA preventive maintenance SOP to require 12-month Grade A/B replacement, automated reminders, and QA escalation for overdue replacement.",
  "CAPA-2026-0089":
    "Update transfer documentation controls with same-time verifier initials, supervisor end-shift checklist, and weekly QA spot checks for three months.",
  "CAPA-2026-0112":
    "Strengthen visual inspection reconciliation escalation thresholds and require QA reviewer confirmation before batch release closure.",
};

const picOptions = [
  { value: "Andi Wijaya", label: "Andi Wijaya · Initiator" },
  { value: "Siti Rahmawati", label: "Siti Rahmawati · QA Deviation" },
  { value: "Bambang Saputra", label: "Bambang Saputra · Department Head" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini · Head of QA" },
  { value: "Dr. Ahmad Pratomo", label: "Dr. Ahmad Pratomo · SME" },
];

function getDefaultTargetDate() {
  const target = new Date();
  target.setDate(target.getDate() + 21);
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
            const isCurrent = step === "pa";
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

function evaluatePreventiveAction(description: string, pic: string, targetDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = targetDate ? new Date(`${targetDate}T00:00:00`) : undefined;

  const checks = [
    {
      label: "Description is at least 30 characters",
      passed: description.trim().length >= 30,
    },
    {
      label: "Prevention is forward-looking",
      passed: /\b(revise|update|add|trend|train|checklist|review|escalation|reminder|spot check)\b/i.test(description),
    },
    {
      label: "PIC selected",
      passed: pic.trim().length > 0,
    },
    {
      label: "Target date is in the future",
      passed: Boolean(target && target > today),
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed),
  };
}

function ActionList({ actions }: { actions: PreventiveAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preventive Action List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 && (
          <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
            No preventive actions have been added yet.
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
                <div className="text-xs font-medium uppercase text-muted-foreground">Target Date</div>
                <div className="mt-1">{formatDate(action.targetDate)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Nova Generated</div>
                <div className="mt-1">{action.novaGenerated ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function D5PreventiveActionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const addPA = useCapaStore((state) => state.addPA);
  const updateScore = useCapaStore((state) => state.updateScore);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [suggestionStatuses, setSuggestionStatuses] = useState<Record<string, NovaSuggestionStatus>>({});
  const initialDescription = capa ? paSuggestions[capa.id]?.[0] ?? "" : "";
  const [description, setDescription] = useState(initialDescription);
  const [pic, setPic] = useState("Siti Rahmawati");
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate());

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const currentActions = capa.preventiveActions;
  const draftAction = {
    description,
    targetDate: `${targetDate}T17:00:00+07:00`,
  };
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    effectiveness: computeActionEffectiveness(capa.correctiveActions, [...currentActions, draftAction]),
  });
  const validation = evaluatePreventiveAction(description, pic, targetDate);
  const validExistingActionExists = currentActions.some(
    (action) => action.description.length >= 30 && new Date(action.targetDate).getTime() > Date.now(),
  );
  const shouldShowBlocker = hasSubmitted && !validation.isValid;

  function handleSuggestionChange(suggestionId: string, status: NovaSuggestionStatus, content: string) {
    setSuggestionStatuses((current) => ({ ...current, [suggestionId]: status }));
    setDescription(content);
  }

  function addPreventiveAction() {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Preventive action blocked", {
        description: "Complete a forward-looking description, PIC, and future target date.",
      });
      return undefined;
    }

    const newAction = addPA(capa.id, {
      description: description.trim(),
      pic,
      targetDate: `${targetDate}T17:00:00+07:00`,
      status: "open",
      novaGenerated: true,
      novaSuggestionStatus: "accepted",
    });

    const nextActions = [...currentActions, newAction];
    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness(capa.correctiveActions, nextActions),
    });
    updateScore(capa.id, nextScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "preventive_action_added",
      action: `Preventive action ${newAction.id} was added to ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });

    toast.success("Preventive action added", {
      description: `${newAction.id} is now available in CAPA detail and the global action store.`,
    });

    return newAction;
  }

  function continueToVerification() {
    setHasSubmitted(true);

    const hasValidAction = validExistingActionExists || validation.isValid;
    if (!hasValidAction) {
      toast.error("Preventive action is required", {
        description: "Add at least one preventive action with a future target date.",
      });
      return;
    }

    if (!validExistingActionExists) {
      const added = addPreventiveAction();
      if (!added) return;
    }

    updateCurrentStep(capa.id, "verification");
    navigate(`/capa/${capa.id}/8d/verification`);
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
          <h1 className="text-2xl font-semibold tracking-tight">D5 Preventive Action</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Define preventive actions that reduce recurrence risk and strengthen the quality system beyond the immediate correction.
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
            {(paSuggestions[capa.id] ?? [initialDescription]).map((suggestion, index) => {
              const suggestionId = `pa-${capa.id}-${index + 1}`;
              return (
                <NovaSuggestionCard
                  key={suggestionId}
                  id={suggestionId}
                  capaId={capa.id}
                  context={`D5 Preventive Action Option ${index + 1}`}
                  content={suggestion}
                  replacementContent={paReplacements[capa.id] ?? suggestion}
                  status={suggestionStatuses[suggestionId] ?? "pending"}
                  onStatusChange={(status, content) => handleSuggestionChange(suggestionId, status, content)}
                />
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-primary" />
                Add Preventive Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pa-description">Description</Label>
                <Textarea
                  id="pa-description"
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
                  <Label htmlFor="pa-target-date">Target date</Label>
                  <Input
                    id="pa-target-date"
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                  />
                </div>
              </div>

              {shouldShowBlocker && (
                <BlockerBanner
                  title="Preventive action is incomplete"
                  message="Each PA needs a forward-looking description, PIC, and target date in the future before continuing."
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
                <Button type="button" variant="outline" onClick={addPreventiveAction}>
                  <Save className="mr-2 h-4 w-4" />
                  Add PA
                </Button>
                <Button type="button" onClick={continueToVerification}>
                  Continue to Verification
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={previewScore} />
          <NovaCoachTip>
            Preventive action should make recurrence harder. Favor SOP changes, checklist controls, training with effectiveness checks, trend reviews, reminder controls, and escalation thresholds.
          </NovaCoachTip>
        </div>
      </div>
    </div>
  );
}
