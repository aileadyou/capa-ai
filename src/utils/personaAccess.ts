import type { CAPACase, CAPAStatus, PersonaID } from "@/types";

const MY_WORK_ONLY_PERSONAS = new Set<PersonaID>(["initiator", "sme"]);

export function isMyWorkOnlyPersona(personaId: PersonaID) {
  return MY_WORK_ONLY_PERSONAS.has(personaId);
}

// ── Role gate: who may fill a CAPA ───────────────────────────────────────────
// Only the Initiator persona fills in the 8D investigation. Every other persona
// (QA, Department Head, SME, Section Head, QA Manager, …) gets a strictly
// read-only view of the CAPA workspace.
export function canFillCAPA(personaId: PersonaID) {
  return personaId === "initiator";
}

// ── Intake gate: when the 8D investigation is unlocked ───────────────────────
// Per the RFI flow, the Initiator cannot start the 8D until the finding clears
// intake review — i.e. BOTH the QA reviewer and the Department Head accept it.
// Status → gate mapping:
//   • investigation / approval / closed → intake already cleared (8D unlocked)
//   • draft / pending_review / rejected → still locked (not accepted yet)
//   • revision_requested → ambiguous: an intake re-work request keeps it locked,
//     but a late-stage approval rejection lands here *after* intake cleared. We
//     distinguish the two by checking whether every intake reviewer accepted.
const INTAKE_CLEARED_STATUSES: CAPAStatus[] = ["investigation", "approval", "closed"];

export function isIntakeCleared(
  capa: Pick<CAPACase, "status" | "intakeReviews">,
): boolean {
  if (INTAKE_CLEARED_STATUSES.includes(capa.status)) return true;
  if (capa.status === "revision_requested") {
    return Boolean(capa.intakeReviews?.every((review) => review.decision === "accepted"));
  }
  return false;
}

// ── Combined edit gate ───────────────────────────────────────────────────────
// The active persona may EDIT the 8D steps only when all three hold:
//   1. they are the Initiator (role gate),
//   2. the case is not closed (closed CAPAs are read-only for everyone), and
//   3. intake review has cleared (QA + Department Head accepted).
// Route guards and the CAPA workspace both consume this single helper, so the
// access rule lives in exactly one place.
export function canEditCAPA(
  personaId: PersonaID,
  capa: Pick<CAPACase, "status" | "intakeReviews"> | undefined,
): boolean {
  if (!capa) return false;
  if (!canFillCAPA(personaId)) return false;
  if (capa.status === "closed") return false;
  return isIntakeCleared(capa);
}
