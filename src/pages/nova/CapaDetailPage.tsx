import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
  ListPlus,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { ScorePill } from "@/components/shared/ScorePill";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ScoreSidebar } from "@/components/score/ScoreSidebar";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore } from "@/store";
import { getSimilarityResults } from "@/services/novaService";
import type {
  ActionStatus,
  CAPACase,
  CorrectiveAction,
  EightDStep,
  PreFillContext,
  PreventiveAction,
} from "@/types";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";

const stepLabels: Record<EightDStep, string> = {
  problem: "D1 Problem",
  containment: "D2 Containment",
  rca: "D3 RCA",
  ca: "D4 Corrective Action",
  pa: "D5 Preventive Action",
  verification: "D6 Verification",
  signoff: "D7 Sign-off",
};

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === "") return null;

  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function getSourceSystem(prefill: PreFillContext) {
  return prefill.source === "Bizzmine-Complaint" ? "Bizzmine Complaint" : prefill.source;
}

function SourceDataPanel({ prefill }: { prefill: PreFillContext }) {
  if (prefill.source === "Bizzmine") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Data</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoRow label="Deviation ID" value={prefill.deviationId} />
          <InfoRow label="Reported" value={formatDateTime(prefill.reportedAt)} />
          <InfoRow label="Occurred" value={formatDateTime(prefill.occurredAt)} />
          <InfoRow label="Area" value={prefill.location.area} />
          <InfoRow label="Line" value={prefill.location.line} />
          <InfoRow label="Equipment" value={prefill.location.equipmentId} />
          <InfoRow label="Initiator" value={`${prefill.initiator.name} · ${prefill.initiator.role}`} />
          <InfoRow label="Affected Batches" value={prefill.affectedBatches.join(", ")} />
          <InfoRow label="SOP References" value={prefill.sopReferences.join(", ")} />
          <div className="md:col-span-2 xl:col-span-3">
            <InfoRow label="Initial Observation" value={prefill.initialObservation} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (prefill.source === "Q100+") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Data</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoRow label="Finding ID" value={prefill.findingId} />
          <InfoRow label="Audit ID" value={prefill.auditId} />
          <InfoRow label="Audit Type" value={prefill.auditType} />
          <InfoRow label="Audit Date" value={formatDateTime(prefill.auditDate)} />
          <InfoRow label="Auditor" value={`${prefill.auditor.name} · ${prefill.auditor.organization}`} />
          <InfoRow label="Auditee" value={`${prefill.auditee.department} · ${prefill.auditee.contactPerson}`} />
          <InfoRow label="Category" value={prefill.findingCategory} />
          <InfoRow label="Regulation" value={prefill.regulationReference.join(", ")} />
          <InfoRow label="SOP References" value={prefill.sopReferences.join(", ")} />
          <div className="md:col-span-2 xl:col-span-3">
            <InfoRow label="Finding Description" value={prefill.findingDescription} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Source Data</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoRow label="Complaint ID" value={prefill.complaintId} />
        <InfoRow label="Reported" value={formatDateTime(prefill.reportedAt)} />
        <InfoRow label="Customer" value={`${prefill.customer.name} · ${prefill.customer.type}`} />
        <InfoRow label="Product" value={prefill.product.name} />
        <InfoRow label="Lot Number" value={prefill.product.lotNumber} />
        <InfoRow label="Expiry Date" value={prefill.product.expiryDate} />
        <InfoRow label="Complaint Type" value={prefill.complaintType} />
        <div className="md:col-span-2 xl:col-span-3">
          <InfoRow label="Complaint Description" value={prefill.description} />
        </div>
      </CardContent>
    </Card>
  );
}

function NovaSummary({ capa }: { capa: CAPACase }) {
  const rootCause = capa.rca.confirmedRootCauses[0] ?? "Root cause confirmation is still in progress.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Nova Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6">
        <p>{capa.impact.rationale}</p>
        <Separator />
        <InfoRow label="Confirmed Root Cause" value={rootCause} />
        <InfoRow label="RCA Method" value={capa.rca.method.split("_").join(" ")} />
      </CardContent>
    </Card>
  );
}

