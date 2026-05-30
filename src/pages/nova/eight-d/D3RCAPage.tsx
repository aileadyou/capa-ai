import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, GitBranch, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { kgCitations } from "@/mock-data";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type {
  DecisionNode,
  FishboneCategory,
  FiveWhysNode,
  KGCitation,
  NovaSuggestionStatus,
  RCAMethod,
  RCAData,
} from "@/types";
import { computeRootCauseDepth, computeTotalQualityScore } from "@/utils/scoring";
import { formatCAPAType } from "@/utils/formatters";

type FishboneName = FishboneCategory["category"];

const methodLabel: Record<RCAMethod, string> = {
  "5whys": "5-Whys",
  fishbone: "Fishbone",
  decision_tree: "Decision Tree",
};

const defaultMethodByType = {
  deviation: "5whys",
  audit: "fishbone",
  complaint: "decision_tree",
} as const;

const fiveWhysPlan = [
  {
    level: 1,
    question: "Why did particle count excursion occur during vaccine filling?",
    suggestion: "Because airflow performance in the filling suite was below expected control level.",
    replacement: "Because air control around the Grade A filling area was not maintained during active operation.",
    citationIds: ["CAPA-2025-0447"],
  },
  {
    level: 2,
    question: "Why was airflow performance below expected control level?",
    suggestion: "Because the HEPA filter showed reduced filtration efficiency.",
    replacement: "Because the HEPA unit had deteriorated and no longer supported the expected control state.",
    citationIds: ["CAPA-2025-0447", "CAPA-2024-0392"],
  },
  {
    level: 3,
    question: "Why did the HEPA filter show reduced filtration efficiency?",
    suggestion: "Because the filter had exceeded the recommended replacement interval for high-control areas.",
    replacement: "Because replacement timing did not reflect high-control area trend signals.",
    citationIds: ["CAPA-2024-0392"],
  },
  {
    level: 4,
    question: "Why had the replacement interval not been shortened?",
    suggestion: "Because the preventive maintenance schedule still followed an outdated 18-month interval.",
    replacement: "Because maintenance scheduling did not include a trigger for revised Grade A/B interval guidance.",
    citationIds: ["CAPA-2025-0447"],
  },
  {
    level: 5,
    question: "Why was the preventive maintenance schedule outdated?",
    suggestion: "Because SOP PM-HEPA-001 had not been updated after the revised internal quality guidance was issued.",
    replacement: "Because SOP ownership did not require quality guidance changes to trigger PM interval updates.",
    citationIds: ["CAPA-2025-0447"],
  },
];

const fishbonePlan: Array<{ category: FishboneName; suggestion: string; replacement: string }> = [
  {
    category: "Man",
    suggestion: "Operators were not consistently trained on real-time GMP documentation expectations.",
    replacement: "Supervisors and operators had different expectations for when verification must occur.",
  },
  {
    category: "Method",
    suggestion: "The SOP did not clearly define when second-person verification must be completed.",
    replacement: "Warehouse documentation SOP lacked a real-time verification control point.",
  },
  {
    category: "Measurement",
    suggestion: "No routine KPI monitored late documentation completion.",
    replacement: "Documentation timeliness was not trended or escalated as a quality metric.",
  },
  {
    category: "Environment",
    suggestion: "Warehouse shift handover created pressure to complete records after movement.",
    replacement: "Peak receiving and shift closure overlapped with transfer record completion.",
  },
  {
    category: "Material",
    suggestion: "Multiple lots were transferred during peak receiving window.",
    replacement: "Lot movement volume increased documentation workload during handover.",
  },
  {
    category: "Machine",
    suggestion: "The record template did not flag missing verifier fields before closure.",
    replacement: "The documentation template allowed closure without forcing verifier completion.",
  },
];

const decisionTreePlan: DecisionNode[] = [
  {
    id: "dt-plan-1",
    question: "Was particulate matter confirmed in the complaint sample?",
    yesNodeId: "dt-plan-2",
    noNodeId: "dt-plan-5",
    isLeaf: false,
  },
  {
    id: "dt-plan-2",
    question: "Were retained samples from the same lot affected?",
    yesNodeId: "dt-plan-3",
    noNodeId: "dt-plan-4",
    isLeaf: false,
  },
  {
    id: "dt-plan-3",
    question: "Escalate to potential batch quality issue.",
    isLeaf: true,
    conclusion: "Potential batch-level quality issue requiring product impact assessment.",
  },
  {
    id: "dt-plan-4",
    question: "Was there any abnormality in final visual inspection records?",
    yesNodeId: "dt-plan-6",
    noNodeId: "dt-plan-7",
    isLeaf: false,
  },
  {
    id: "dt-plan-5",
    question: "Classify as unconfirmed complaint but continue retained sample review.",
    isLeaf: true,
    conclusion: "Complaint remains unconfirmed but still requires documented retained sample review.",
  },
  {
    id: "dt-plan-6",
    question: "Was reject reconciliation variance properly escalated?",
    isLeaf: true,
    conclusion: "Confirmed process control weakness in visual inspection reconciliation escalation.",
  },
  {
    id: "dt-plan-7",
    question: "Evaluate distribution or handling factors.",
    isLeaf: true,
    conclusion: "External handling or isolated defect remains possible after internal records review.",
  },
];

