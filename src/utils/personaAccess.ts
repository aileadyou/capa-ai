import type { PersonaID } from "@/types";

const MY_WORK_ONLY_PERSONAS = new Set<PersonaID>(["initiator", "sme"]);

export function isMyWorkOnlyPersona(personaId: PersonaID) {
  return MY_WORK_ONLY_PERSONAS.has(personaId);
}
