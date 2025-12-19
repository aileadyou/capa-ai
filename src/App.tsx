import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { WelcomeModal } from "@/components/WelcomeModal";
import CapaDashboard from "./pages/CapaDashboard";
import Investigation from "./pages/Investigation";
import Deviations from "./pages/Deviations";
import CapaActions from "./pages/CapaActions";
import CapaDetail from "./pages/CapaDetail";
import AuditTrail from "./pages/AuditTrail";
import Reports from "./pages/Reports";
import DataManagement from "./pages/DataManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TutorialProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WelcomeModal />
            <TutorialOverlay />
            <Routes>
              <Route path="/" element={<CapaDashboard />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="/investigation" element={<Investigation />} />
              <Route path="/deviations" element={<Deviations />} />
              <Route path="/capa-actions" element={<CapaActions />} />
              <Route path="/capa-actions/:id" element={<CapaDetail />} />
              <Route path="/audit-trail" element={<AuditTrail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TutorialProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;