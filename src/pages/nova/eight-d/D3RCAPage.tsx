import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { kgCitations } from "@/mock-data";
import { useAuditTrailStore, useCapaStore, useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import type {
  DecisionNode,
  FishboneCategory,
  FiveWhysNode,
  KGCitation,
  RCAData,
  RCAMethod,
} from "@/types";
import { computeRootCauseDepth, computeTotalQualityScore } from "@/utils/scoring";

// ── Static data ──────────────────────────────────────────────────────────────

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
    reasoning:
      "Pattern match: CAPA-2025-0447 (91% similar) identified airflow as primary excursion driver. Environmental monitoring records for FILL-02 show no recent HEPA performance baseline deviation prior to event.",
  },
  {
    level: 2,
    question: "Why was airflow performance below expected control level?",
    suggestion: "Because the HEPA filter showed reduced filtration efficiency.",
    replacement: "Because the HEPA unit had deteriorated and no longer supported the expected control state.",
    citationIds: ["CAPA-2025-0447", "CAPA-2024-0392"],
    reasoning:
      "Two historical CAPAs (2025-0447, 2024-0392) both traced airflow deviations to HEPA degradation. Last qualification report for HEPA-FILL-02 is dated 18 months ago.",
  },
  {
    level: 3,
    question: "Why did the HEPA filter show reduced filtration efficiency?",
    suggestion: "Because the filter had exceeded the recommended replacement interval for high-control areas.",
    replacement: "Because replacement timing did not reflect high-control area trend signals.",
    citationIds: ["CAPA-2024-0392"],
    reasoning:
      "CAPA-2024-0392 (86% similar) found identical root trigger: maintenance reminder missed during holiday coverage period. Maintenance log shows HEPA-FILL-02 last replaced 22 months ago, against 18-month target.",
  },
  {
    level: 4,
    question: "Why had the replacement interval not been shortened?",
    suggestion: "Because the preventive maintenance schedule still followed an outdated 18-month interval.",
    replacement: "Because maintenance scheduling did not include a trigger for revised Grade A/B interval guidance.",
    citationIds: ["CAPA-2025-0447"],
    reasoning:
      "Internal quality guidance revision from Q3 2024 recommended 12-month intervals for Grade A/B HEPA units. PM schedule change request was raised but not formally approved or implemented.",
  },
  {
    level: 5,
    question: "Why was the preventive maintenance schedule outdated?",
    suggestion:
      "Because SOP PM-HEPA-001 had not been updated after the revised internal quality guidance was issued.",
    replacement:
      "Because SOP ownership did not require quality guidance changes to trigger PM interval updates.",
    citationIds: ["CAPA-2025-0447"],
    reasoning:
      "SOP PM-HEPA-001 last reviewed March 2023. No change control or periodic review was triggered by the 2024 quality guidance update. This represents the systemic gap — SOP ownership did not monitor guidance changes as an update trigger.",
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
  return kgCitations.filter((c) => ids.includes(c.capaId)) as KGCitation[];
}

// ── Similar Past CAPAs filtered by source type ───────────────────────────────

const citationsByType: Record<string, string[]> = {
  deviation: ["CAPA-2025-0447", "CAPA-2024-0392", "CAPA-2026-0251"],
  audit: ["CAPA-2025-0124"],
  complaint: ["CAPA-2025-0091"],
};

function getRelevantCitations(capaType: string) {
  const ids = citationsByType[capaType] ?? kgCitations.map((c) => c.capaId);
  return kgCitations.filter((c) => ids.includes(c.capaId));
}

