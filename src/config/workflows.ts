import type { ApprovalStage, CAPACase, CAPAType, EightDStep } from "@/types";
import type { PersonaID } from "@/types/persona";

// ─────────────────────────────────────────────────────────────────────────────
// Workflow-Config layer
//
// The app runs ONE 8D spine (problem → containment → rca → ca → pa →
// verification → signoff) for every CAPA. Bio Farma's RFI documents three
// genuinely different *approval* shapes (BPMN Gambar 1–4). Rather than fork the
// step list per type, we keep the 8D spine and attach declarative **approval
// cycles** at existing step seams, plus flag intake behaviour and loops.
//
//   deviation → single classification-gated sign-off cascade
//   audit     → two-phase CAPA Plan → CAPA Actual lifecycle, then QA closure
//   complaint → Round-1 analysis approval, then Round-2 closure approval
// ─────────────────────────────────────────────────────────────────────────────

export interface GatedApprover {
  personaId: PersonaID;
  when: (c: CAPACase) => boolean;
  /** Insert before the last base approver (default) vs. append at the end. */
  insertBeforeLast?: boolean;
  /** Why this approver is conditionally present (shown as a chip). */
  label?: string;
}

export interface ApprovalCycleDef {
  stage: ApprovalStage;
  title: string;
  subtitle?: string;
  /** Ordered base approver chain. */
  base: PersonaID[];
  /** Conditional approvers spliced in when their predicate holds. */
  gated?: GatedApprover[];
  /** 8D step seam where this cycle surfaces. */
  attachAfter: EightDStep;
  /** The closing cycle — triggers closeCAPA and the score ≥ 80 hard gate. */
  final?: boolean;
  /** Context-specific role relabels (same persona, different hat per workflow). */
  roleLabels?: Partial<Record<PersonaID, string>>;
}

export interface WorkflowConfig {
  type: CAPAType;
  label: string;
  intake: { disposisi?: boolean; acceptGate?: boolean; scheduleContext?: boolean };
  /** Audit: CAPA Plan → CAPA Actual two-phase lifecycle. */
  twoPhase?: boolean;
  cycles: ApprovalCycleDef[];
  loops?: { customerResponse?: boolean; closingCompleteness?: boolean; reportBack?: boolean };
}

const isMajorOrCritical = (c: CAPACase) =>
  c.impact.severity === "Major" || c.impact.severity === "Critical";

