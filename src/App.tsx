import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { NovaChatPanel } from "@/components/nova/NovaChatPanel";
import { CitationDetailPanel } from "@/components/nova/CitationDetailPanel";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <PageWrapper>
        <AppRouter />
      </PageWrapper>
      <NovaChatPanel />
      <CitationDetailPanel />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
