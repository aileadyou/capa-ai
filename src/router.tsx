import { Navigate, Route, Routes } from "react-router-dom";
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

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MyWorkPage />} />
      <Route path="/my-work" element={<Navigate to="/" replace />} />
      <Route
        path="/dashboard"
        element={<DashboardPage />}
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
        element={<CapaIntakePage />}
      />
      <Route
        path="/capa/:id"
        element={<CapaDetailPage />}
      />
      <Route
        path="/capa/:id/8d/problem"
        element={<D1ProblemPage />}
      />
      <Route
        path="/capa/:id/8d/containment"
        element={<D2ContainmentPage />}
      />
      <Route
        path="/capa/:id/8d/rca"
        element={<D3RCAPage />}
      />
      <Route
        path="/capa/:id/8d/ca"
        element={<D4CorrectiveActionPage />}
      />
      <Route
        path="/capa/:id/8d/pa"
        element={<D5PreventiveActionPage />}
      />
      <Route
        path="/capa/:id/8d/verification"
        element={<D6VerificationPage />}
      />
      <Route
        path="/capa/:id/8d/signoff"
        element={<D7SignOffPage />}
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