const confirmedRootCauseByMethod: Record<RCAMethod, string> = {
  "5whys":
    "Preventive maintenance SOP PM-HEPA-001 used an outdated HEPA filter replacement interval for Grade A filling operations.",
  fishbone:
    "The material transfer documentation process lacked a clear real-time verification control and did not prevent late or incomplete record closure.",
  decision_tree:
    "Final visual inspection reconciliation did not sufficiently escalate a short reject reconciliation variance during batch release review.",
};

function getCitations(ids: string[]): KGCitation[] {
  return kgCitations.filter((citation) => ids.includes(citation.capaId)) as KGCitation[];
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
            const isCurrent = step === "rca";
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

function evaluateRCA(method: RCAMethod, answers: string[], confirmedRootCause: string) {
  const answeredCount = answers.filter((answer) => answer.trim().length >= 10).length;
  const minimumDepth = method === "5whys" ? 4 : method === "fishbone" ? 3 : 4;
  const checks = [
    {
      label:
        method === "5whys"
          ? "At least 4 why levels completed"
          : method === "fishbone"
            ? "At least 3 fishbone categories completed"
            : "Decision tree has at least 4 investigation nodes",
      passed: answeredCount >= minimumDepth,
    },
    {
      label: "Confirmed root cause selected or written",
      passed: confirmedRootCause.trim().length >= 20,
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed),
    depthSignals: Math.min(answeredCount, 6),
  };
}

export function D3RCAPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const updateRCA = useCapaStore((state) => state.updateRCA);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const initialMethod = useMemo<RCAMethod>(() => {
    if (!capa) return "5whys";
    return capa.rca.method ?? defaultMethodByType[capa.type];
  }, [capa]);

  const [method, setMethod] = useState<RCAMethod>(initialMethod);
  const [whyAnswers, setWhyAnswers] = useState<string[]>(
    fiveWhysPlan.map((item, index) => capa?.rca.fiveWhys?.[index]?.userAnswer ?? item.suggestion),
  );
  const [fishboneAnswers, setFishboneAnswers] = useState<Record<FishboneName, string>>(() =>
    fishbonePlan.reduce(
      (current, item) => ({
        ...current,
        [item.category]:
          capa?.rca.fishbone?.find((category) => category.category === item.category)?.userEntries.join("\n") ??
          item.suggestion,
      }),
      {} as Record<FishboneName, string>,
    ),
  );
  const [decisionNodes] = useState<DecisionNode[]>(
    capa?.rca.decisionTree?.nodes?.length ? capa.rca.decisionTree.nodes : decisionTreePlan,
  );
  const [confirmedRootCause, setConfirmedRootCause] = useState(
    capa?.rca.confirmedRootCauses[0] ?? confirmedRootCauseByMethod[initialMethod],
  );
  const [suggestionStatuses, setSuggestionStatuses] = useState<Record<string, NovaSuggestionStatus>>({});

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const activeAnswers =
    method === "5whys"
      ? whyAnswers
      : method === "fishbone"
        ? fishbonePlan.map((item) => fishboneAnswers[item.category])
        : decisionNodes.map((node) => `${node.question} ${node.conclusion ?? ""}`);
  const validation = evaluateRCA(method, activeAnswers, confirmedRootCause);
  const rootCauseDepth = computeRootCauseDepth(
    confirmedRootCause.trim() ? [confirmedRootCause] : [],
    validation.depthSignals,
  );
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    rootCauseDepth,
  });
  const shouldShowBlocker = hasSubmitted && !validation.isValid;

  function updateSuggestion(id: string, status: NovaSuggestionStatus, content: string) {
    setSuggestionStatuses((current) => ({ ...current, [id]: status }));

    if (id.startsWith("why-")) {
      const index = Number(id.replace("why-", "")) - 1;
      setWhyAnswers((current) => current.map((answer, answerIndex) => (answerIndex === index ? content : answer)));
      return;
    }

    if (id.startsWith("fishbone-")) {
      const category = id.replace("fishbone-", "") as FishboneName;
      setFishboneAnswers((current) => ({ ...current, [category]: content }));
    }
  }

  function buildRCAData(): RCAData {
    if (method === "5whys") {
      const fiveWhys: FiveWhysNode[] = fiveWhysPlan.map((item, index) => ({
        id: `5w-${capa.id}-${item.level}`,
        level: item.level,
        question: item.question,
        novaSuggestion: item.suggestion,
        novaCitations: getCitations(item.citationIds),
        userAnswer: whyAnswers[index],
        status: suggestionStatuses[`why-${item.level}`] ?? "accepted",
      }));

      return {
        method,
        fiveWhys,
        confirmedRootCauses: [confirmedRootCause],
      };
    }

    if (method === "fishbone") {
      const fishbone: FishboneCategory[] = fishbonePlan.map((item) => ({
        category: item.category,
        novaEntries: [item.suggestion],
        userEntries: fishboneAnswers[item.category].split("\n").filter(Boolean),
        status: suggestionStatuses[`fishbone-${item.category}`] ?? "accepted",
      }));

      return {
        method,
        fishbone,
        confirmedRootCauses: [confirmedRootCause],
      };
    }

    return {
      method,
      decisionTree: {
        nodes: decisionNodes,
        rootNodeId: decisionNodes[0]?.id ?? "dt-plan-1",
      },
      confirmedRootCauses: [confirmedRootCause],
    };
  }

  function saveRCA(advance: boolean) {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("RCA is blocked", {
        description: "Complete the RCA depth requirement and confirm a root cause before continuing.",
      });
      return;
    }

    updateRCA(capa.id, buildRCAData(), previewScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "root_cause_confirmed",
      action: `Root cause confirmed for ${capa.id} using ${methodLabel[method]}.`,
      capaId: capa.id,
      findingId: capa.findingId,
      after: confirmedRootCause,
    });

    if (advance) {
      updateCurrentStep(capa.id, "ca");
      navigate(`/capa/${capa.id}/8d/ca`);
      return;
    }

    toast.success("RCA saved", {
      description: `${capa.id} root cause score is now ${rootCauseDepth}/25.`,
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
          <h1 className="text-2xl font-semibold tracking-tight">D3 Root Cause Analysis</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Choose the RCA method, review Nova suggestions, cite similar CAPAs, and confirm the systemic root cause before corrective action planning.
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4 text-primary" />
                RCA Method
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-2">
                <Label>Method picker</Label>
                <Select
                  value={method}
                  onValueChange={(value) => {
                    const nextMethod = value as RCAMethod;
                    setMethod(nextMethod);
                    setConfirmedRootCause(confirmedRootCauseByMethod[nextMethod]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5whys">5-Whys</SelectItem>
                    <SelectItem value="fishbone">Fishbone</SelectItem>
                    <SelectItem value="decision_tree">Decision Tree</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NovaCoachTip>
                Nova defaults Deviation to 5-Whys, Audit Finding to Fishbone, and Complaint to Decision Tree. You can still switch methods if the investigation needs a different structure.
              </NovaCoachTip>
            </CardContent>
          </Card>

          {method === "5whys" && (
            <div className="space-y-3">
              {fiveWhysPlan.map((item, index) => (
                <NovaSuggestionCard
                  key={item.level}
                  id={`why-${item.level}`}
                  capaId={capa.id}
                  context={`Why ${item.level}: ${item.question}`}
                  content={whyAnswers[index]}
                  replacementContent={item.replacement}
                  citations={getCitations(item.citationIds)}
                  status={suggestionStatuses[`why-${item.level}`] ?? "pending"}
                  onStatusChange={(status, content) => updateSuggestion(`why-${item.level}`, status, content)}
                />
              ))}
            </div>
          )}

          {method === "fishbone" && (
            <div className="grid gap-3 lg:grid-cols-2">
              {fishbonePlan.map((item) => (
                <NovaSuggestionCard
                  key={item.category}
                  id={`fishbone-${item.category}`}
                  capaId={capa.id}
                  context={`Fishbone · ${item.category}`}
                  content={fishboneAnswers[item.category]}
                  replacementContent={item.replacement}
                  citations={getCitations(["CAPA-2025-0124"])}
                  status={suggestionStatuses[`fishbone-${item.category}`] ?? "pending"}
                  onStatusChange={(status, content) => updateSuggestion(`fishbone-${item.category}`, status, content)}
                />
              ))}
            </div>
          )}

          {method === "decision_tree" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision Tree</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {decisionNodes.map((node, index) => (
                  <div key={node.id} className="rounded border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-medium text-muted-foreground">Question {index + 1}</div>
                      <span className="text-xs text-muted-foreground">{node.isLeaf ? "Conclusion" : "Branch"}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{node.question}</p>
                    {node.yesNodeId && node.noNodeId && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Yes → {node.yesNodeId} · No → {node.noNodeId}
                      </p>
                    )}
                    {node.conclusion && <p className="mt-2 text-sm text-muted-foreground">{node.conclusion}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Confirmed Root Cause</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmed-root-cause">Root cause</Label>
                <Textarea
                  id="confirmed-root-cause"
                  value={confirmedRootCause}
                  onChange={(event) => setConfirmedRootCause(event.target.value)}
                  rows={4}
                />
              </div>

              {shouldShowBlocker && (
                <BlockerBanner
                  title="Root cause confirmation is incomplete"
                  message="Complete enough RCA depth and confirm a root cause before continuing to corrective action."
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
                <Button type="button" variant="outline" onClick={() => saveRCA(false)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button type="button" onClick={() => saveRCA(true)}>
                  Continue to Corrective Action
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={previewScore} />
          <NovaCoachTip>
            Strong RCA explains the management-system weakness, not only the immediate event. Look for outdated SOP ownership, missing escalation criteria, unclear verification timing, or review controls that failed to detect the issue.
          </NovaCoachTip>
        </div>
      </div>
    </div>
  );
}
