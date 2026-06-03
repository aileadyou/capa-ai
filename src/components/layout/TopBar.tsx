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
      className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-[var(--line-2)] bg-[var(--glass-dark)] px-5 font-sans shadow-sm backdrop-blur-[20px]"
    >


      {/* Center — search */}
      <div className="flex-1 max-w-md mx-auto hidden xl:flex">
        <div
          className="flex h-9 w-full items-center gap-2 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3"
        >
          <Search size={14} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-foreground-faint" />
          <span
            className="flex-1 font-sans text-sm tracking-[-0.01em] text-foreground-faint"
          >
            Search CAPAs, findings, actions…
          </span>
          <span
            className="whitespace-nowrap rounded-[var(--r-xs)] border border-[var(--line-2)] bg-[var(--field-bg-hover)] px-1.5 py-0.5 font-sans text-[10px] text-foreground-faint"
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
          className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent text-foreground-tertiary transition-[background,border-color,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated hover:text-foreground-secondary"
        >
          <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Notification bell */}
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
          title="Notifications"
          className="relative flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent text-foreground-secondary transition-[background,border-color,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated hover:text-foreground"
        >
          <Bell size={16} strokeWidth={1.75} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 h-2 w-2 rounded-[var(--r-full)] border-[1.5px] border-background bg-primary"
            />
          )}
        </button>

        {/* Ask Nova — secondary button */}
        <button
          onClick={() => openNovaChat({})}
          aria-label="Ask Nova"
          className="flex h-[34px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 font-sans text-sm font-semibold text-primary transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-primary/20"
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
          className="flex h-8 w-8 shrink-0 cursor-default items-center justify-center rounded-[var(--r-full)] bg-[image:var(--grad-brand)] text-[11px] font-bold tracking-[0.02em] text-primary-foreground"
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
