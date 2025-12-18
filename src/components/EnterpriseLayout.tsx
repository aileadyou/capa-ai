import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import leadAiLogo from "@/assets/lead-ai-logo-white.png";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface EnterpriseLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function EnterpriseLayout({
  children,
  breadcrumbs,
  title,
  subtitle,
  actions,
}: EnterpriseLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <div className="flex-1 p-4 lg:p-6 space-y-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumbs items={breadcrumbs} className="text-xs" />
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>

            {/* Content */}
            <div className="space-y-4">{children}</div>
          </div>

          {/* Footer */}
          <footer className="border-t border-border bg-slate-950 px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <img 
                src={leadAiLogo} 
                alt="Lead AI" 
                className="h-4 w-auto opacity-80" 
              />
              <span className="text-xs text-slate-400">
                © Copyright Lead AI 2025
              </span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
