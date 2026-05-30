import type { AuditEvent } from "@/types/audit";
import type { Finding } from "@/types/finding";
import type { PersonaID } from "@/types/persona";

export type ISO8601 = string;

export type CAPAType = "deviation" | "audit" | "complaint";

export type Severity = "Minor" | "Major" | "Critical";

export type EightDStep =
  | "problem"
  | "containment"
  | "rca"
  | "ca"
  | "pa"
  | "verification"
  | "signoff";

export type CAPAStatus = "draft" | "disposisi" | "investigation" | "approval" | "closed";

export type ActionStatus = "open" | "in_progress" | "completed" | "overdue" | "verified";

export type RCAMethod = "5whys" | "fishbone" | "decision_tree";

export type NovaSuggestionStatus = "pending" | "accepted" | "edited" | "replaced";

export interface Attachment {
  name: string;
  type: string;
  url: string;
}

export interface DeviationPreFill {
  source: "Bizzmine";
  deviationId: string;
  reportedAt: ISO8601;
  occurredAt: ISO8601;
  location: {
    department: string;
    area: string;
    line: string;
    equipmentId: string;
  };
  initiator: {
    name: string;
    role: string;
    nik: string;
  };
  initialObservation: string;
  affectedBatches: string[];
  attachments: Attachment[];
  sopReferences: string[];
  initialSeverity?: Severity;
}

export interface AuditPreFill {
  source: "Q100+";
  findingId: string;
  auditId: string;
  auditType: "internal" | "external";
  reportedAt: ISO8601;
  auditDate: ISO8601;
  auditor: {
    name: string;
    organization: string;
  };
  auditee: {
    department: string;
    contactPerson: string;
  };
  findingCategory: string;
  findingDescription: string;
  regulationReference: string[];
  severity: Severity;
  sopReferences: string[];
}

export interface ComplaintPreFill {
  source: "Bizzmine-Complaint";
  complaintId: string;
  reportedAt: ISO8601;
  customer: {
    name: string;
    type: "distributor" | "hospital" | "regulator" | "end_user";
  };
  product: {
    name: string;
    lotNumber: string;
    expiryDate: string;
  };
  complaintType: string;
  description: string;
  initialSeverity: Severity;
  attachments: Attachment[];
}

export type PreFillContext = DeviationPreFill | AuditPreFill | ComplaintPreFill;

export interface QualityScore {
  problemSpecificity: number;
  rootCauseDepth: number;
  effectiveness: number;
  containment: number;
  total: number;
  isAuditReady: boolean;
}

export type QualityScoreCategory = keyof Omit<QualityScore, "total" | "isAuditReady">;

export interface ScoreLiftTip {
  field: string;
  suggestion: string;
  scoreGain: number;
  subScore: QualityScoreCategory;
}

export interface ImpactFactor {
  factor: string;
  value: string;
  weight: number;
  rationale: string;
}

export interface ImpactClassification {
  severity: Severity;
  totalWeight: number;
  factors: ImpactFactor[];
  rationale: string;
  computedAt: ISO8601;
}

export type GateQuestionID =
  | "observation"
  | "scope"
  | "impact"
  | "containment"
  | "cause_confirmation"
  | "effectiveness_criteria";

export interface GateAnswer {
  questionId: GateQuestionID;
  question: string;
  answer: string;
  novaScoreContribution: number;
  needsImprovement: boolean;
  improvementHint?: string;
}

export interface KGCitation {
  deviationId: string;
  capaId: string;
  similarityScore: number;
  rootCause: string;
  correctiveAction: string;
  year: number;
  outcome: "Effective" | "Recurred" | "Ongoing";
  sourceType: CAPAType;
}

export interface FiveWhysNode {
  id: string;
  level: number;
  question: string;
  novaSuggestion: string;
  novaCitations: KGCitation[];
  userAnswer: string;
  status: NovaSuggestionStatus;
}

export interface FishboneCategory {
  category: "Man" | "Machine" | "Material" | "Method" | "Measurement" | "Environment";
  novaEntries: string[];
  userEntries: string[];
  status: NovaSuggestionStatus;
}

export interface DecisionNode {
  id: string;
  question: string;
  yesNodeId?: string;
  noNodeId?: string;
  isLeaf: boolean;
  conclusion?: string;
}

export interface RCAData {
  method: RCAMethod;
  fiveWhys?: FiveWhysNode[];
  fishbone?: FishboneCategory[];
  decisionTree?: {
    nodes: DecisionNode[];
    rootNodeId: string;
  };
  confirmedRootCauses: string[];
}

export interface NovaSuggestion {
  id: string;
  context: string;
  content: string;
  citations: KGCitation[];
  status: NovaSuggestionStatus;
  userEditedContent?: string;
}

export interface CorrectiveAction {
  id: string;
  capaId: string;
  description: string;
  pic: string;
  dueDate: ISO8601;
  linkedRootCause: string;
  verificationMethod: string;
  status: ActionStatus;
  completedAt?: ISO8601;
  novaGenerated: boolean;
  novaSuggestionStatus?: NovaSuggestionStatus;
}

export interface PreventiveAction {
  id: string;
  capaId: string;
  description: string;
  targetDate: ISO8601;
  pic: string;
  status: ActionStatus;
  completedAt?: ISO8601;
  novaGenerated: boolean;
  novaSuggestionStatus?: NovaSuggestionStatus;
}

export interface VerificationData {
  method?: "re_sampling" | "process_review" | "batch_trend" | "em_re_test";
  result?: string;
  evidenceFileNames: string[];
  verifiedAt?: ISO8601;
  verifiedBy?: PersonaID;
}

export interface ApprovalEvent {
  approverPersonaId: PersonaID;
  approverName: string;
  role: string;
  decision: "approved" | "rejected" | "pending";
  notes?: string;
  signedAt?: ISO8601;
}

export interface Disposisi {
  reviewerPersonaId: PersonaID;
  assignedTo: PersonaID;
  severity: Severity;
  rationale: string;
  dispositionAt: ISO8601;
}

export interface CAPACase {
  id: string;
  findingId: Finding["id"];
  type: CAPAType;
  title: string;
  preFill: PreFillContext;
  gateAnswers: GateAnswer[];
  score: QualityScore;
  impact: ImpactClassification;
  rca: RCAData;
  correctiveActions: CorrectiveAction[];
  preventiveActions: PreventiveAction[];
  verification: VerificationData;
  approvals: ApprovalEvent[];
  auditEvents: AuditEvent[];
  suggestions: NovaSuggestion[];
  status: CAPAStatus;
  currentStep: EightDStep;
  createdAt: ISO8601;
  updatedAt: ISO8601;
  createdBy: PersonaID;
  assignedTo: PersonaID;
  department: string;
  disposisi?: Disposisi;
}

