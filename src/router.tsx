import { Navigate, Route, Routes } from "react-router-dom";
import { NovaPlaceholderPage } from "@/pages/nova/NovaPlaceholderPage";
import { CapaDetailPage } from "@/pages/nova/CapaDetailPage";
import { DashboardPage } from "@/pages/nova/DashboardPage";
import { CapaIntakePage } from "@/pages/nova/CapaIntakePage";
import { CapaListPage } from "@/pages/nova/CapaListPage";
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
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        element={
          <NovaPlaceholderPage
            eyebrow="REQ011"
            title="Preventive Action List"
            description="All preventive actions with recurrence indicators and linked CAPA context."
            focusItems={[
              "Filters and search mirror the corrective action list.",
              "Recurrence check badge indicates whether prevention failed.",
              "Rows link back to their originating CAPA case.",
            ]}
            primaryAction={{ label: "Open Corrective Actions", to: "/actions/corrective" }}
          />
        }
      />
      <Route
        path="/actions/consolidated"
        element={
          <NovaPlaceholderPage
            eyebrow="REQ019"
            title="Consolidated Action Plan"
            description="Management view that groups corrective and preventive actions by root cause cluster, department, or risk priority."
            focusItems={[
              "Mock Nova clustering with deterministic delay.",
              "Grouped action progress bars and accountable PICs.",
              "Export to Excel is mocked with toast feedback.",
            ]}
            primaryAction={{ label: "Ask Nova", toast: "Nova is preparing consolidated action plan suggestions." }}
          />
        }
      />
      <Route
        path="/similarity"
        element={
          <NovaPlaceholderPage
            eyebrow="REQ018"
            title="Similarity Analysis"
            description="Explorer for finding historical CAPA cases with similar descriptions, root causes, and outcomes."
            focusItems={[
              "Search input for finding descriptions.",
              "Mock Nova search returns similarity cards after a deterministic delay.",
              "Historical detail opens in a slide-over panel in the full implementation.",
            ]}
            primaryAction={{ label: "Ask Nova", toast: "Nova is analyzing historical similarity." }}
          />
        }
      />
      <Route
        path="/topics"
        element={
          <NovaPlaceholderPage
            eyebrow="REQ024"
            title="Topics Grouping"
            description="Cluster view for recurring finding patterns such as HEPA Filter Maintenance, Documentation, and Cold Chain."
            focusItems={[
              "Mock topic clustering with risk-level badges.",
              "Cluster cards show trend direction, severity mix, and related findings.",
              "Designed for QA management and Head of QA review.",
            ]}
            primaryAction={{ label: "Ask Nova", toast: "Nova is grouping findings by topic." }}
          />
        }
      />
      <Route
        path="/audit-trail"
        element={
          <NovaPlaceholderPage
            eyebrow="REQ008"
            title="Global Audit Trail"
            description="Chronological event log for system actions, Nova decisions, integration labels, and user feedback."
            focusItems={[
              "Filters for event type, CAPA ID, date, and actor.",
              "Nova events include Nova Mock Engine, model version, confidence, and timestamp.",
              "Export actions use mocked feedback until PDF export is implemented.",
            ]}
            primaryAction={{ label: "Open Notifications", to: "/notifications" }}
          />
        }
      />
      <Route
        path="/notifications"
        element={
          <NovaPlaceholderPage
            eyebrow="REQ015"
            title="Notification Center"
            description="Mocked notification inbox for approvals, overdue actions, CAPA updates, and closure events."
            focusItems={[
              "Read/unread state persists through the demo store in the full implementation.",
              "Filters by active persona and notification type.",
              "Mark all as read is a primary mocked workflow.",
            ]}
            primaryAction={{ label: "Mark All as Read", toast: "All visible notifications were marked as read in this demo." }}
          />
        }
      />
      <Route
        path="/settings/personas"
        element={
          <NovaPlaceholderPage
            eyebrow="Demo Settings"
            title="Persona Management"
            description="Demo-only persona switcher for Initiator, QA Deviation, Department Head, Head of QA, and SME."
            focusItems={[
              "Active persona will persist in localStorage through Zustand.",
              "Approval gates and visible actions will adapt to the selected persona.",
              "No real authentication or SSO is implemented.",
            ]}
            primaryAction={{ label: "Reset Demo Data", toast: "Reset Demo Data will clear persisted demo state once the store is implemented." }}
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