export const WORKFLOWS: Record<CAPAType, WorkflowConfig> = {
  deviation: {
    type: "deviation",
    label: "Deviation",
    intake: { disposisi: true },
    cycles: [
      {
        stage: "signoff",
        title: "CAPA Sign-Off Approval",
        subtitle: "Classification-gated approval cascade",
        base: ["head_of_dept", "qa_deviation", "head_of_qa"],
        gated: [
          {
            personaId: "sme",
            when: isMajorOrCritical,
            insertBeforeLast: true,
            label: "SME co-approval — required for Major / Critical",
          },
        ],
        attachAfter: "signoff",
        final: true,
        roleLabels: {
          head_of_dept: "Department Head",
          qa_deviation: "QA Deviation",
          head_of_qa: "Division Head — QA",
        },
      },
    ],
  },
  audit: {
    type: "audit",
    label: "Audit",
    intake: { scheduleContext: true },
    twoPhase: true,
    cycles: [
      {
        stage: "plan",
        title: "CAPA Plan Approval",
        subtitle: "Planned actions → Dept Head → QA → QA Division Head",
        base: ["head_of_dept", "qa_deviation", "head_of_qa"],
        attachAfter: "pa",
        roleLabels: {
          head_of_dept: "Department Head",
          qa_deviation: "QA — GMP & DIRA Compliance",
          head_of_qa: "QA Division Head",
        },
      },
      {
        stage: "actual",
        title: "CAPA Actual Approval",
        subtitle: "Executed actions → Dept Head → QA → QA Division Head",
        base: ["head_of_dept", "qa_deviation", "head_of_qa"],
        attachAfter: "verification",
        roleLabels: {
          head_of_dept: "Department Head",
          qa_deviation: "QA — GMP & DIRA Compliance",
          head_of_qa: "QA Division Head",
        },
      },
      {
        stage: "closure",
        title: "QA Final Verification & Closure",
        subtitle: "Closing-completeness check → QA verification → close",
        base: ["qa_deviation"],
        attachAfter: "signoff",
        final: true,
        roleLabels: {
          qa_deviation: "QA — GMP & DIRA Compliance",
        },
      },
    ],
    loops: { closingCompleteness: true, reportBack: true },
  },
  complaint: {
    type: "complaint",
    label: "Complaint",
    intake: { acceptGate: true },
    cycles: [
      {
        stage: "analysis",
        title: "Round 1 — Analysis Approval",
        subtitle: "QA Head of Department → QA Complaint → QA Head of Division",
        base: ["head_of_dept", "qa_deviation", "head_of_qa"],
        attachAfter: "pa",
        roleLabels: {
          head_of_dept: "QA Head of Department",
          qa_deviation: "QA — Complaint Handling",
          head_of_qa: "QA Head of Division",
        },
      },
      {
        stage: "closure",
        title: "Round 2 — Closure Approval",
        subtitle: "QA Head of Department → QA Complaint → QA Head of Division",
        base: ["head_of_dept", "qa_deviation", "head_of_qa"],
        attachAfter: "signoff",
        final: true,
        roleLabels: {
          head_of_dept: "QA Head of Department",
          qa_deviation: "QA — Complaint Handling",
          head_of_qa: "QA Head of Division",
        },
      },
    ],
    loops: { customerResponse: true },
  },
};

// ── Resolution helpers ───────────────────────────────────────────────────────

export function getWorkflow(type: CAPAType): WorkflowConfig {
  return WORKFLOWS[type];
}

/** Resolve a cycle's ordered approver chain, applying conditional gates. */
export function resolveCycleApprovers(cycle: ApprovalCycleDef, capa: CAPACase): PersonaID[] {
  const chain = [...cycle.base];
  for (const gate of cycle.gated ?? []) {
    if (!gate.when(capa)) continue;
    if (gate.insertBeforeLast ?? true) {
      chain.splice(Math.max(chain.length - 1, 0), 0, gate.personaId);
    } else {
      chain.push(gate.personaId);
    }
  }
  return chain;
}

export function getCyclesForCapa(capa: CAPACase): ApprovalCycleDef[] {
  return WORKFLOWS[capa.type].cycles;
}

export function getCycleByStage(
  capa: CAPACase,
  stage: ApprovalStage,
): ApprovalCycleDef | undefined {
  return WORKFLOWS[capa.type].cycles.find((c) => c.stage === stage);
}

/** The single approval cycle (if any) that surfaces at a given 8D step seam. */
export function getCycleAtSeam(
  capa: CAPACase,
  step: EightDStep,
): ApprovalCycleDef | undefined {
  return WORKFLOWS[capa.type].cycles.find((c) => c.attachAfter === step);
}

/** Stage of the closing cycle — deviation: "signoff"; audit/complaint: "closure". */
export function getFinalStage(capa: CAPACase): ApprovalStage {
  return WORKFLOWS[capa.type].cycles.find((c) => c.final)?.stage ?? "signoff";
}

export function isFinalStage(capa: CAPACase, stage: ApprovalStage): boolean {
  return getCycleByStage(capa, stage)?.final === true;
}

/** Context role label for an approver within a cycle (falls back to persona role). */
export function approverRoleLabel(
  cycle: ApprovalCycleDef,
  personaId: PersonaID,
  fallback: string,
): string {
  return cycle.roleLabels?.[personaId] ?? fallback;
}
