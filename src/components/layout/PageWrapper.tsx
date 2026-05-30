import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function PageWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="xl:pl-72">
        <TopBar />
        <main
          key={location.pathname}
          className="animate-page-enter mx-auto max-w-[1500px] px-4 py-6 xl:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

