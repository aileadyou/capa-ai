import { notifications as initialNotifications } from "@/mock-data";
import type { Notification, NotificationType } from "@/types/notification";
import type { PersonaID } from "@/types/persona";

export interface NotificationFilters {
  personaId?: PersonaID;
  type?: NotificationType;
  read?: boolean;
  capaId?: string;
}

let notificationRecords: Notification[] = structuredClone(initialNotifications);

export function getNotificationsByPersona(personaId: PersonaID): Notification[] {
  return structuredClone(
    notificationRecords.filter((notification) => notification.recipientPersonaId === personaId),
  );
}

export function markAsRead(notificationId: string): Notification | undefined {
  const notification = notificationRecords.find((record) => record.id === notificationId);
  if (!notification) return undefined;

  notification.read = true;
  return structuredClone(notification);
}

export function markAllAsRead(personaId: PersonaID): Notification[] {
  notificationRecords = notificationRecords.map((notification) =>
    notification.recipientPersonaId === personaId ? { ...notification, read: true } : notification,
  );

  return getNotificationsByPersona(personaId);
}

export function addNotification(
  notification: Omit<Notification, "id" | "createdAt" | "read"> &
    Partial<Pick<Notification, "id" | "createdAt" | "read">>,
): Notification {
  const newNotification: Notification = {
    ...notification,
    id: notification.id ?? `NOTIF-${Date.now()}`,
    createdAt: notification.createdAt ?? new Date().toISOString(),
    read: notification.read ?? false,
  };

  notificationRecords = [newNotification, ...notificationRecords];
  return structuredClone(newNotification);
}

export function filterNotifications(filters: NotificationFilters): Notification[] {
  return structuredClone(
    notificationRecords.filter((notification) => {
      if (filters.personaId && notification.recipientPersonaId !== filters.personaId) return false;
      if (filters.type && notification.type !== filters.type) return false;
      if (filters.read !== undefined && notification.read !== filters.read) return false;
      if (filters.capaId && notification.capaId !== filters.capaId) return false;
      return true;
    }),
  );
}

export function resetNotificationData(): Notification[] {
  notificationRecords = structuredClone(initialNotifications);
  return structuredClone(notificationRecords);
}

