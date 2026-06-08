import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { MyWorkPage } from "@/pages/nova/MyWorkPage";
import { PersonaManagementPage } from "@/pages/nova/PersonaManagementPage";
import { AuditTrailPage } from "@/pages/nova/AuditTrailPage";
import { CapaDetailPage } from "@/pages/nova/CapaDetailPage";
import { DashboardPage } from "@/pages/nova/DashboardPage";
import { CapaIntakePage } from "@/pages/nova/CapaIntakePage";
import { CapaListPage } from "@/pages/nova/CapaListPage";
import { ConsolidatedActionPlanPage } from "@/pages/nova/ConsolidatedActionPlanPage";
import { CorrectiveActionsPage } from "@/pages/nova/CorrectiveActionsPage";
import { D2ContainmentPage } from "@/pages/nova/eight-d/D2ContainmentPage";
import { D1ProblemPage } from "@/pages/nova/eight-d/D1ProblemPage";
import { D3RCAPage } from "@/pages/nova/eight-d/D3RCAPage";
import { D4CorrectiveActionPage } from "@/pages/nova/eight-d/D4CorrectiveActionPage";
import { D5PreventiveActionPage } from "@/pages/nova/eight-d/D5PreventiveActionPage";
import { D6VerificationPage } from "@/pages/nova/eight-d/D6VerificationPage";
import { D7SignOffPage } from "@/pages/nova/eight-d/D7SignOffPage";
import { FindingDetailPage } from "@/pages/nova/FindingDetailPage";
import { FindingsListPage } from "@/pages/nova/FindingsListPage";
import { PreventiveActionsPage } from "@/pages/nova/PreventiveActionsPage";
import { SimilarityExplorerPage } from "@/pages/nova/SimilarityExplorerPage";
import { TopicsGroupingPage } from "@/pages/nova/TopicsGroupingPage";
import { NotificationCenterPage } from "@/pages/nova/NotificationCenterPage";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { usePersonaStore } from "@/store";
import { useCapa } from "@/hooks/api";
import { canEditCAPA, canFillCAPA, isMyWorkOnlyPersona } from "@/utils/personaAccess";

function CreateGuard({ children }: { children: React.ReactNode }) {
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);

  // Role gate: only the Initiator can open the CAPA intake wizard. Every other
  // persona that deep-links to /capa/new is bounced to the findings list (the
  // Create affordances are already hidden for them in the UI).
  if (!canFillCAPA(activePersonaId)) {
    return <Navigate to="/findings" replace />;
  }
  return <>{children}</>;
}

function FillGuard({ children }: { children: React.ReactNode }) {
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const { id } = useParams();
  const { data: capa } = useCapa(id);

  // Role gate: only the Initiator can reach the 8D fill workspace.
  if (!canFillCAPA(activePersonaId)) {
    return <Navigate to={id ? `/capa/${id}` : "/capa"} replace />;
  }
  // Lifecycle gate: even the Initiator can't fill until intake clears (QA +
  // Department Head accepted) and not after the case is closed. Bounce to the
  // CAPA hub, which surfaces the correct banner / read-only view.
  if (capa && !canEditCAPA(activePersonaId, capa)) {
    return <Navigate to={`/capa/${id}`} replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const dashboardAllowed = !isMyWorkOnlyPersona(activePersonaId);

  return (
    <Routes>
      <Route path="/" element={<MyWorkPage />} />
      <Route path="/my-work" element={<Navigate to="/" replace />} />
      <Route
        path="/dashboard"
        element={dashboardAllowed ? <DashboardPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/findings"
        element={<FindingsListPage />}
      />
      <Route
        path="/findings/:id"
        element={<FindingDetailPage />}
      />
      <Route
        path="/capa"
        element={<CapaListPage />}
      />
      <Route
        path="/capa/new"
        element={<CreateGuard><CapaIntakePage /></CreateGuard>}
      />
      <Route
        path="/capa/:id"
        element={<CapaDetailPage />}
      />
      <Route
        path="/capa/:id/8d/problem"
        element={<FillGuard><D1ProblemPage /></FillGuard>}
      />
      <Route
        path="/capa/:id/8d/containment"
        element={<FillGuard><D2ContainmentPage /></FillGuard>}
      />
      <Route
        path="/capa/:id/8d/rca"
        element={<FillGuard><D3RCAPage /></FillGuard>}
      />
      <Route
        path="/capa/:id/8d/ca"
        element={<FillGuard><D4CorrectiveActionPage /></FillGuard>}
      />
      <Route
        path="/capa/:id/8d/pa"
        element={<FillGuard><D5PreventiveActionPage /></FillGuard>}
      />
      <Route
        path="/capa/:id/8d/verification"
        element={<FillGuard><D6VerificationPage /></FillGuard>}
      />
      <Route
        path="/capa/:id/8d/signoff"
        element={<FillGuard><D7SignOffPage /></FillGuard>}
      />
      <Route
        path="/actions/corrective"
        element={<CorrectiveActionsPage />}
      />
      <Route
        path="/actions/preventive"
        element={<PreventiveActionsPage />}
      />
      <Route
        path="/actions/consolidated"
        element={<ConsolidatedActionPlanPage />}
      />
      <Route
        path="/similarity"
        element={<SimilarityExplorerPage />}
      />
      <Route
        path="/topics"
        element={<TopicsGroupingPage />}
      />
      <Route
        path="/audit-trail"
        element={<AuditTrailPage />}
      />
      <Route
        path="/notifications"
        element={<NotificationCenterPage />}
      />
      <Route
        path="/settings/personas"
        element={<PersonaManagementPage />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