function SimilarCases({ capa }: { capa: CAPACase }) {
  const similarCases = getSimilarityResults(capa.rca.confirmedRootCauses[0] ?? capa.title).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Similar Cases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {similarCases.map((caseItem) => (
          <div key={`${caseItem.capaId}-${caseItem.deviationId}`} className="rounded border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-xs text-primary">{caseItem.capaId}</div>
              <div className="text-xs font-medium">{caseItem.similarityScore}% match</div>
            </div>
            <p className="mt-2 text-sm">{caseItem.rootCause}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {caseItem.outcome} · {caseItem.year}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Timeline({ capa }: { capa: CAPACase }) {
  const items = [
    {
      label: "Source imported",
      description: `${capa.findingId} imported from ${getSourceSystem(capa.preFill)}.`,
      date: capa.createdAt,
      active: true,
    },
    {
      label: "Impact classified",
      description: `Nova classified this as ${capa.impact.severity}.`,
      date: capa.impact.computedAt,
      active: true,
    },
    {
      label: "Investigation workflow",
      description: `Current step: ${stepLabels[capa.currentStep]}.`,
      date: capa.updatedAt,
      active: capa.status !== "draft",
    },
    {
      label: "Audit Ready closure",
      description: capa.status === "closed" ? "CAPA is closed." : "Closure is pending.",
      date: capa.updatedAt,
      active: capa.status === "closed",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={item.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              {item.active ? (
                <CheckCircle2 className="h-4 w-4 text-status-ready" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              {index < items.length - 1 && <div className="mt-1 h-8 w-px bg-border" />}
            </div>
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.date)}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EightDWorkflow({ capa }: { capa: CAPACase }) {
  const currentIndex = eightDSteps.indexOf(capa.currentStep);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">8D Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {eightDSteps.map((step, index) => {
            const isComplete = index < currentIndex || capa.status === "closed";
            const isCurrent = step === capa.currentStep;

            return (
              <Link
                key={step}
                to={`/capa/${capa.id}/8d/${step}`}
                className="rounded border bg-card p-3 transition hover:border-primary/60 hover:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-status-ready" />
                  ) : (
                    <Circle className={isCurrent ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
                  )}
                  <div className="text-sm font-medium">{stepLabels[step]}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {isCurrent ? "Current step" : isComplete ? "Completed" : "Pending"}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 rounded border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Continue from {stepLabels[capa.currentStep]}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              This opens the active workflow route for the selected CAPA.
            </p>
          </div>
          <Button asChild>
            <Link to={`/capa/${capa.id}/8d/${capa.currentStep}`}>
              Continue Workflow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionList({
  title,
  emptyText,
  actions,
  dateLabel,
}: {
  title: string;
  emptyText: string;
  actions: Array<CorrectiveAction | PreventiveAction>;
  dateLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 && <div className="text-sm text-muted-foreground">{emptyText}</div>}
        {actions.map((action) => {
          const date = "dueDate" in action ? action.dueDate : action.targetDate;
          return (
            <div key={action.id} className="rounded border p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-mono text-xs text-primary">{action.id}</div>
                  <p className="mt-1 text-sm leading-6">{action.description}</p>
                </div>
                <StatusBadge status={action.status as Exclude<ActionStatus, "overdue"> | "overdue"} />
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <InfoRow label="PIC" value={action.pic} />
                <InfoRow label={dateLabel} value={formatDate(date)} />
                <InfoRow label="Nova Generated" value={action.novaGenerated ? "Yes" : "No"} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function CapaDetailPage() {
  const { id } = useParams();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const finding = useCapaStore((state) =>
    capa ? state.findings.find((record) => record.id === capa.findingId) : undefined,
  );
  const auditEvents = useAuditTrailStore((state) => (id ? state.getEventsByCAPA(id) : []));

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <SourceBadge source={getSourceSystem(capa.preFill)} />
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {formatCAPAType(capa.type)}
            </Badge>
            <SeverityBadge severity={capa.impact.severity} />
            <StatusBadge status={capa.status} />
            <ScorePill score={capa.score.total} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{capa.id}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{capa.title}</p>
        </div>
        <Button asChild>
          <Link to={`/capa/${capa.id}/8d/${capa.currentStep}`}>
            Continue Workflow
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <InfoRow label="CAPA ID" value={capa.id} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Type" value={formatCAPAType(capa.type)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Department" value={capa.department} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Current Step" value={stepLabels[capa.currentStep]} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Updated" value={formatDateTime(capa.updatedAt)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Tabs defaultValue="overview" className="min-w-0">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow">8D Workflow</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <SourceDataPanel prefill={capa.preFill} />
            <div className="grid gap-4 xl:grid-cols-2">
              <NovaSummary capa={capa} />
              <SimilarCases capa={capa} />
            </div>
            <Timeline capa={capa} />
            {finding && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Linked Finding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-mono text-xs text-primary">{finding.id}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{finding.shortDescription}</p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/findings/${finding.id}`}>Open Finding</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="workflow" className="mt-4">
            <EightDWorkflow capa={capa} />
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {auditEvents.map((event) => (
                  <div key={event.id} className="rounded border p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-medium">{event.action}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {event.actorName} · {event.actorRole} · {event.domain}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</div>
                    </div>
                    {event.novaMetadata && (
                      <div className="mt-3 rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                        {event.novaMetadata.modelName} {event.novaMetadata.modelVersion} · confidence{" "}
                        {event.novaMetadata.confidenceScore}%
                      </div>
                    )}
                  </div>
                ))}
                {auditEvents.length === 0 && (
                  <div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No CAPA-specific audit events have been captured yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:justify-end">
              <Button asChild variant="outline">
                <Link to={`/capa/${capa.id}/8d/ca`}>
                  <ListPlus className="mr-2 h-4 w-4" />
                  Add Corrective Action
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/capa/${capa.id}/8d/pa`}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Add Preventive Action
                </Link>
              </Button>
            </div>
            <ActionList
              title="Corrective Actions"
              emptyText="No corrective actions have been added yet."
              actions={capa.correctiveActions}
              dateLabel="Due Date"
            />
            <ActionList
              title="Preventive Actions"
              emptyText="No preventive actions have been added yet."
              actions={capa.preventiveActions}
              dateLabel="Target Date"
            />
          </TabsContent>
        </Tabs>

        <ScoreSidebar score={capa.score} />
      </div>
    </div>
  );
}
