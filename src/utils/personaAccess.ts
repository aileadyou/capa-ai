import type { PersonaID } from "@/types";

const MY_WORK_ONLY_PERSONAS = new Set<PersonaID>(["initiator", "sme"]);

export function isMyWorkOnlyPersona(personaId: PersonaID) {
  return MY_WORK_ONLY_PERSONAS.has(personaId);
}

// Only the initiator fills in the 8D investigation; every other persona gets a
// read-only view of the CAPA workspace.
export function canFillCAPA(personaId: PersonaID) {
  return personaId === "initiator";
}
