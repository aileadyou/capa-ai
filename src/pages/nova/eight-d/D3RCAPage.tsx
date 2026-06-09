import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, Circle, ExternalLink, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { kgCitations } from "@/mock-data";
import { useUIStore } from "@/store";
import {
  useAddAuditEvent,
  useAnswerFiveWhys,
  useCapa,
  useLatestFiveWhys,
  useStartFiveWhys,
  useUpdateRca,
  useUpdateStep,
} from "@/hooks/api";
import type { FiveWhysSession } from "@/hooks/api";
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

const disabledRCAMethods = new Set<RCAMethod>(["fishbone", "decision_tree"]);

const defaultMethodByType = {
  deviation: "5whys",
  audit: "fishbone",
  complaint: "decision_tree",
} as const;

const rootCauseSuggestionByCapaId: Record<string, string> = {
  "CAPA-2026-0127":
    "The cleaning verification record routing process allowed release checklist closure before controlled swab map attachments and QA reviewer sign-off were reconciled, because SOP-CLN-011 did not define a mandatory attachment completeness gate with accountable ownership.",
};

const rootCauseSuggestionByType: Record<string, string> = {
  deviation:
    "The process-control failure was not detected by routine checks because the preventive control did not challenge the operating condition that triggered the deviation.",
  audit:
    "The GMP record control process allowed required evidence to be referenced before completeness was verified, because the SOP lacked a mandatory reconciliation gate and accountable owner.",
  complaint:
    "The complaint defect was not prevented by routine release controls because the challenged process condition was not included in the documented verification step.",
};

// fiveWhysPlan is now driven by the server session (useStartFiveWhys / useAnswerFiveWhys).
// The static array has been removed — question/suggestion come from FiveWhysSession.nodes.

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

// ── 5-Whys conversational chain (session-based) ──────────────────────────────

const FIVE_WHYS_DEPTH = 5;

