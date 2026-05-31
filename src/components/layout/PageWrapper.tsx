import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
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
        <main
          key={location.pathname}
          className="animate-page-enter lead-motion-scope mx-auto max-w-[1500px]"
          style={{ padding: "24px 20px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
