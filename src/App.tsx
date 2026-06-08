import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AppRouter } from "@/router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { NovaChatPanel } from "@/components/nova/NovaChatPanel";
import { CitationDetailPanel } from "@/components/nova/CitationDetailPanel";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/store/useAuthStore";

function AuthGuard() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <>
      <PageWrapper>
        <AppRouter />
      </PageWrapper>
      <NovaChatPanel />
      <CitationDetailPanel />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGuard />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
