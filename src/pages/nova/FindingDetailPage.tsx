import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ScorePill } from "@/components/shared/ScorePill";
import NotFound from "@/pages/NotFound";
import { useCapaStore } from "@/store";
import type { CAPACase, PreFillContext } from "@/types";
import type { Finding } from "@/types/finding";
import { formatCAPAType, formatDateTime } from "@/utils/formatters";

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function SourcePrefillPanel({ prefill, finding }: { prefill?: PreFillContext; finding: Finding }) {
  if (!prefill) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Source" value={finding.source} />
          <InfoRow label="Description" value={finding.shortDescription} />
          <InfoRow label="Department" value={finding.department} />
          <InfoRow label="Reported Date" value={formatDateTime(finding.reportedAt)} />
        </CardContent>
      </Card>
    );
  }

  if (prefill.source === "Bizzmine") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imported Source Data</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoRow label="Deviation ID" value={prefill.deviationId} />
          <InfoRow label="Reported Date" value={formatDateTime(prefill.reportedAt)} />
          <InfoRow label="Occurred Date" value={formatDateTime(prefill.occurredAt)} />
          <InfoRow label="Area" value={prefill.location.area} />
          <InfoRow label="Line" value={prefill.location.line} />
          <InfoRow label="Equipment ID" value={prefill.location.equipmentId} />
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
          <CardTitle className="text-base">Imported Source Data</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoRow label="Finding ID" value={prefill.findingId} />
          <InfoRow label="Audit ID" value={prefill.auditId} />
          <InfoRow label="Audit Type" value={prefill.auditType} />
          <InfoRow label="Audit Date" value={formatDateTime(prefill.auditDate)} />
          <InfoRow label="Auditor" value={`${prefill.auditor.name} · ${prefill.auditor.organization}`} />
          <InfoRow label="Auditee" value={`${prefill.auditee.department} · ${prefill.auditee.contactPerson}`} />
          <InfoRow label="Finding Category" value={prefill.findingCategory} />
          <InfoRow label="Regulation Reference" value={prefill.regulationReference.join(", ")} />
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
        <CardTitle className="text-base">Imported Source Data</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoRow label="Complaint ID" value={prefill.complaintId} />
        <InfoRow label="Reported Date" value={formatDateTime(prefill.reportedAt)} />
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

function Timeline({ finding, capa }: { finding: Finding; capa?: CAPACase }) {
  const items = [
    {
      label: "Finding reported",
      description: `${finding.id} was imported from ${finding.source}.`,
      active: true,
    },
    {
      label: "CAPA linked",
      description: capa ? `${capa.id} is connected to this finding.` : "CAPA has not been created yet.",
      active: Boolean(capa),
    },
    {
      label: "Investigation started",
      description: capa ? `Current step is ${capa.currentStep}.` : "Create CAPA with Nova to start investigation.",
      active: Boolean(capa && capa.status !== "draft"),
    },
    {
      label: "Audit Ready closure",
      description: capa?.status === "closed" ? "CAPA was closed as Audit Ready." : "Closure is pending.",
      active: capa?.status === "closed",
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
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FindingDetailPage() {
  const { id } = useParams();
  const finding = useCapaStore((state) =>
    id ? state.findings.find((record) => record.id === id) : undefined,
  );
  const capa = useCapaStore((state) =>
    finding
      ? state.capas.find((record) => record.id === finding.linkedCapaId || record.findingId === finding.id)
      : undefined,
  );

  if (!finding) {
    return <NotFound message={`Finding ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const createCAPAUrl = `/capa/new?type=${finding.type}&sourceId=${finding.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <SourceBadge source={finding.source} />
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{finding.id}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            {finding.shortDescription}
          </p>
        </div>
        {capa ? (
          <Button asChild>
            <Link to={`/capa/${capa.id}`}>
              Open Linked CAPA
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to={createCAPAUrl}>
              <Plus className="mr-2 h-4 w-4" />
              Create CAPA with Nova
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Type" value={formatCAPAType(finding.type)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Department" value={finding.department} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Reported Date" value={formatDateTime(finding.reportedAt)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <InfoRow label="Linked CAPA" value={capa?.id ?? "Not created"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <SourcePrefillPanel prefill={capa?.preFill} finding={finding} />

          {capa && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked CAPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link className="font-semibold text-primary hover:underline" to={`/capa/${capa.id}`}>
                      {capa.id}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{capa.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={capa.status} />
                      <ScorePill score={capa.score.total} />
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/capa/${capa.id}`}>View CAPA</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Finding Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Source System" value={finding.source} />
              <Separator />
              <InfoRow label="Severity" value={finding.severity} />
              <Separator />
              <InfoRow label="Status" value={finding.status.split("_").join(" ")} />
              <Separator />
              <InfoRow label="CAPA Type" value={formatCAPAType(finding.type)} />
            </CardContent>
          </Card>

          <Timeline finding={finding} capa={capa} />
        </div>
      </div>
    </div>
  );
}
