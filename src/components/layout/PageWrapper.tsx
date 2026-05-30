import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="xl:pl-72">
        <TopBar />
        <main className="mx-auto max-w-[1500px] px-4 py-6 xl:px-6">{children}</main>
      </div>
    </div>
  );
}

