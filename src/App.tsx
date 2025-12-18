import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import CapaDashboard from "./pages/CapaDashboard";
import Investigation from "./pages/Investigation";
import Deviations from "./pages/Deviations";
import CapaActions from "./pages/CapaActions";
import CapaDetail from "./pages/CapaDetail";
import AuditTrail from "./pages/AuditTrail";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CapaDashboard />} />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;