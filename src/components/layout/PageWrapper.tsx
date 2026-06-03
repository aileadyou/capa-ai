import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { CompactNav, Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function PageWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Sidebar />

      {/* Content: shifted right of sidebar on xl */}
      <div className="xl:pl-[240px]">
        <TopBar />
        <CompactNav />
        <main
          key={location.pathname}
          className="app-main animate-page-enter lead-motion-scope mx-auto w-full"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
