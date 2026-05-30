import { create } from "zustand";
import { persist } from "zustand/middleware";
import { notifications as initialNotifications } from "@/mock-data";
import type { Notification } from "@/types/notification";
import type { PersonaID } from "@/types/persona";

interface NotificationStore {
  notifications: Notification[];
  getNotificationsByPersona: (personaId: PersonaID) => Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "read"> &
      Partial<Pick<Notification, "id" | "createdAt" | "read">>,
  ) => Notification;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (personaId: PersonaID) => void;
  resetNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: structuredClone(initialNotifications),
      getNotificationsByPersona: (personaId) =>
        get().notifications.filter((notification) => notification.recipientPersonaId === personaId),
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: notification.id ?? `NOTIF-${Date.now()}`,
          createdAt: notification.createdAt ?? new Date().toISOString(),
          read: notification.read ?? false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));

        return newNotification;
      },
      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        })),
      markAllAsRead: (personaId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.recipientPersonaId === personaId
              ? { ...notification, read: true }
              : notification,
          ),
        })),
      resetNotifications: () => set({ notifications: structuredClone(initialNotifications) }),
    }),
    {
      name: "ai-coach-nova-notifications",
    },
  ),
);

