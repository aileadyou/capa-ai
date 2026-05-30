import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { primaryNavItems } from "@/routes";
import { cn } from "@/lib/utils";

function isRouteActive(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === "/dashboard";
  if (url === "/capa") return pathname === "/capa" || pathname.startsWith("/capa/");
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground xl:flex xl:flex-col">
      <div className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
            <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-warning" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">AI Coach Nova</div>
            <div className="truncate text-xs text-slate-400">CAPA demo prototype</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {primaryNavItems.map((item) => {
          const isActive = isRouteActive(location.pathname, item.url);

          return (
            <Button
              key={item.url}
              asChild
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 px-3 text-sm",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                  : "text-slate-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Link to={item.url}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 text-xs text-slate-500">
        Frontend-only · Mock data · No real integrations
      </div>
    </aside>
  );
}

