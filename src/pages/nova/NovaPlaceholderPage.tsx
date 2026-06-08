import { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FlaskConical,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  EightDStepRoute,
  eightDSteps,
  goldenCapaIds,
  goldenFindingIds,
} from "@/routes";
import NotFound from "@/pages/NotFound";

type PlaceholderAction =
  | { label: string; to: string; toast?: never }
  | { label: string; toast: string; to?: never };

interface NovaPlaceholderPageProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  focusItems?: string[];
  primaryAction?: PlaceholderAction;
  pageKind?: "standard" | "finding-detail" | "capa-detail" | "eight-d-step";
  eightDStep?: EightDStepRoute;
}

const goldenCases = [
  {
    type: "Deviation",
    findingId: "DEV-2026-0341",
    capaId: "CAPA-2026-0341",
    source: "Bizzmine",
    scenario: "Environmental monitoring excursion in filling suite",
    method: "5-Whys",
  },
  {
    type: "Audit Finding",
    findingId: "AUD-2026-0089",
    capaId: "CAPA-2026-0089",
    source: "Q100+",
    scenario: "GMP documentation gap during internal audit",
    method: "Fishbone",
  },
  {
    type: "Complaint",
    findingId: "CMP-2026-0112",
    capaId: "CAPA-2026-0112",
    source: "Bizzmine Complaint",
    scenario: "Visible particulate matter complaint",
    method: "Decision Tree",
  },
];

const eightDStepCopy: Record<EightDStepRoute, { title: string; description: string; focusItems: string[] }> = {
  problem: {
    title: "D1 Problem Statement",
    description: "Capture a specific, measurable problem statement with date, location, equipment, and affected material context.",
    focusItems: [
      "Blocker: statement under 50 characters or missing date, equipment, or measurement.",
      "Nova inline tips show scoring improvements for specificity.",
      "Score category: Problem Specificity.",
    ],
  },
  containment: {
    title: "D2 Containment Action",
    description: "Define immediate containment action, PIC, and valid future due date.",
    focusItems: [
      "Blocker: missing action, PIC, or valid due date.",
      "Nova suggests deterministic containment actions from JSON scripts.",
      "Score category: Containment Strength.",
    ],
  },
  rca: {
    title: "D3 Root Cause Analysis",
    description: "Choose 5-Whys, Fishbone, or Decision Tree and confirm root causes.",
    focusItems: [
      "Deviation uses 5-Whys, Audit Finding uses Fishbone, Complaint uses Decision Tree.",
      "Nova suggestions support Accept, Edit, and Replace.",
      "Score category: Root Cause Depth.",
    ],
  },
  ca: {
    title: "D4 Corrective Action",
    description: "Create corrective actions linked to confirmed root causes with verification methods.",
    focusItems: [
      "Blocker: at least one corrective action must link to a root cause.",
      "Nova proposes multiple action options from mock scripts.",
      "Score category: Action Effectiveness.",
    ],
  },
  pa: {
    title: "D5 Preventive Action",
    description: "Create forward-looking preventive actions with PIC and target date.",
    focusItems: [
      "Blocker: at least one preventive action and future target date.",
      "Prevention links to recurrence reduction and audit readiness.",
      "Score category: Action Effectiveness.",
    ],
  },
  verification: {
    title: "D6 Verification",
    description: "Record verification method, result, and mocked evidence upload.",
    focusItems: [
      "Blocker: method, result, and evidence are all required.",
      "Evidence upload is mocked with toast feedback.",
      "Nova can coach verification methodology.",
    ],
  },
  signoff: {
    title: "D7 Sign-Off",
    description: "Run score gate, e-signature cascade, approval decisions, and closure as Audit Ready.",
    focusItems: [
      "Blocker: score below 80 or missing approvals.",
      "Major severity approval chain: Head of Dept, QA Deviation, Head of QA.",
      "Mock e-signature and email notifications create audit events.",
    ],
  },
};

