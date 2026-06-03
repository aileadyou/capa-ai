import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  Clock,
  FileCheck2,
  Mail,
  MailOpen,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterSearchInput } from "@/components/shared/FilterControls";
import { useNotificationStore, usePersonaStore } from "@/store";
import type { Notification, NotificationType } from "@/types/notification";
import { formatDateTime } from "@/utils/formatters";

const allValue = "all";

type TabFilter = "all" | "unread" | NotificationType;

const tabs: { value: TabFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "capa_update", label: "CAPA Updates" },
  { value: "approval", label: "Approvals" },
  { value: "overdue", label: "Overdue" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

function typeIcon(type: NotificationType) {
  const icons: Record<NotificationType, React.ReactNode> = {
    capa_update: <FileCheck2 className="h-4 w-4 text-primary" />,
    approval: <ShieldCheck className="h-4 w-4 text-status-investigation" />,
    overdue: <AlertTriangle className="h-4 w-4 text-severity-critical" />,
    rejected: <XCircle className="h-4 w-4 text-severity-major" />,
    closed: <CheckCheck className="h-4 w-4 text-status-ready" />,
  };
  return icons[type];
}

function typeLabel(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    capa_update: "CAPA Update",
    approval: "Approval",
    overdue: "Overdue",
    rejected: "Rejected",
    closed: "Closed",
  };
  return labels[type];
}

function typeBadgeClass(type: NotificationType) {
  const classes: Record<NotificationType, string> = {
    capa_update: "border-primary/30 bg-primary/10 text-primary",
    approval: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
    overdue: "border-severity-critical/30 bg-severity-critical/10 text-severity-critical",
    rejected: "border-severity-major/30 bg-severity-major/10 text-severity-major",
    closed: "border-status-ready/30 bg-status-ready/10 text-status-ready",
  };
  return classes[type];
}

export function NotificationCenterPage() {
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const activePersona = usePersonaStore((state) => state.activePersona);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const [tabFilter, setTabFilter] = useState<TabFilter>("all");
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const personaNotifications = useMemo(
    () =>
      [...notifications]
        .filter((n) => n.recipientPersonaId === activePersonaId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [activePersonaId, notifications],
  );

  const unreadCount = useMemo(
    () => personaNotifications.filter((n) => !n.read).length,
    [personaNotifications],
  );

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return personaNotifications.filter((n) => {
      if (tabFilter === "unread" && n.read) return false;
      if (
        tabFilter !== "all" &&
        tabFilter !== "unread" &&
        n.type !== tabFilter
      )
        return false;

      if (!normalizedQuery) return true;

      return [n.id, n.title, n.description, n.capaId, n.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [personaNotifications, query, tabFilter]);

  const countByType = useMemo(() => {
    const counts: Record<string, number> = { all: personaNotifications.length, unread: unreadCount };
    for (const n of personaNotifications) {
      counts[n.type] = (counts[n.type] ?? 0) + 1;
    }
    return counts;
  }, [personaNotifications, unreadCount]);

  function handleMarkAllRead() {
    markAllAsRead(activePersonaId);
    toast.success("All notifications marked as read", {
      description: `${unreadCount} notifications updated for ${activePersona().displayName}.`,
    });
  }

  function handleMarkRead(notificationId: string) {
    markAsRead(notificationId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Inbox for approvals, overdue actions, CAPA updates, and closure
            events for{" "}
            <span className="font-medium text-foreground">
              {activePersona().displayName}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings((prev) => !prev)}
            aria-expanded={showSettings}
          >
            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
            Settings
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Total
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {personaNotifications.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Unread
            </div>
            <div className="mt-2 text-2xl font-semibold text-severity-major">
              {unreadCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Approvals
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {countByType.approval ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Overdue
            </div>
            <div className="mt-2 text-2xl font-semibold text-severity-critical">
              {countByType.overdue ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "CAPA Updates",
                  description:
                    "Receive notifications when CAPA records are created or updated",
                },
                {
                  label: "Approval Requests",
                  description:
                    "Receive notifications when your approval is required",
                },
                {
                  label: "Overdue Alerts",
                  description:
                    "Receive alerts when actions or CAPAs are overdue",
                },
                {
                  label: "Closure Notifications",
                  description:
                    "Receive notifications when CAPAs are closed as Audit Ready",
                },
                {
                  label: "Email Digest",
                  description: "Receive a daily email summary of notifications",
                },
                {
                  label: "Desktop Notifications",
                  description: "Show browser push notifications for urgent items",
                },
              ].map((setting) => (
                <div
                  key={setting.label}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="mt-0.5">
                    <div className="h-5 w-9 rounded-full bg-primary/80 p-0.5">
                      <div className="ml-auto h-4 w-4 rounded-full bg-[var(--on-accent)]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{setting.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {setting.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              These settings are mocked in this frontend demo. No real
              notifications are sent.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTabFilter(tab.value)}
            aria-pressed={tabFilter === tab.value}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              tabFilter === tab.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {(countByType[tab.value] ?? 0) > 0 && (
              <span
                className={`ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  tabFilter === tab.value
                    ? "bg-primary text-primary-on"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {countByType[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        <FilterSearchInput
          value={query}
          onChange={setQuery}
          ariaLabel="Search notifications"
          placeholder="Search notifications by title, description, or CAPA ID"
        />
      </div>

      <div
        className="space-y-2"
        aria-live="polite"
        aria-label={`${filteredNotifications.length} notifications shown`}
      >
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description={
              tabFilter === "unread"
                ? "All notifications have been read. Nice work!"
                : `No ${tabFilter === "all" ? "" : typeLabel(tabFilter as NotificationType).toLowerCase() + " "}notifications for ${activePersona().displayName}.`
            }
          />
        ) : (
          filteredNotifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${!notification.read ? "border-l-4 border-l-primary bg-primary/[0.02]" : ""}`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                    <div className="mt-1 flex-shrink-0" aria-hidden="true">
                      {typeIcon(notification.type)}
                    </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={`text-sm ${!notification.read ? "font-semibold" : "font-medium text-muted-foreground"}`}
                    >
                      {notification.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={typeBadgeClass(notification.type)}
                    >
                      {typeLabel(notification.type)}
                    </Badge>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatDateTime(notification.createdAt)}
                    </span>
                    {notification.capaId && (
                      <Link
                        to={notification.actionUrl ?? `/capa/${notification.capaId}`}
                        className="inline-flex items-center gap-1 font-sans text-primary hover:underline"
                      >
                        {notification.capaId}
                        <ChevronRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      title="Mark as read"
                      aria-label={`Mark ${notification.title} as read`}
                    >
                      <MailOpen className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                  {notification.read && (
                    <Mail className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                  )}
                  {notification.capaId && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to={
                          notification.actionUrl ??
                          `/capa/${notification.capaId}`
                        }
                        aria-label={`Open ${notification.capaId}`}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
