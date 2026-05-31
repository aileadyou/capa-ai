import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { EightDShell } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { kgCitations } from "@/mock-data";
import { useAuditTrailStore, useCapaStore, useUIStore } from "@/store";
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
  const styles: Record<string, { bg: string; color: string }> = {
    Effective: { bg: "rgba(52, 211, 153, 0.10)", color: "#34D399" },
    Ongoing: { bg: "rgba(251, 191, 36, 0.10)", color: "#FBBF24" },
    Recurred: { bg: "rgba(224, 82, 82, 0.10)", color: "#E05252" },
  };
  const s = styles[outcome] ?? { bg: "var(--bg-3)", color: "var(--fg-3)" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--r-full)",
        fontSize: "10px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        background: s.bg,
        color: s.color,
        letterSpacing: "0.04em",
      }}
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
  const scoreColor =
    citation.similarityScore >= 90
      ? "#34D399"
      : citation.similarityScore >= 80
        ? "#FBBF24"
        : "var(--fg-3)";

  return (
    <button
      onClick={() => onOpen(citation.capaId)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--bg-3)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-md)",
        padding: "14px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-line)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line-2)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-3)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: "var(--accent)",
            }}
          >
            {citation.capaId}
          </span>
          <OutcomeChip outcome={citation.outcome} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: scoreColor, fontFamily: "var(--font-mono)" }}>
            {citation.similarityScore}%
          </span>
          <span style={{ fontSize: "10px", color: "var(--fg-4)" }}>match</span>
          <ExternalLink size={11} style={{ color: "var(--fg-4)", marginLeft: "2px" }} />
        </div>
      </div>

      {/* Root cause */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--fg-2)",
          margin: "0 0 6px",
          lineHeight: "1.5",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        <span style={{ fontWeight: 500, color: "var(--fg-3)", marginRight: "4px" }}>Root cause:</span>
        {citation.rootCause}
      </p>

      {/* Corrective action */}
      <p
        style={{
          fontSize: "11px",
          color: "var(--fg-3)",
          margin: 0,
          lineHeight: "1.45",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        <span style={{ color: "var(--fg-4)", marginRight: "4px" }}>CA:</span>
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
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            {/* Left: level indicator + connector line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
                paddingTop: "2px",
              }}
            >
              {/* Level circle */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: isRootCause ? "var(--accent)" : "var(--bg-4)",
                  border: `1px solid ${isRootCause ? "var(--accent)" : "var(--line-2)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: isRootCause ? "var(--on-accent)" : "var(--fg-3)",
                  flexShrink: 0,
                }}
              >
                {item.level}
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    width: "1px",
                    flex: 1,
                    minHeight: "24px",
                    background: "var(--line-2)",
                    marginTop: "4px",
                    marginBottom: "4px",
                  }}
                />
              )}
            </div>

            {/* Right: content */}
            <div
              style={{
                flex: 1,
                paddingBottom: isLast ? 0 : "20px",
                minWidth: 0,
              }}
            >
              {/* Why label + question */}
              <div style={{ marginBottom: "10px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isRootCause ? "var(--accent)" : "var(--fg-4)",
                    marginBottom: "4px",
                  }}
                >
                  {isRootCause ? "Root Cause · Why 5" : `Why ${item.level}`}
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: isRootCause ? 600 : 500,
                    color: isRootCause ? "var(--fg-1)" : "var(--fg-2)",
                    margin: 0,
                    lineHeight: "1.5",
                    borderLeft: isRootCause ? "2px solid var(--line-3)" : "none",
                    paddingLeft: isRootCause ? "10px" : 0,
                  }}
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {fishbonePlan.map((item) => (
        <div key={item.category}>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 8px",
            }}
          >
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
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {nodes.map((node, index) => (
        <div
          key={node.id}
          style={{
            padding: "12px 14px",
            background: "var(--bg-3)",
            border: `1px solid ${node.isLeaf ? "var(--line-2)" : "var(--line-1)"}`,
            borderRadius: "var(--r-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-4)", letterSpacing: "0.08em" }}>
              Node {index + 1}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: node.isLeaf ? "var(--accent)" : "var(--fg-3)",
                fontWeight: node.isLeaf ? 600 : 400,
              }}
            >
              {node.isLeaf ? "Conclusion" : "Branch"}
            </span>
          </div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--fg-2)", margin: "0 0 4px", fontFamily: "var(--font-sans)" }}>
            {node.question}
          </p>
          {node.yesNodeId && node.noNodeId && (
            <p style={{ fontSize: "11px", color: "var(--fg-4)", margin: 0, fontFamily: "var(--font-mono)" }}>
              Yes → {node.yesNodeId} · No → {node.noNodeId}
            </p>
          )}
          {node.conclusion && (
            <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: "4px 0 0", fontFamily: "var(--font-sans)", lineHeight: "1.5" }}>
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

    if (!validation.isValid) {
      toast.error("RCA is blocked", {
        description:
          "Complete the RCA depth requirement and confirm a root cause before continuing.",
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
    <EightDShell capaId={capa.id} activeStep="rca">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
              margin: "0 0 6px",
              letterSpacing: "0.04em",
            }}
          >
            {capa.id} · D3
          </p>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Root Cause Analysis
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
            Choose your RCA method, review Nova's suggested causal chain, cite similar past CAPAs, and confirm the systemic root cause before corrective action planning.
          </p>
        </div>

        {/* ── Method picker ────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="rca-method"
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--fg-2)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            RCA method
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["5whys", "fishbone", "decision_tree"] as RCAMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMethod(m);
                  setConfirmedRootCause(confirmedRootCauseByMethod[m]);
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--r-sm)",
                  fontSize: "12px",
                  fontWeight: method === m ? 600 : 400,
                  fontFamily: "var(--font-sans)",
                  background: method === m ? "var(--accent-soft)" : "var(--bg-4)",
                  color: method === m ? "var(--accent)" : "var(--fg-2)",
                  border: `1px solid ${method === m ? "var(--accent-line)" : "var(--line-2)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {methodLabel[m]}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "var(--fg-4)", margin: "8px 0 0", fontFamily: "var(--font-sans)" }}>
            Nova defaults: Deviation → 5-Whys · Audit → Fishbone · Complaint → Decision Tree
          </p>
        </div>

        {/* ── RCA content (method-specific) ───────────────────────────── */}
        {method === "5whys" && (
          <div>
            <p
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                margin: "0 0 16px",
              }}
            >
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
            <p
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                margin: "0 0 16px",
              }}
            >
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
            <p
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                margin: "0 0 12px",
              }}
            >
              Decision Tree
            </p>
            <DecisionTree nodes={decisionNodes} />
          </div>
        )}

        {/* ── Similar Past CAPAs ───────────────────────────────────────── */}
        {relevantCitations.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  margin: 0,
                }}
              >
                Similar Past CAPAs
              </p>
              <span style={{ fontSize: "11px", color: "var(--fg-4)", fontFamily: "var(--font-sans)" }}>
                — review historical root causes and outcomes
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
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
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--fg-2)",
              marginBottom: "6px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Confirmed root cause
          </label>
          <p style={{ fontSize: "12px", color: "var(--fg-4)", margin: "0 0 10px", fontFamily: "var(--font-sans)" }}>
            Summarise the systemic management-system weakness, not just the immediate event.
          </p>
          <textarea
            id="confirmed-root-cause"
            value={confirmedRootCause}
            onChange={(e) => setConfirmedRootCause(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              background: "var(--bg-4)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)",
              padding: "12px 14px",
              fontSize: "13px",
              lineHeight: "1.65",
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--line-2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* ── Blocker ──────────────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px 14px",
              background: "rgba(224, 82, 82, 0.08)",
              border: "1px solid rgba(224, 82, 82, 0.3)",
              borderRadius: "var(--r-sm)",
            }}
          >
            <AlertTriangle size={15} style={{ color: "#E05252", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#E05252", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                Root cause confirmation is incomplete
              </p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Complete enough RCA depth and confirm a root cause before continuing to corrective action.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 10px",
            }}
          >
            Quality Signals
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {validation.checks.map((check) => (
              <div
                key={check.label}
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  background: check.passed ? "rgba(52, 211, 153, 0.06)" : "var(--bg-3)",
                  border: `1px solid ${check.passed ? "rgba(52, 211, 153, 0.2)" : "var(--line-1)"}`,
                }}
              >
                {check.passed ? (
                  <CheckCircle2 size={14} style={{ flexShrink: 0, color: "#34D399", marginTop: "1px" }} />
                ) : (
                  <Circle size={14} style={{ flexShrink: 0, color: "var(--fg-4)", marginTop: "1px" }} />
                )}
                <p
                  style={{
                    fontSize: "12px",
                    color: check.passed ? "var(--fg-2)" : "var(--fg-3)",
                    margin: 0,
                    fontFamily: "var(--font-sans)",
                    fontWeight: check.passed ? 500 : 400,
                  }}
                >
                  {check.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            paddingTop: "8px",
            borderTop: "1px solid var(--line-1)",
          }}
        >
          <button
            onClick={() => saveRCA(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg-4)",
              color: "var(--fg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)",
              padding: "8px 16px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
            }}
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => saveRCA(true)}
            style={{
              background: "var(--grad-brand)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: "var(--r-sm)",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.01em",
            }}
          >
            Continue to D4 Corrective Action →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