function FiveWhysChain({
  capaId,
  onSessionUpdate,
}: {
  capaId: string;
  /** Called whenever the session changes — parent uses it to sync confirmedRootCause */
  onSessionUpdate?: (session: FiveWhysSession) => void;
}) {
  const { data: serverSession, isLoading: sessionLoading } = useLatestFiveWhys(capaId);
  const startMutation = useStartFiveWhys();
  const answerMutation = useAnswerFiveWhys();

  // Local copy so UI updates instantly after mutation without waiting for query refetch.
  const [localSession, setLocalSession] = useState<FiveWhysSession | null>(null);
  const session = localSession ?? serverSession ?? null;

  const completedNodes = session?.nodes.filter((n) => n.userAnswer?.trim()) ?? [];
  const activeNode = session?.nodes.find((n) => !n.userAnswer?.trim()) ?? null;
  const isDone = session?.status === "complete";

  const [draft, setDraft] = useState("");

  // Reset draft when active node changes
  const prevActiveId = useMemo(() => activeNode?.id, [activeNode?.id]);
  useEffect(() => {
    setDraft("");
  }, [prevActiveId]);

  // Sync latest server session on first load (in case page was refreshed)
  useEffect(() => {
    if (serverSession && !localSession) {
      setLocalSession(serverSession);
      if (serverSession.status === "complete") onSessionUpdate?.(serverSession);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSession?.id]);

  const applySession = (s: FiveWhysSession) => {
    setLocalSession(s);
    if (s.status === "complete") onSessionUpdate?.(s);
  };

  const handleStart = async () => {
    try {
      const s = await startMutation.mutateAsync({ capaId });
      applySession(s);
    } catch {
      toast.error("Could not start 5 Whys session", {
        description: "Server may be unavailable. Try refreshing.",
      });
    }
  };

  const handleConfirm = async () => {
    if (!activeNode || !draft.trim() || !session) return;
    try {
      const s = await answerMutation.mutateAsync({
        sessionId: session.id,
        nodeId: activeNode.id,
        answer: draft.trim(),
      });
      applySession(s);
    } catch {
      toast.error("Could not record answer", {
        description: "Please try again.",
      });
    }
  };

  const handleRestart = async () => {
    setLocalSession(null);
    setDraft("");
    try {
      const s = await startMutation.mutateAsync({ capaId });
      applySession(s);
    } catch {
      toast.error("Could not restart 5 Whys session.");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-foreground-faint">
        <Loader2 size={14} className="animate-spin" />
        <span className="font-sans text-xs">Loading session…</span>
      </div>
    );
  }

  // ── No session yet ───────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card">
        <div className="border-b border-border-subtle bg-elevated px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Sparkles size={15} className="text-primary" />
            <p className="m-0 font-sans text-[13px] font-semibold text-foreground">
              Nova AI-Assisted 5 Whys
            </p>
          </div>
          <p className="mb-0 mt-1.5 text-xs leading-[1.6] text-foreground-tertiary">
            Nova generates each "why" question based on your CAPA context and previous answers,
            suggesting a candidate answer you can accept or edit. Complete all 5 levels to
            establish the systemic root cause.
          </p>
        </div>
        <div className="px-5 py-5">
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { step: "1", label: "Nova generates Why 1", sub: "grounded in your CAPA context" },
              { step: "2–4", label: "You answer each level", sub: "accept or edit Nova's suggestion" },
              { step: "5", label: "Root cause confirmed", sub: "systemic gap summarised by Nova" },
            ].map((item) => (
              <div key={item.step} className="rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-3 py-3">
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 font-sans text-[10px] font-bold text-primary">
                  {item.step}
                </span>
                <p className="mb-0.5 mt-2 font-sans text-[12px] font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="m-0 font-sans text-[11px] text-foreground-faint">{item.sub}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={startMutation.isPending}
            onClick={handleStart}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-[var(--r-sm)] border-0 py-3 font-sans text-[13px] font-semibold",
              startMutation.isPending
                ? "cursor-not-allowed bg-field text-foreground-faint"
                : "cursor-pointer bg-[image:var(--grad-brand)] text-primary-foreground",
            )}
          >
            {startMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Nova is generating Why 1…
              </>
            ) : (
              <>
                <Bot size={14} />
                Start AI-Assisted 5 Whys
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Active / complete session ────────────────────────────────────────────
  const isSubmitting = answerMutation.isPending;
  const isWaitingForNext = isSubmitting || (
    // Server is generating the next node (POST returned but next node isn't visible yet)
    !isDone && !activeNode && completedNodes.length > 0 && completedNodes.length < FIVE_WHYS_DEPTH
  );

  return (
    <div className="flex flex-col gap-1">
      {/* Source badge */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className={cn(
          "inline-flex items-center gap-1 rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[10px] font-semibold",
          session.source === "openrouter"
            ? "bg-[var(--accent-soft)] text-primary"
            : "bg-elevated text-foreground-tertiary",
        )}>
          {session.source === "openrouter" ? (
            <><Sparkles size={9} />Live AI · OpenRouter</>
          ) : (
            <><Bot size={9} />Premade script</>
          )}
        </span>
        {isDone && (
          <span className="inline-flex items-center gap-1 rounded-[var(--r-full)] bg-success/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-success">
            <CheckCircle2 size={9} />Complete
          </span>
        )}
      </div>

      {/* Completed nodes */}
      {completedNodes.map((node, index) => (
        <div key={node.id} className="flex gap-3">
          <div className="flex shrink-0 flex-col items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 font-sans text-[10px] font-bold text-success">
              {node.level}
            </div>
            {(index < completedNodes.length - 1 || !isDone || activeNode) && (
              <div className="my-0.5 min-h-[16px] w-px flex-1 bg-border-subtle" />
            )}
          </div>
          <div className="flex-1 pb-3">
            <p className="mb-0.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
              {node.level === FIVE_WHYS_DEPTH ? "Root Cause · Why 5" : `Why ${node.level}`}
            </p>
            <p className="mb-1.5 mt-0 text-[12px] text-foreground-tertiary">{node.question}</p>
            <div className="flex items-start gap-2 rounded-[var(--r-sm)] border border-success/20 bg-success/5 px-3 py-2.5">
              <p className="m-0 flex-1 text-[13px] leading-[1.55] text-foreground-secondary">
                {node.userAnswer}
              </p>
              {node.status === "accepted" && (
                <span className="shrink-0 font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-success opacity-60">
                  Nova
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Waiting for server to generate next node */}
      {isWaitingForNext && (
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5">
              <Loader2 size={13} className="animate-spin text-primary" />
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 py-3">
            <Sparkles size={12} className="text-primary" />
            <span className="font-sans text-[12px] text-foreground-tertiary">Nova is generating Why {completedNodes.length + 1}…</span>
          </div>
        </div>
      )}

      {/* Active input node */}
      {activeNode && !isSubmitting && (
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-primary/10 font-sans text-[11px] font-bold text-primary shadow-[0_0_0_4px_var(--accent-soft)]">
              {activeNode.level}
            </div>
          </div>
          <div className="flex-1 rounded-[var(--r-lg)] border border-primary/20 bg-primary/5 p-4">
            <p className="mb-0.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
              {activeNode.level === FIVE_WHYS_DEPTH ? "Root Cause · Why 5" : `Why ${activeNode.level}`}
            </p>
            <p className="mb-3 mt-0 text-[13px] font-medium leading-[1.5] text-foreground">
              {activeNode.question}
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Enter your answer…"
              aria-label={activeNode.level === FIVE_WHYS_DEPTH ? "Root cause answer (Why 5)" : `Answer for Why ${activeNode.level}`}
              className="box-border w-full resize-none rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
            />
            {activeNode.novaSuggestion && (
              <div className="mt-2">
                <NovaSuggestionBlock
                  key={activeNode.id}
                  context={`Why ${activeNode.level} answer`}
                  suggestion={activeNode.novaSuggestion}
                  capaId={capaId}
                  suggestionId={`why-${activeNode.level}`}
                  onAccept={(content) => setDraft(content)}
                />
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!draft.trim()}
                className={cn(
                  "flex items-center gap-1.5 rounded-[var(--r-sm)] border-0 px-4 py-[9px] font-sans text-[13px] font-semibold",
                  draft.trim()
                    ? "cursor-pointer bg-[image:var(--grad-brand)] text-primary-foreground"
                    : "cursor-not-allowed border border-[var(--line-2)] bg-field text-foreground-faint",
                )}
              >
                {activeNode.level === FIVE_WHYS_DEPTH ? "Confirm Root Cause" : `Next: Why ${activeNode.level + 1} →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete banner */}
      {isDone && (
        <div className="flex items-center gap-3 rounded-[var(--r-sm)] border border-success/30 bg-success/5 px-4 py-3">
          <CheckCircle2 size={15} className="shrink-0 text-success" />
          <p className="m-0 flex-1 font-sans text-[13px] font-medium text-success">
            5 Whys complete — root cause chain established
          </p>
          <button
            type="button"
            disabled={startMutation.isPending}
            onClick={handleRestart}
            className="cursor-pointer rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-2.5 py-1 font-sans text-[11px] text-foreground-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {startMutation.isPending ? "Restarting…" : "Restart"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Fishbone visual diagram ───────────────────────────────────────────────────

function FishboneVisual({
  capaId,
  effect,
  answers,
  onAnswerChange,
}: {
  capaId: string;
  effect: string;
  answers: Record<FishboneName, string>;
  onAnswerChange: (category: FishboneName, content: string) => void;
}) {
  const topCats = fishbonePlan.slice(0, 3);  // Man, Method, Measurement
  const botCats = fishbonePlan.slice(3, 6);  // Environment, Material, Machine

  // SVG geometry
  const W = 640, H = 220;
  const spineY = 110;
  const spineX1 = 30, spineX2 = 510;
  const boneXs = [125, 250, 380];
  const boneTopY = 22, boneBotY = H - 22;
  const effectLabel = effect.length > 36 ? effect.slice(0, 34) + "…" : effect;

  function causeLabel(cat: FishboneName) {
    const v = answers[cat] || "";
    return v.length > 24 ? v.slice(0, 22) + "…" : v;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Diagram ── */}
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-elevated px-4 py-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-label="Fishbone (Ishikawa) diagram"
        >
          {/* Spine */}
          <line x1={spineX1} y1={spineY} x2={spineX2} y2={spineY}
            stroke="var(--foreground-faint)" strokeWidth="2.5" strokeOpacity="0.45" />
          {/* Arrowhead */}
          <polygon
            points={`${spineX2},${spineY - 7} ${spineX2 + 16},${spineY} ${spineX2},${spineY + 7}`}
            fill="var(--foreground-faint)" fillOpacity="0.45"
          />

          {/* Effect box */}
          <rect x={spineX2 + 16} y={spineY - 24} width="108" height="48" rx="6"
            fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth="1.2" />
          <text x={spineX2 + 70} y={spineY - 8} textAnchor="middle"
            fontSize="8.5" fontWeight="700" fill="var(--primary)" letterSpacing="0.04em">
            EFFECT
          </text>
          <text x={spineX2 + 70} y={spineY + 7} textAnchor="middle"
            fontSize="8" fill="var(--primary)" opacity="0.8">
            {effectLabel.slice(0, 18)}
          </text>
          {effectLabel.length > 18 && (
            <text x={spineX2 + 70} y={spineY + 18} textAnchor="middle"
              fontSize="8" fill="var(--primary)" opacity="0.8">
              {effectLabel.slice(18)}
            </text>
          )}

          {/* Top bones */}
          {boneXs.map((bx, i) => {
            const cat = topCats[i]?.category as FishboneName;
            const cause = causeLabel(cat);
            const bx0 = bx - 58;
            return (
              <g key={`top-${i}`}>
                <line x1={bx0} y1={boneTopY + 14} x2={bx} y2={spineY}
                  stroke="var(--foreground-faint)" strokeWidth="1.5" strokeOpacity="0.35" />
                {/* Category badge */}
                <rect x={bx0 - 44} y={boneTopY} width="44" height="16" rx="3"
                  fill="var(--primary)" fillOpacity="0.12" />
                <text x={bx0 - 22} y={boneTopY + 11} textAnchor="middle"
                  fontSize="8.5" fontWeight="800" fill="var(--primary)" letterSpacing="0.06em">
                  {topCats[i]?.category?.toUpperCase()}
                </text>
                {/* Cause text */}
                {cause && (
                  <text x={bx0 + 4} y={boneTopY + 30} fontSize="8.5"
                    fill="var(--foreground-secondary)" opacity="0.85">
                    {cause}
                  </text>
                )}
              </g>
            );
          })}

          {/* Bottom bones */}
          {boneXs.map((bx, i) => {
            const cat = botCats[i]?.category as FishboneName;
            const cause = causeLabel(cat);
            const bx0 = bx - 58;
            return (
              <g key={`bot-${i}`}>
                <line x1={bx0} y1={boneBotY - 14} x2={bx} y2={spineY}
                  stroke="var(--foreground-faint)" strokeWidth="1.5" strokeOpacity="0.35" />
                {/* Category badge */}
                <rect x={bx0 - 44} y={boneBotY - 16} width="44" height="16" rx="3"
                  fill="var(--warning)" fillOpacity="0.12" />
                <text x={bx0 - 22} y={boneBotY - 5} textAnchor="middle"
                  fontSize="8.5" fontWeight="800" fill="var(--warning)" letterSpacing="0.06em">
                  {botCats[i]?.category?.toUpperCase()}
                </text>
                {/* Cause text */}
                {cause && (
                  <text x={bx0 + 4} y={boneBotY - 20} fontSize="8.5"
                    fill="var(--foreground-secondary)" opacity="0.85">
                    {cause}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Editable cause cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {fishbonePlan.map((item, i) => (
          <div key={item.category}>
            <div className="mb-2 flex items-center gap-1.5">
              <div className={cn(
                "h-2 w-2 rounded-full",
                i < 3 ? "bg-primary/50" : "bg-warning/50",
              )} />
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {item.category}
              </p>
            </div>
            <NovaSuggestionBlock
              suggestion={item.suggestion}
              capaId={capaId}
              suggestionId={`fishbone-${item.category}`}
              onAccept={(content) => onAnswerChange(item.category, content)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Decision tree — interactive click-through ─────────────────────────────────

function DecisionTreeVisual({ nodes }: { nodes: DecisionNode[] }) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // path: array of { nodeId, answer } — last entry is the current node (answer still null)
  const [path, setPath] = useState<Array<{ nodeId: string; answer: "yes" | "no" | null }>>(
    () => [{ nodeId: nodes[0]?.id ?? "", answer: null }],
  );

  const current = path[path.length - 1];
  const currentNode = nodeMap.get(current.nodeId);
  const isDone = currentNode?.isLeaf ?? false;

  function choose(choice: "yes" | "no") {
    if (!currentNode || currentNode.isLeaf) return;
    const nextId = choice === "yes" ? currentNode.yesNodeId : currentNode.noNodeId;
    if (!nextId) return;
    setPath((prev) => [
      ...prev.slice(0, -1),
      { ...prev[prev.length - 1], answer: choice },
      { nodeId: nextId, answer: null },
    ]);
  }

  function restart() {
    setPath([{ nodeId: nodes[0]?.id ?? "", answer: null }]);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Path trail */}
      {path.length > 1 && (
        <div className="flex flex-col gap-1.5">
          {path.slice(0, -1).map(({ nodeId, answer }, i) => {
            const node = nodeMap.get(nodeId);
            return (
              <div key={nodeId} className="flex gap-3">
                <div className="flex shrink-0 flex-col items-center">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-field font-sans text-[9px] font-bold text-foreground-faint">
                    {i + 1}
                  </div>
                  <div className="my-0.5 min-h-[12px] w-px flex-1 bg-border-subtle" />
                </div>
                <div className="flex-1 pb-1">
                  <p className="m-0 text-[12px] text-foreground-tertiary">{node?.question}</p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[10px] font-semibold",
                      answer === "yes"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {answer === "yes" ? "✓ Yes" : "✗ No"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current node */}
      {currentNode && (
        <div
          className={cn(
            "rounded-[var(--r-lg)] border-2 p-5",
            isDone
              ? "border-primary/30 bg-primary/5"
              : "border-[var(--line-2)] bg-card shadow-sm",
          )}
        >
          {isDone ? (
            <>
              <p className="mb-1 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                Conclusion Reached · Step {path.length}
              </p>
              <p className="mb-3 mt-0 text-[14px] font-semibold text-foreground">
                {currentNode.question}
              </p>
              {currentNode.conclusion && (
                <p className="mb-4 mt-0 rounded-[var(--r-sm)] bg-primary/10 px-3.5 py-3 text-[13px] leading-[1.6] text-foreground-secondary">
                  {currentNode.conclusion}
                </p>
              )}
              <button
                type="button"
                onClick={restart}
                className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3.5 py-2 font-sans text-[13px] text-foreground-secondary transition-colors hover:bg-field"
              >
                ← Restart Decision Tree
              </button>
            </>
          ) : (
            <>
              <p className="mb-1.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                Step {path.length}
                {nodes.filter((n) => !n.isLeaf).length > 0
                  ? ` of ${nodes.filter((n) => !n.isLeaf).length}`
                  : ""}
              </p>
              <p className="mb-6 mt-0 text-[15px] font-semibold leading-[1.45] text-foreground">
                {currentNode.question}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => choose("yes")}
                  className="flex-1 cursor-pointer rounded-[var(--r-sm)] border border-success/40 bg-success/10 py-3 font-sans text-[13px] font-semibold text-success transition-colors hover:bg-success/20"
                >
                  ✓ Yes
                </button>
                <button
                  type="button"
                  onClick={() => choose("no")}
                  className="flex-1 cursor-pointer rounded-[var(--r-sm)] border border-destructive/40 bg-destructive/10 py-3 font-sans text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/20"
                >
                  ✗ No
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Full tree overview (collapsible) */}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 font-sans text-[11px] text-foreground-faint hover:text-foreground-tertiary">
          <ChevronRight size={12} className="transition-transform group-open:rotate-90" />
          View full tree structure
        </summary>
        <div className="mt-3 flex flex-col gap-2 border-l border-border-subtle pl-4">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className={cn(
                "rounded-[var(--r-sm)] border px-3 py-2",
                node.isLeaf
                  ? "border-primary/20 bg-primary/5"
                  : "border-border-subtle bg-elevated",
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-block font-sans text-[9px] font-semibold uppercase tracking-[0.15em]",
                  node.isLeaf ? "text-primary" : "text-foreground-faint",
                )}
              >
                {node.isLeaf ? "Conclusion" : `Branch ${index + 1}`}
              </span>
              <p className="m-0 text-[12px] text-foreground-secondary">{node.question}</p>
              {node.conclusion && (
                <p className="m-0 mt-1 text-[11px] leading-[1.5] text-foreground-tertiary">
                  {node.conclusion}
                </p>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function D3RCAPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { embedded, onStepChange, readOnly: isReadOnly } = useEightDEmbed();
  const { data: capa } = useCapa(id);

  const updateRca = useUpdateRca();
  const updateStep = useUpdateStep();
  const addAuditEvent = useAddAuditEvent();
  const openCitationPanel = useUIStore((state) => state.openCitationPanel);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const initialMethod = useMemo<RCAMethod>(() => {
    if (!capa) return "5whys";
    const preferredMethod = capa.rca.method ?? defaultMethodByType[capa.type];
    return disabledRCAMethods.has(preferredMethod) ? "5whys" : preferredMethod;
  }, [capa]);

  const [method, setMethod] = useState<RCAMethod>(initialMethod);

  // 5 Whys: driven by session (FiveWhysChain calls onSessionUpdate whenever it changes)
  const [fiveWhysSession, setFiveWhysSession] = useState<FiveWhysSession | null>(null);
  const sessionAnswers = fiveWhysSession?.nodes.map((n) => n.userAnswer ?? "") ?? [];

  const [fishboneAnswers, setFishboneAnswers] = useState<Record<FishboneName, string>>(() =>
    fishbonePlan.reduce(
      (current, item) => ({
        ...current,
        [item.category]:
          capa?.rca.fishbone?.find((cat) => cat.category === item.category)?.userEntries.join("\n") ??
          "",
      }),
      {} as Record<FishboneName, string>,
    ),
  );
  const [decisionNodes, setDecisionNodes] = useState<DecisionNode[]>(
    capa?.rca.decisionTree?.nodes?.length ? capa.rca.decisionTree.nodes : decisionTreePlan,
  );
  const [confirmedRootCause, setConfirmedRootCause] = useState(
    capa?.rca.confirmedRootCauses[0] ?? "",
  );
  const [rootCauseLoadedFor, setRootCauseLoadedFor] = useState<string | undefined>();

  useEffect(() => {
    if (!capa || rootCauseLoadedFor === capa.id) return;
    setConfirmedRootCause(capa.rca.confirmedRootCauses[0] ?? "");
    setRootCauseLoadedFor(capa.id);
  }, [capa, rootCauseLoadedFor]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const activeAnswers =
    method === "5whys"
      ? sessionAnswers
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
  const latestFiveWhysRootCause = fiveWhysSession?.nodes.find((node) => node.level === FIVE_WHYS_DEPTH)?.novaSuggestion;
  const novaRootCauseSuggestion =
    fiveWhysSession?.confirmedRootCauses[0] ??
    latestFiveWhysRootCause ??
    rootCauseSuggestionByCapaId[capa.id] ??
    rootCauseSuggestionByType[capa.type] ??
    "";

  const buildRCAData = (): RCAData => {
    const confirmedRootCauses = confirmedRootCause.trim() ? [confirmedRootCause.trim()] : [];

    if (method === "5whys") {
      // Build from the live session nodes; fall back to empty if no session yet.
      const fiveWhys: FiveWhysNode[] = (fiveWhysSession?.nodes ?? []).map((node) => ({
        id: node.id,
        level: node.level,
        question: node.question,
        novaSuggestion: node.novaSuggestion,
        novaCitations: [],
        userAnswer: node.userAnswer,
        status: (node.status as FiveWhysNode["status"]) ?? "accepted",
      }));
      return { method, fiveWhys, confirmedRootCauses };
    }

    if (method === "fishbone") {
      const fishbone: FishboneCategory[] = fishbonePlan.map((item) => ({
        category: item.category,
        novaEntries: [item.suggestion],
        userEntries: fishboneAnswers[item.category].split("\n").filter(Boolean),
        status: "accepted" as const,
      }));
      return { method, fishbone, confirmedRootCauses };
    }

    return {
      method,
      decisionTree: {
        nodes: decisionNodes,
        rootNodeId: decisionNodes[0]?.id ?? "dt-plan-1",
      },
      confirmedRootCauses,
    };
  }

  // The server does not log an audit event for updateRca, so the client routes
  // the root_cause_confirmed event through the audit POST (fire-and-forget —
  // the awaited updateRca already marks audit-events stale via invalidateWorld).
  const saveRCA = async (advance: boolean) => {
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

    try {
      await updateRca.mutateAsync({ capaId: capa.id, rca: buildRCAData(), score: previewScore });
      void addAuditEvent.mutateAsync({
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
        await updateStep.mutateAsync({ capaId: capa.id, step: "ca" });
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
    } catch (error) {
      toast.error("Could not save RCA", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  const applyNovaRootCauseSuggestion = () => {
    if (!novaRootCauseSuggestion || isReadOnly) return;
    setConfirmedRootCause(novaRootCauseSuggestion);
    void addAuditEvent.mutateAsync({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "ai_decision",
      eventType: "nova_suggestion_accepted",
      action: `Nova RCA root cause suggestion applied for ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
      after: novaRootCauseSuggestion,
      novaMetadata: {
        modelName: "Nova Mock Engine",
        modelVersion: "nova-demo-v1",
        confidenceScore: 84,
      },
    });
    toast.success("Nova root cause applied");
  }

  return (
    <EightDShell capaId={capa.id} activeStep="rca">
      <div className="flex flex-col gap-7">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-primary">
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
            {(["5whys", "fishbone", "decision_tree"] as RCAMethod[]).map((m) => {
              const isDisabled = disabledRCAMethods.has(m);

              return (
                <button
                  key={m}
                  disabled={isDisabled}
                  onClick={() => {
                    setMethod(m);
                    setConfirmedRootCause(capa.rca.confirmedRootCauses[0] ?? "");
                  }}
                  className={cn(
                    "rounded-[var(--r-sm)] border px-4 py-[7px] font-sans text-xs transition-[background,border-color,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                    method === m
                      ? "border-[var(--accent-line)] bg-[var(--accent-soft)] font-semibold text-primary"
                      : "border-[var(--line-2)] bg-field font-normal text-foreground-secondary",
                    isDisabled
                      ? "cursor-not-allowed border-[var(--line-2)] bg-field font-normal text-foreground-faint opacity-60"
                      : "cursor-pointer",
                  )}
                >
                  {methodLabel[m]}
                </button>
              );
            })}
          </div>
          <p className="mb-0 mt-2 font-sans text-[11px] text-foreground-faint">
            Fishbone and Decision Tree are temporarily disabled.
          </p>
        </div>

        {/* ── RCA content (method-specific) ───────────────────────────── */}
        {method === "5whys" && (
          <div>
            <p className="mb-4 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              5-Whys Causal Chain
            </p>
            <FiveWhysChain
              capaId={capa.id}
              onSessionUpdate={(session) => {
                setFiveWhysSession(session);
                // Auto-populate the confirmed root cause when the session completes
                if (session.status === "complete" && session.confirmedRootCauses[0] && !confirmedRootCause.trim()) {
                  setConfirmedRootCause(session.confirmedRootCauses[0]);
                }
              }}
            />
          </div>
        )}

        {method === "fishbone" && (
          <div>
            <p className="mb-4 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Fishbone (Ishikawa) Diagram
            </p>
            <FishboneVisual
              capaId={capa.id}
              effect={capa.title}
              answers={fishboneAnswers}
              onAnswerChange={(category, content) =>
                setFishboneAnswers((current) => ({ ...current, [category]: content }))
              }
            />
          </div>
        )}

        {method === "decision_tree" && (
          <div>
            <p className="mb-3 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Decision Tree
            </p>
            <DecisionTreeVisual nodes={decisionNodes} />
          </div>
        )}

        {/* ── Similar Past CAPAs ───────────────────────────────────────── */}
        {relevantCitations.length > 0 && (
          <div>
            <div className="mb-3 flex items-baseline gap-2">
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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
          <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2.5">
            <div>
              <label
                htmlFor="confirmed-root-cause"
                className="mb-1.5 block font-sans text-xs font-semibold text-foreground-secondary"
              >
                Confirmed root cause
              </label>
              <p className="m-0 font-sans text-xs text-foreground-faint">
                Summarise the systemic management-system weakness, not just the immediate event.
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={applyNovaRootCauseSuggestion}
                disabled={!novaRootCauseSuggestion}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1.5 font-sans text-xs font-semibold text-primary transition-opacity [transition-duration:var(--dur-fast)]",
                  novaRootCauseSuggestion ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                )}
              >
                <Sparkles size={13} />
                Use Nova AI Suggestion
              </button>
            )}
          </div>
          <textarea
            id="confirmed-root-cause"
            value={confirmedRootCause}
            onChange={(e) => setConfirmedRootCause(e.target.value)}
            disabled={isReadOnly}
            rows={4}
            className="box-border w-full resize-y rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:cursor-not-allowed disabled:resize-none disabled:opacity-50"
          />
        </div>

        {/* ── Blocker ──────────────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div role="alert" className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
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
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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
        {!isReadOnly && (
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
        )}

      </div>
    </EightDShell>
  );
}
