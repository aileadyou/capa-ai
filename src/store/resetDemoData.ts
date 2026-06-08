// Demo reset now reseeds the server database (the source of truth for CAPA,
// audit, and notification data) and drops the remaining client-only state:
// persona selection, UI modals/panels, and persisted localStorage keys. Every
// React Query cache is then invalidated so views refetch the fresh seed.

import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { clearDemoStorage } from "@/store/storageKeys";
import { usePersonaStore } from "@/store/usePersonaStore";
import { useUIStore } from "@/store/useUIStore";

export async function resetDemoData() {
  await api.resetDemo();
  clearDemoStorage();
  usePersonaStore.getState().resetPersona();
  useUIStore.getState().resetUI();
  await queryClient.invalidateQueries();
}
