import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePersonaStore } from "@/store/usePersonaStore";
import type { PersonaID } from "@/types";

interface AuthStore {
  isLoggedIn: boolean;
  login: (personaId: PersonaID) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,

      login: (personaId) => {
        usePersonaStore.getState().switchPersona(personaId);
        set({ isLoggedIn: true });
      },

      logout: () => {
        usePersonaStore.getState().resetPersona();
        set({ isLoggedIn: false });
      },
    }),
    {
      name: "capa-ai-auth",
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn }),
    },
  ),
);
