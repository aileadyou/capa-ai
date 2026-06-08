import { CheckCircle2, RefreshCcw, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { resetDemoData, usePersonaStore, useUIStore } from "@/store";
import type { PersonaID } from "@/types";

const personaDemoRoles: Record<PersonaID, { action: string; color: string }> = {
  initiator: {
    action: "Creates findings, drives D1–D5 workflow",
    color: "border-primary/30 bg-primary/10 text-primary",
  },
  qa_deviation: {
    action: "Reviews intake, disposes CAPAs, QA gatekeeper",
    color: "border-nova/30 bg-nova/10 text-nova",
  },
  head_of_dept: {
    action: "First approval gate in sign-off cascade",
    color: "border-severity-major/30 bg-severity-major/10 text-severity-major",
  },
  head_of_qa: {
    action: "Final approval — closes CAPA as Audit Ready",
    color: "border-status-ready/30 bg-status-ready/10 text-status-ready",
  },
  sme: {
    action: "Co-approval required for Critical severity cases",
    color: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
};

export function PersonaManagementPage() {
  const personas = usePersonaStore((state) => state.personas);
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const switchPersona = usePersonaStore((state) => state.switchPersona);
  const resetOpen = useUIStore((state) => state.modals.resetDemoData ?? false);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);

  async function handleReset() {
    try {
      await resetDemoData();
      toast("Reset Demo Data complete", {
        description: "All CAPA and workflow state has been restored to mock defaults.",
      });
    } catch (error) {
      toast.error("Could not reset demo data", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      closeModal("resetDemoData");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Persona Management</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Switch the active demo persona to explore AI Coach Nova from different roles. The active persona controls which approval gates are visible, which CAPAs appear in your queue, and which notification streams are shown.
          </p>
        </div>
        <Button variant="outline" onClick={() => openModal("resetDemoData")}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset Demo Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personas.map((persona) => {
          const isActive = persona.id === activePersonaId;
          const meta = personaDemoRoles[persona.id as PersonaID];

          return (
            <Card
              key={persona.id}
              className={`cursor-pointer transition ${
                isActive
                  ? "border-primary ring-1 ring-primary/40 shadow-md"
                  : "hover:border-primary/40 hover:shadow-sm"
              }`}
              onClick={() => switchPersona(persona.id as PersonaID)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback
                        className={`text-sm font-semibold ${isActive ? "bg-primary text-primary-on" : "bg-nova/10 text-nova"}`}
                      >
                        {persona.avatarInitials ?? <UserRound className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{persona.displayName}</CardTitle>
                      <div className="mt-0.5 text-xs text-muted-foreground">{persona.role}</div>
                    </div>
                  </div>
                  {isActive && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground">Department</span>
                    {persona.department}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground">NIK</span>
                    <span className="font-sans text-xs">{persona.nik}</span>
                  </div>
                </div>

                {meta && (
                  <Badge variant="outline" className={meta.color}>
                    {meta.action}
                  </Badge>
                )}

                {isActive ? (
                  <div className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Currently active persona
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => switchPersona(persona.id as PersonaID)}>
                    Switch to {persona.displayName.split(" ")[0]}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-nova" />
            Demo Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Persona switching is demo-only. No real authentication, SSO, or session management is implemented.
          </p>
          <p>
            The <span className="font-medium text-foreground">SME</span> persona (Dr. Ahmad Pratomo) is reserved for Critical severity cases, which require co-approval. The three primary demo cases use Major severity and do not require SME sign-off.
          </p>
          <p>
            Active persona persists across browser refresh via localStorage. Use <span className="font-sans font-medium text-foreground">Reset Demo Data</span> to restore all CAPA workflows to their initial mock state.
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        title="Reset Demo Data?"
        description="This will clear all CAPA workflow progress and restore the original mock data. Your current step, suggestions, and approvals will be lost."
        confirmLabel="Reset Demo Data"
        onConfirm={handleReset}
        onOpenChange={(open) => {
          if (!open) closeModal("resetDemoData");
        }}
      />
    </div>
  );
}
