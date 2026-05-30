import type { ISO8601 } from "@/types/capa";
import type { PersonaID } from "@/types/persona";

export type NotificationType = "capa_update" | "approval" | "overdue" | "rejected" | "closed";

export interface Notification {
  id: string;
  recipientPersonaId: PersonaID;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: ISO8601;
  read: boolean;
  capaId?: string;
  actionUrl?: string;
}