function evaluateRCA(method: RCAMethod, answers: string[], confirmedRootCause: string) {
  const answeredCount = answers.filter((a) => a.trim().length >= 10).length;
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
    isValid: checks.every((c) => c.passed),
    depthSignals: Math.min(answeredCount, 6),
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function OutcomeChip({ outcome }: { outcome: string }) {
  const styles: Record<string, string> = {
    Effective: "bg-[var(--success-soft)] text-success",
    Ongoing: "bg-[var(--warning-soft)] text-warning",
    Recurred: "bg-[var(--danger-soft)] text-destructive",
  };
  const toneClass = styles[outcome] ?? "bg-elevated text-foreground-tertiary";

  return (
    <span
      className={cn("inline-block rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.18em]", toneClass)}
    >
      {outcome}
    </span>
  );
}

function SimilarCapaCard({
  citation,
  onOpen,
}: {
  citation: KGCitation & { similarityScore: number; outcome: string };
  onOpen: (id: string) => void;
}) {
  const scoreClass =
    citation.similarityScore >= 90
      ? "text-success"
      : citation.similarityScore >= 80
        ? "text-warning"
        : "text-foreground-tertiary";

  return (
    <button
      onClick={() => onOpen(citation.capaId)}
      className="block w-full cursor-pointer rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-3.5 text-left font-sans transition-[background,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--accent-line)] hover:bg-field"
    >
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-semibold text-primary">
            {citation.capaId}
          </span>
          <OutcomeChip outcome={citation.outcome} />
        </div>
        <div className="flex items-center gap-1">
          <span className={cn("font-sans text-xs font-bold", scoreClass)}>
            {citation.similarityScore}%
          </span>
          <span className="text-[10px] text-foreground-faint">match</span>
          <ExternalLink size={11} className="ml-0.5 text-foreground-faint" />
        </div>
      </div>

      {/* Root cause */}
      <p className="mb-1.5 mt-0 line-clamp-2 text-xs leading-[1.5] text-foreground-secondary">
        <span className="mr-1 font-medium text-foreground-tertiary">Root cause:</span>
        {citation.rootCause}
      </p>

      {/* Corrective action */}
      <p className="m-0 line-clamp-2 text-[11px] leading-[1.45] text-foreground-tertiary">
        <span className="mr-1 text-foreground-faint">CA:</span>
        {citation.correctiveAction}
      </p>
    </button>
  );
}

// ── 5-Whys chain ─────────────────────────────────────────────────────────────

function FiveWhysChain({
  capaId,
  answers,
  onAnswerChange,
}: {
  capaId: string;
  answers: string[];
  onAnswerChange: (index: number, content: string) => void;
}) {
  return (
    <div>
      {fiveWhysPlan.map((item, index) => {
        const isLast = index === fiveWhysPlan.length - 1;
        const isRootCause = isLast;

        return (
          <div
            key={item.level}
            className="flex items-start gap-4"
          >
            {/* Left: level indicator + connector line */}
            <div className="flex shrink-0 flex-col items-center pt-0.5">
              {/* Level circle */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-sans text-[11px] font-bold",
                  isRootCause ? "border-primary bg-primary text-primary-foreground" : "border-[var(--line-2)] bg-field text-foreground-tertiary",
                )}
              >
                {item.level}
              </div>
              {/* Connector line */}
              {!isLast && (
                <div className="my-1 min-h-6 w-px flex-1 bg-[var(--line-2)]" />
              )}
            </div>

            {/* Right: content */}
            <div
              className={cn("min-w-0 flex-1", !isLast && "pb-5")}
            >
              {/* Why label + question */}
              <div className="mb-2.5">
                <span
                  className={cn(
                    "mb-1 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.18em]",
                    isRootCause ? "text-primary" : "text-foreground-faint",
                  )}
                >
                  {isRootCause ? "Root Cause · Why 5" : `Why ${item.level}`}
                </span>
                <p
                  className={cn(
                    "m-0 text-[13px] leading-[1.5]",
                    isRootCause ? "border-l-2 border-[var(--line-3)] pl-2.5 font-semibold text-foreground" : "font-medium text-foreground-secondary",
                  )}
                >
                  {item.question}
                </p>
              </div>

              {/* NovaSuggestionBlock for this level */}
              <NovaSuggestionBlock
                context={`Why ${item.level} answer`}
                suggestion={item.suggestion}
                reasoning={item.reasoning}
                capaId={capaId}
                suggestionId={`why-${item.level}`}
                onAccept={(content) => onAnswerChange(index, content)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Fishbone grid ─────────────────────────────────────────────────────────────

function FishboneGrid({
  capaId,
  answers,
  onAnswerChange,
}: {
  capaId: string;
  answers: Record<FishboneName, string>;
  onAnswerChange: (category: FishboneName, content: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {fishbonePlan.map((item) => (
        <div key={item.category}>
          <p className="mb-2 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
            {item.category}
          </p>
          <NovaSuggestionBlock
            suggestion={item.suggestion}
            capaId={capaId}
            suggestionId={`fishbone-${item.category}`}
            onAccept={(content) => onAnswerChange(item.category, content)}
          />
        </div>
      ))}
    </div>
  );
}

// ── Decision tree ─────────────────────────────────────────────────────────────

function DecisionTree({ nodes }: { nodes: DecisionNode[] }) {
  return (
    <div className="flex flex-col gap-2">
      {nodes.map((node, index) => (
        <div
          key={node.id}
          className={cn("rounded-[var(--r-sm)] border bg-elevated px-3.5 py-3", node.isLeaf ? "border-[var(--line-2)]" : "border-border-subtle")}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-sans text-[10px] tracking-[0.18em] text-foreground-faint">
              Node {index + 1}
            </span>
            <span
              className={cn("font-sans text-[10px]", node.isLeaf ? "font-semibold text-primary" : "font-normal text-foreground-tertiary")}
            >
              {node.isLeaf ? "Conclusion" : "Branch"}
            </span>
          </div>
          <p className="mb-1 mt-0 font-sans text-[13px] font-medium text-foreground-secondary">
            {node.question}
          </p>
          {node.yesNodeId && node.noNodeId && (
            <p className="m-0 font-sans text-[11px] text-foreground-faint">
              Yes → {node.yesNodeId} · No → {node.noNodeId}
            </p>
          )}
          {node.conclusion && (
            <p className="mb-0 mt-1 font-sans text-xs leading-[1.5] text-foreground-tertiary">
              {node.conclusion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function D3RCAPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { embedded, onStepChange } = useEightDEmbed();
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

  const updateRCA = useCapaStore((state) => state.updateRCA);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const openCitationPanel = useUIStore((state) => state.openCitationPanel);
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
          capa?.rca.fishbone?.find((cat) => cat.category === item.category)?.userEntries.join("\n") ??
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
  const previewScore = computeTotalQualityScore({ ...capa.score, rootCauseDepth });
  const shouldShowBlocker = hasSubmitted && !validation.isValid;
  const relevantCitations = getRelevantCitations(capa.type);

  function buildRCAData(): RCAData {
    if (method === "5whys") {
      const fiveWhys: FiveWhysNode[] = fiveWhysPlan.map((item, index) => ({
        id: `5w-${capa.id}-${item.level}`,
        level: item.level,
        question: item.question,
        novaSuggestion: item.suggestion,
        novaCitations: getCitations(item.citationIds),
        userAnswer: whyAnswers[index],
        status: "accepted" as const,
      }));
      return { method, fiveWhys, confirmedRootCauses: [confirmedRootCause] };
    }

    if (method === "fishbone") {
      const fishbone: FishboneCategory[] = fishbonePlan.map((item) => ({
        category: item.category,
        novaEntries: [item.suggestion],
        userEntries: fishboneAnswers[item.category].split("\n").filter(Boolean),
        status: "accepted" as const,
      }));
      return { method, fishbone, confirmedRootCauses: [confirmedRootCause] };
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

    if (!validation.isValid && !advance) {
      toast.error("RCA is blocked", {
        description:
          "Complete the RCA depth requirement and confirm a root cause before continuing.",
      });
      return;
    }

    if (!validation.isValid && advance) {
      toast.warning("Continuing with incomplete RCA", {
        description:
          "Nova will let you continue, but RCA still needs the depth requirement and a confirmed root cause.",
      });
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
      if (embedded && onStepChange) {
        onStepChange("ca");
      } else {
        navigate(`/capa/${capa.id}/8d/ca`);
      }
      return;
    }

    toast.success("RCA saved", {
      description: `${capa.id} root cause score is now ${rootCauseDepth}/25.`,
    });
  }

  return (
    <EightDShell capaId={capa.id} activeStep="rca">
      <div className="flex flex-col gap-7">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-foreground-tertiary">
            {capa.id} · D3
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Root Cause Analysis
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
            Choose your RCA method, review Nova's suggested causal chain, cite similar past CAPAs, and confirm the systemic root cause before corrective action planning.
          </p>
        </div>

        {/* ── Method picker ────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="rca-method"
            className="mb-2 block font-sans text-xs font-semibold text-foreground-secondary"
          >
            RCA method
          </label>
          <div className="flex flex-wrap gap-2">
            {(["5whys", "fishbone", "decision_tree"] as RCAMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMethod(m);
                  setConfirmedRootCause(confirmedRootCauseByMethod[m]);
                }}
                className={cn(
                  "cursor-pointer rounded-[var(--r-sm)] border px-4 py-[7px] font-sans text-xs transition-[background,border-color,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                  method === m
                    ? "border-[var(--accent-line)] bg-[var(--accent-soft)] font-semibold text-primary"
                    : "border-[var(--line-2)] bg-field font-normal text-foreground-secondary",
                )}
              >
                {methodLabel[m]}
              </button>
            ))}
          </div>
          <p className="mb-0 mt-2 font-sans text-[11px] text-foreground-faint">
            Nova defaults: Deviation → 5-Whys · Audit → Fishbone · Complaint → Decision Tree
          </p>
        </div>

        {/* ── RCA content (method-specific) ───────────────────────────── */}
        {method === "5whys" && (
          <div>
            <p className="mb-4 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
              5-Whys Causal Chain
            </p>
            <FiveWhysChain
              capaId={capa.id}
              answers={whyAnswers}
              onAnswerChange={(index, content) =>
                setWhyAnswers((current) =>
                  current.map((a, i) => (i === index ? content : a)),
                )
              }
            />
          </div>
        )}

        {method === "fishbone" && (
          <div>
            <p className="mb-4 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
              Fishbone Categories
            </p>
            <FishboneGrid
              capaId={capa.id}
              answers={fishboneAnswers}
              onAnswerChange={(category, content) =>
                setFishboneAnswers((current) => ({ ...current, [category]: content }))
              }
            />
          </div>
        )}

        {method === "decision_tree" && (
          <div>
            <p className="mb-3 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
              Decision Tree
            </p>
            <DecisionTree nodes={decisionNodes} />
          </div>
        )}

        {/* ── Similar Past CAPAs ───────────────────────────────────────── */}
        {relevantCitations.length > 0 && (
          <div>
            <div className="mb-3 flex items-baseline gap-2">
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                Similar Past CAPAs
              </p>
              <span className="font-sans text-[11px] text-foreground-faint">
                — review historical root causes and outcomes
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {relevantCitations.map((citation) => (
                <SimilarCapaCard
                  key={citation.capaId}
                  citation={citation as KGCitation & { similarityScore: number; outcome: string }}
                  onOpen={openCitationPanel}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Confirmed root cause ─────────────────────────────────────── */}
        <div>
          <label
            htmlFor="confirmed-root-cause"
            className="mb-1.5 block font-sans text-xs font-semibold text-foreground-secondary"
          >
            Confirmed root cause
          </label>
          <p className="mb-2.5 mt-0 font-sans text-xs text-foreground-faint">
            Summarise the systemic management-system weakness, not just the immediate event.
          </p>
          <textarea
            id="confirmed-root-cause"
            value={confirmedRootCause}
            onChange={(e) => setConfirmedRootCause(e.target.value)}
            rows={4}
            className="box-border w-full resize-y rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </div>

        {/* ── Blocker ──────────────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">
                Root cause confirmation is incomplete
              </p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Complete enough RCA depth and confirm a root cause before continuing to corrective action.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
            Quality Signals
          </p>
          <div className="grid grid-cols-2 gap-2">
            {validation.checks.map((check) => (
              <div
                key={check.label}
                className={cn(
                  "flex gap-2.5 rounded-[var(--r-sm)] border px-3 py-2.5",
                  check.passed ? "border-success/30 bg-[var(--success-soft)]" : "border-border-subtle bg-elevated",
                )}
              >
                {check.passed ? (
                  <CheckCircle2 size={14} className="mt-px shrink-0 text-success" />
                ) : (
                  <Circle size={14} className="mt-px shrink-0 text-foreground-faint" />
                )}
                <p
                  className={cn(
                    "m-0 font-sans text-xs",
                    check.passed ? "font-medium text-foreground-secondary" : "font-normal text-foreground-tertiary",
                  )}
                >
                  {check.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
          <button
            onClick={() => saveRCA(false)}
            className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => saveRCA(true)}
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
          >
            Continue to D4 Corrective Action →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
