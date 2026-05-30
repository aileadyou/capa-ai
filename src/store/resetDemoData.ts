import { clearDemoStorage } from "@/store/storageKeys";
import { useAuditTrailStore } from "@/store/useAuditTrailStore";
import { useCapaStore } from "@/store/useCapaStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { usePersonaStore } from "@/store/usePersonaStore";
import { useUIStore } from "@/store/useUIStore";

export function resetDemoData() {
  clearDemoStorage();
  usePersonaStore.getState().resetPersona();
  useCapaStore.getState().resetCAPAStore();
  useAuditTrailStore.getState().resetAuditTrail();
  useNotificationStore.getState().resetNotifications();
  useUIStore.getState().resetUI();
}

