import { useLocation, useNavigate } from "react-router-dom";
import { Bell, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { resetDemoData, useNotificationStore, usePersonaStore, useUIStore } from "@/store";

const routeTitles: Record<string, string> = {
  "/": "My work",
  "/my-work": "My work",
  "/dashboard": "Dashboard",
  "/findings": "Findings",
  "/capa": "All CAPAs",
  "/capa/new": "New CAPA",
  "/audit-trail": "Audit trail",
  "/notifications": "Notifications",
  "/settings/personas": "Personas",
  "/reports": "Reports",
  "/actions/corrective": "Corrective actions",
  "/actions/preventive": "Preventive actions",
  "/actions/consolidated": "Consolidated action plan",
  "/similarity": "Similarity explorer",
  "/topics": "Topics grouping",
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.includes("/8d/problem")) return "D1 — Problem statement";
  if (pathname.includes("/8d/containment")) return "D2 — Containment";
  if (pathname.includes("/8d/rca")) return "D3 — Root cause analysis";
  if (pathname.includes("/8d/ca")) return "D4 — Corrective action";
  if (pathname.includes("/8d/pa")) return "D5 — Preventive action";
  if (pathname.includes("/8d/verification")) return "D6 — Verification";
  if (pathname.includes("/8d/signoff")) return "D7 — Sign-off";
  if (pathname.startsWith("/capa/") && !pathname.includes("/new")) return "CAPA details";
  if (pathname.startsWith("/findings/")) return "Finding details";
  return "CAPA AI";
}

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const persona = usePersonaStore((state) => state.activePersona());
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const unreadCount = useNotificationStore((state) =>
    state.notifications.filter(
      (n) => n.recipientPersonaId === activePersonaId && !n.read,
    ).length,
  );
  const openNovaChat = useUIStore((state) => state.openNovaChat);
  const resetOpen = useUIStore((state) => state.modals.resetDemoData ?? false);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const pageTitle = getPageTitle(location.pathname);

  const handleReset = () => {
    resetDemoData();
    closeModal("resetDemoData");
    toast("Demo data reset", {
      description: "All progress restored to the initial mock dataset.",
    });
  };

  return (
    <header
      className="sticky top-0 z-20"
      style={{
        height: "60px",
        display: "flex",
        alignItems: "center",
        background: "var(--glass-dark)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--line-2)",
        boxShadow: "var(--shadow-sm)",
        padding: "0 20px",
        gap: "16px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Left — page title */}
      <div className="hidden xl:block shrink-0" style={{ minWidth: 0 }}>
        <div
          aria-label={`Current page: ${pageTitle}`}
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 600,
            letterSpacing: "-0.012em",
            color: "var(--fg-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "220px",
          }}
        >
          {pageTitle}
        </div>
      </div>

      {/* Center — search */}
      <div className="flex-1 max-w-md mx-auto hidden xl:flex">
        <div
          className="flex items-center gap-2 w-full"
          style={{
            background: "var(--field-bg)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-sm)",
            padding: "0 12px",
            height: "36px",
          }}
        >
          <Search size={14} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--fg-4)", flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--fg-4)",
              letterSpacing: "-0.01em",
            }}
          >
            Search CAPAs, findings, actions…
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--fg-4)",
              background: "var(--field-bg-hover)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-xs)",
              padding: "2px 6px",
              whiteSpace: "nowrap",
            }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="ml-auto xl:ml-0 flex items-center gap-2 shrink-0">
        {/* Reset demo — subtle icon button */}
        <button
          onClick={() => openModal("resetDemoData")}
          aria-label="Reset demo data"
          title="Reset demo data"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "var(--r-sm)",
            background: "transparent",
            border: "1px solid var(--line-2)",
            color: "var(--fg-3)",
            cursor: "pointer",
            transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-3)";
          }}
        >
          <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Notification bell */}
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
          title="Notifications"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "var(--r-sm)",
            background: "transparent",
            border: "1px solid var(--line-2)",
            color: "var(--fg-2)",
            cursor: "pointer",
            position: "relative",
            transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
          }}
        >
          <Bell size={16} strokeWidth={1.75} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                borderRadius: "var(--r-full)",
                background: "var(--accent)",
                border: "1.5px solid var(--bg-1)",
              }}
            />
          )}
        </button>

        {/* Ask Nova — secondary button */}
        <button
          onClick={() => openNovaChat({})}
          aria-label="Ask Nova"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 12px",
            height: "34px",
            borderRadius: "var(--r-sm)",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-line)",
            color: "var(--accent)",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "background var(--dur-fast) var(--ease-out)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--accent) 22%, transparent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
          }}
        >
          {/* Nova spark icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M7 1.5L8.3 5.2L12 5.8L9.5 8.2L10.1 12L7 10.2L3.9 12L4.5 8.2L2 5.8L5.7 5.2L7 1.5Z"
              fill="currentColor"
            />
          </svg>
          Ask Nova
        </button>

        {/* User avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--r-full)",
            background: "var(--grad-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--on-accent)",
            cursor: "default",
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
          title={`${persona.displayName} · ${persona.role}`}
        >
          {persona.avatarInitials}
        </div>
      </div>

      {/* Reset confirm dialog */}
      <ConfirmDialog
        open={resetOpen}
        title="Reset demo data?"
        description="Clears all demo progress from localStorage and restores the initial mock dataset."
        confirmLabel="Reset"
        onOpenChange={(open) => (open ? openModal("resetDemoData") : closeModal("resetDemoData"))}
        onConfirm={handleReset}
      />
    </header>
  );
}
