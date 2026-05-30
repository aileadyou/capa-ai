import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, MessageSquareText, Save, ShieldAlert } from "lucide-react";
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
import { useAuditTrailStore, useCapaStore, useNotificationStore, useUIStore } from "@/store";
import type { CAPACase, NovaSuggestionStatus } from "@/types";
import {
  computeContainmentStrength,
  computeTotalQualityScore,
} from "@/utils/scoring";
import { formatCAPAType } from "@/utils/formatters";

const containmentSuggestions: Record<string, string> = {
  "CAPA-2026-0341":
    "Immediately pause filling operation, quarantine affected batch VAX-2406-A17, perform additional environmental monitoring, and notify QA Deviation for assessment before batch disposition.",
  "CAPA-2026-0089":
    "Immediately place the affected material transfer records under QA review, verify physical material reconciliation against inventory logs, and temporarily require supervisor review for all WH-02 transfer records until CAPA completion.",
  "CAPA-2026-0112":
    "Open QA complaint investigation, quarantine retained samples from lot VX-2405-22, review distribution status, and perform immediate retained sample visual inspection before determining whether additional market action is required.",
};

const replacementSuggestions: Record<string, string> = {
  "CAPA-2026-0341":
    "Restrict Grade A Fill Suite operation, place impacted vaccine batch under QA hold, repeat environmental monitoring, and require QA Deviation disposition before release.",
  "CAPA-2026-0089":
    "Hold affected transfer records from release use, reconcile material movement against inventory logs, and require QA reviewer approval for WH-02 transfer documentation until the investigation is complete.",
  "CAPA-2026-0112":
    "Quarantine complaint and retained samples, review lot distribution status, inspect retained samples immediately, and escalate to QA Complaint before any market action decision.",
};

const picOptions = [
  { value: "Andi Wijaya", label: "Andi Wijaya · Initiator" },
  { value: "Siti Rahmawati", label: "Siti Rahmawati · QA Deviation" },
  { value: "Bambang Saputra", label: "Bambang Saputra · Department Head" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini · Head of QA" },
  { value: "Dr. Ahmad Pratomo", label: "Dr. Ahmad Pratomo · SME" },
];

function getDefaultDueDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function getExistingContainment(capa: CAPACase) {
  const answer = capa.gateAnswers.find((entry) => entry.questionId === "containment")?.answer;
  if (!answer) return undefined;

  const [description, picLine, dueDateLine] = answer.split("\n");
  return {
    description,
    pic: picLine?.replace("PIC: ", "") ?? "",
    dueDate: dueDateLine?.replace("Due date: ", "").slice(0, 10) ?? getDefaultDueDate(),
  };
}

function evaluateContainment(description: string, pic: string, dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDate ? new Date(`${dueDate}T00:00:00`) : undefined;

  const checks = [
    {
      label: "Action description is at least 30 characters",
      passed: description.trim().length >= 30,
    },
    {
      label: "Immediate containment language",
      passed: /\b(hold|quarantine|restrict|pause|review|assessment|sample|investigation)\b/i.test(description),
    },
    {
      label: "PIC selected",
      passed: pic.trim().length > 0,
    },
    {
      label: "Due date is today or future",
      passed: Boolean(due && due >= today),
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed),
  };
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
            const isCurrent = step === "containment";
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

export function D2ContainmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const updateContainmentAction = useCapaStore((state) => state.updateContainmentAction);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const openNovaChat = useUIStore((state) => state.openNovaChat);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<NovaSuggestionStatus>("pending");

  const initialContainment = useMemo(() => {
    if (!capa) return { description: "", pic: "", dueDate: getDefaultDueDate() };
    return {
      description:
        getExistingContainment(capa)?.description ??
        containmentSuggestions[capa.id] ??
        "Immediately contain the affected product, system, or record scope and notify QA for documented assessment.",
      pic: getExistingContainment(capa)?.pic ?? "Siti Rahmawati",
      dueDate: getExistingContainment(capa)?.dueDate ?? getDefaultDueDate(),
    };
  }, [capa]);

  const [description, setDescription] = useState(initialContainment.description);
  const [pic, setPic] = useState(initialContainment.pic);
  const [dueDate, setDueDate] = useState(initialContainment.dueDate);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const containmentScore = computeContainmentStrength(description, Boolean(pic), dueDate);
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    containment: containmentScore,
  });
  const validation = evaluateContainment(description, pic, dueDate);
  const shouldShowBlocker = hasSubmitted && !validation.isValid;

  function handleSuggestionChange(status: NovaSuggestionStatus, content: string) {
    setSuggestionStatus(status);
    setDescription(content);
  }

  function saveContainment(advance: boolean) {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Containment action blocked", {
        description: "Add a clear action, PIC, and today-or-future due date before continuing.",
      });
      return;
    }

    updateContainmentAction(
      capa.id,
      {
        description: description.trim(),
        pic,
        dueDate,
      },
      previewScore,
    );
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "containment_added",
      action: `Containment action saved for ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });

    if (advance) {
      updateCurrentStep(capa.id, "rca");
      addNotification({
        recipientPersonaId: "qa_deviation",
        type: "capa_update",
        title: "Containment ready for review",
        description: `${capa.id} has a completed containment action and is ready for RCA review.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}/8d/rca`,
      });
      navigate(`/capa/${capa.id}/8d/rca`);
      return;
    }

    toast.success("Containment action saved", {
      description: `${capa.id} containment score is now ${containmentScore}/25.`,
    });
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
          <h1 className="text-2xl font-semibold tracking-tight">D2 Containment Action</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Define immediate containment for {capa.id}. Nova checks that the action is clear, accountable, and time-bound before RCA can begin.
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
          <NovaSuggestionCard
            id={`containment-${capa.id}`}
            capaId={capa.id}
            context="D2 Containment Action"
            content={containmentSuggestions[capa.id] ?? initialContainment.description}
            replacementContent={replacementSuggestions[capa.id]}
            status={suggestionStatus}
            onStatusChange={handleSuggestionChange}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Containment Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="containment-action">Action description</Label>
                <Textarea
                  id="containment-action"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  placeholder="Describe the immediate hold, quarantine, restriction, review, or assessment action."
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
                  <Label htmlFor="due-date">Due date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
              </div>

              {shouldShowBlocker && (
                <BlockerBanner
                  title="Containment action is incomplete"
                  message="Action must be at least 30 characters, include immediate containment intent, have a PIC, and use a date that is not in the past."
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
                <Button type="button" variant="outline" onClick={() => openNovaChat({ step: "containment", capaId: id })}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Ask Nova
                </Button>
                <Button type="button" variant="outline" onClick={() => saveContainment(false)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button type="button" onClick={() => saveContainment(true)}>
                  Continue to RCA
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={previewScore} />
          <NovaCoachTip>
            A strong containment action protects product, records, or customers immediately. It should say what is held or restricted, who owns it, when it is due, and what QA assessment gates release.
          </NovaCoachTip>
        </div>
      </div>
    </div>
  );
}
