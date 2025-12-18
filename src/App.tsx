import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QualityDataProvider } from "@/contexts/QualityDataContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import DataCollection from "./pages/DataCollection";
import StandardCleaning from "./pages/StandardCleaning";
import Filtering from "./pages/Filtering";
import SelectiveCleaning from "./pages/SelectiveCleaning";
import GroupingSorting from "./pages/GroupingSorting";
import Glossary from "./pages/Glossary";
import FAQ from "./pages/FAQ";
import QualityDashboard from "./pages/QualityDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QualityDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/stream" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/stream/glossary" element={<Glossary />} />
            <Route path="/stream/faq" element={<FAQ />} />
            <Route path="/dashboard" element={<ProtectedRoute><QualityDashboard /></ProtectedRoute>} />
            <Route path="/stream/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/stream/data-collection" element={<ProtectedRoute><DataCollection /></ProtectedRoute>} />
            <Route path="/stream/standard-cleaning" element={<ProtectedRoute><StandardCleaning /></ProtectedRoute>} />
            <Route path="/stream/filtering" element={<ProtectedRoute><Filtering /></ProtectedRoute>} />
            <Route path="/stream/selective-cleaning" element={<ProtectedRoute><SelectiveCleaning /></ProtectedRoute>} />
            <Route path="/stream/grouping-sorting" element={<ProtectedRoute><GroupingSorting /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </QualityDataProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
