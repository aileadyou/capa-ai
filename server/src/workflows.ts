// Server-side copy of src/config/workflows.ts — the declarative approval-cycle
// model. Kept standalone (no `@/types`) so the server has zero frontend imports.

type CAPAType = "deviation" | "audit" | "complaint";
type EightDStep = "problem" | "containment" | "rca" | "ca" | "pa" | "verification" | "signoff";
type ApprovalStage = "plan" | "actual" | "analysis" | "closure" | "signoff";
type PersonaID = "initiator" | "qa_deviation" | "head_of_dept" | "head_of_qa" | "sme";

// `capa` is intentionally loose here — these predicates only read a couple of
// fields and the server keeps the full case as a JSON blob.
type Capa = any;

export interface GatedApprover {
  personaId: PersonaID;
  when: (c: Capa) => boolean;
  insertBeforeLast?: boolean;
  label?: string;
}

export interface ApprovalCycleDef {
  stage: ApprovalStage;
  title: string;
  subtitle?: string;
  base: PersonaID[];
  gated?: GatedApprover[];
  attachAfter: EightDStep;
  final?: boolean;
  roleLabels?: Partial<Record<PersonaID, string>>;
}

export interface WorkflowConfig {
  type: CAPAType;
  label: string;
  intake: { disposisi?: boolean; acceptGate?: boolean; scheduleContext?: boolean };
  twoPhase?: boolean;
  cycles: ApprovalCycleDef[];
  loops?: { customerResponse?: boolean; closingCompleteness?: boolean; reportBack?: boolean };
}

const isMajorOrCritical = (c: Capa) =>
  c.impact?.severity === "Major" || c.impact?.severity === "Critical";

export const WORKFLOWS: Record<CAPAType, WorkflowConfig> = {
  deviation: {
    type: "deviation",
    label: "Deviation",
    intake: { disposisi: true },
    cycles: [
      {
        stage: "signoff",
        title: "CAPA Sign-Off Approval",
        subtitle: "All three must approve — sign in any order",
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
        subtitle: "All three must approve — sign in any order",
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
        subtitle: "All three must approve — sign in any order",
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
        subtitle: "QA verification — required for closure",
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
        subtitle: "All three must approve — sign in any order",
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
        subtitle: "All three must approve — sign in any order",
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

export function getWorkflow(type: CAPAType): WorkflowConfig {
  return WORKFLOWS[type];
}

/** Resolve a cycle's ordered approver chain, applying conditional gates. */
export function resolveCycleApprovers(cycle: ApprovalCycleDef, capa: Capa): PersonaID[] {
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

export function getCycleByStage(capa: Capa, stage: ApprovalStage): ApprovalCycleDef | undefined {
  return WORKFLOWS[capa.type as CAPAType].cycles.find((c) => c.stage === stage);
}

export function getFinalStage(capa: Capa): ApprovalStage {
  return WORKFLOWS[capa.type as CAPAType].cycles.find((c) => c.final)?.stage ?? "signoff";
}
