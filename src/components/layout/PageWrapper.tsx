import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { CompactNav, Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function PageWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-1)", color: "var(--fg-1)", fontFamily: "var(--font-sans)" }}
    >
      <Sidebar />

      {/* Content: shifted right of sidebar on xl */}
      <div className="xl:pl-[240px]">
        <TopBar />
        <CompactNav />
        <main
          key={location.pathname}
          className="app-main animate-page-enter lead-motion-scope mx-auto max-w-[1500px]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
