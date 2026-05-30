import { create } from "zustand";
import { persist } from "zustand/middleware";
import { personas as initialPersonas } from "@/mock-data";
import type { Persona, PersonaID } from "@/types";

interface PersonaStore {
  personas: Persona[];
  activePersonaId: PersonaID;
  activePersona: () => Persona;
  loadPersonas: () => void;
  switchPersona: (personaId: PersonaID) => void;
  resetPersona: () => void;
}

const defaultPersonaId: PersonaID = "initiator";

export const usePersonaStore = create<PersonaStore>()(
  persist(
    (set, get) => ({
      personas: structuredClone(initialPersonas),
      activePersonaId: defaultPersonaId,
      activePersona: () =>
        get().personas.find((persona) => persona.id === get().activePersonaId) ??
        get().personas[0],
      loadPersonas: () => set({ personas: structuredClone(initialPersonas) }),
      switchPersona: (personaId) => set({ activePersonaId: personaId }),
      resetPersona: () =>
        set({
          personas: structuredClone(initialPersonas),
          activePersonaId: defaultPersonaId,
        }),
    }),
    {
      name: "ai-coach-nova-persona",
      partialize: (state) => ({
        activePersonaId: state.activePersonaId,
      }),
    },
  ),
);