function ActionButton({ action }: { action: PlaceholderAction }) {
  if (action.to !== undefined) {
    return (
      <Button asChild>
        <Link to={action.to}>
          {action.label}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      onClick={() =>
        toast("Mocked demo action", {
          description: action.toast,
        })
      }
    >
      {action.label}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function NovaPlaceholderPage({
  eyebrow = "AI Coach Nova",
  title = "Prototype Route",
  description = "This route is ready for the AI Coach Nova prototype implementation.",
  focusItems = [],
  primaryAction,
  pageKind = "standard",
  eightDStep,
}: NovaPlaceholderPageProps) {
  const params = useParams();

  if (pageKind === "finding-detail" && params.id && !goldenFindingIds.includes(params.id as (typeof goldenFindingIds)[number])) {
    return <NotFound message={`Finding ${params.id} is not available in the demo dataset yet.`} />;
  }

  if ((pageKind === "capa-detail" || pageKind === "eight-d-step") && params.id && !goldenCapaIds.includes(params.id as (typeof goldenCapaIds)[number])) {
    return <NotFound message={`CAPA ${params.id} is not available in the demo dataset yet.`} />;
  }

  const stepCopy = eightDStep ? eightDStepCopy[eightDStep] : undefined;
  const pageTitle = stepCopy?.title ?? title;
  const pageDescription = stepCopy?.description ?? description;
  const pageFocusItems = stepCopy?.focusItems ?? focusItems;
  const currentStepIndex = eightDStep ? eightDSteps.indexOf(eightDStep) : -1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="border-nova/30 bg-nova/10 text-nova">
              <Sparkles className="mr-1.5 h-3 w-3" />
              {eyebrow}
            </Badge>
            <Badge variant="secondary">Frontend-only mock</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{pageDescription}</p>
        </div>
        {primaryAction && <ActionButton action={primaryAction} />}
      </div>

      {eightDStep && (
        <SectionCard title="8D Workflow Position">
          <div className="grid gap-2 md:grid-cols-7">
            {eightDSteps.map((step, index) => (
              <Link
                key={step}
                to={`/capa/${params.id}/8d/${step}`}
                className={`rounded border px-3 py-2 text-xs font-medium transition-colors ${
                  index === currentStepIndex
                    ? "border-primary bg-primary text-primary-on"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                D{index + 1} {step === "ca" ? "CA" : step === "pa" ? "PA" : step}
              </Link>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <SectionCard title="Implementation Focus">
            <div className="space-y-3">
              {pageFocusItems.map((item) => (
                <div key={item} className="flex gap-3 rounded border bg-muted/30 p-3 text-sm">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{item}</span>
                </div>
              ))}
              {pageFocusItems.length === 0 && (
                <div className="flex gap-3 rounded border bg-muted/30 p-3 text-sm">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>This screen has a safe placeholder and is ready for feature implementation.</span>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Golden Demo Cases">
            <div className="overflow-hidden rounded border">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--table-head-bg)] text-xs uppercase text-[var(--table-head-fg)]">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Finding</th>
                    <th className="px-3 py-2">CAPA</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">RCA</th>
                  </tr>
                </thead>
                <tbody>
                  {goldenCases.map((demoCase) => (
                    <tr key={demoCase.capaId} className="border-t">
                      <td className="px-3 py-2 font-medium">{demoCase.type}</td>
                      <td className="px-3 py-2">
                        <Link className="text-primary hover:underline" to={`/findings/${demoCase.findingId}`}>
                          {demoCase.findingId}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <Link className="text-primary hover:underline" to={`/capa/${demoCase.capaId}`}>
                          {demoCase.capaId}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{demoCase.source}</td>
                      <td className="px-3 py-2">{demoCase.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Nova Readiness">
            <div className="space-y-3 text-sm">
              <div className="rounded border border-nova/20 bg-nova/5 p-3">
                <div className="mb-1 flex items-center gap-2 font-medium text-nova">
                  <Sparkles className="h-4 w-4" />
                  Nova Mock Engine
                </div>
                <p className="text-muted-foreground">
                  AI behavior will use deterministic JSON scripts, simulated delay, and audit trail events.
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border p-3">
                  <div className="text-xs text-muted-foreground">Severity</div>
                  <div className="mt-1 font-semibold text-severity-major">Major</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-muted-foreground">Ready State</div>
                  <div className="mt-1 font-semibold text-status-ready">Audit Ready</div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Guardrails">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>No backend, no database, no real AI, no real integration.</span>
              </div>
              <div className="flex gap-2">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>All source data will come from JSON mock files.</span>
              </div>
              <div className="flex gap-2">
                <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>Runtime demo state will persist with Zustand and localStorage.</span>
              </div>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
