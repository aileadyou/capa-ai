import { Link } from "react-router-dom";
import { Bell, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PersonaSwitcher } from "@/components/shared/PersonaSwitcher";
import { resetDemoData, useNotificationStore, usePersonaStore, useUIStore } from "@/store";

export function TopBar() {
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const unreadCount = useNotificationStore((state) =>
    state.notifications.filter(
      (notification) => notification.recipientPersonaId === activePersonaId && !notification.read,
    ).length,
  );
  const resetOpen = useUIStore((state) => state.modals.resetDemoData ?? false);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const handleReset = () => {
    resetDemoData();
    closeModal("resetDemoData");
    toast("Reset Demo Data complete", {
      description: "All demo progress was restored to the initial mock dataset.",
    });
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur xl:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2 xl:hidden">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Coach Nova</span>
        </Link>

        <div className="hidden min-w-0 xl:block">
          <div className="text-sm font-medium">AI Coach Nova</div>
          <div className="text-xs text-muted-foreground">
            Bio Farma pitch demo · deterministic CAPA walkthrough
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <PersonaSwitcher />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/notifications">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => openModal("resetDemoData")}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Demo Data
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset Demo Data?"
        description="This clears all AI Coach Nova demo progress from localStorage and reloads the initial mock dataset."
        confirmLabel="Reset Demo Data"
        onOpenChange={(open) => (open ? openModal("resetDemoData") : closeModal("resetDemoData"))}
        onConfirm={handleReset}
      />
    </header>
  );
}

