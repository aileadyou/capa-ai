import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { CompactNav, Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function PageWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Skip link — first focusable element, visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-on shadow-lg outline-none focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:not-sr-only focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to main content
      </a>

      <Sidebar />

      {/* Content: shifted right of sidebar on xl — tracks --sidebar-w CSS variable set by Sidebar */}
      <div
        className="transition-[padding-left] [transition-duration:200ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] xl:[padding-left:var(--sidebar-w,280px)]"
      >
        <TopBar />
        <CompactNav />
        <main
          id="main-content"
          tabIndex={-1}
          key={location.pathname}
          className="app-main animate-page-enter lead-motion-scope mx-auto w-full outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
