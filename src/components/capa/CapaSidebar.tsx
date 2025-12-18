import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  ScrollText,
  FileBarChart,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/" },
  { title: "Quality Findings", icon: AlertTriangle, url: "/deviations" },
  { title: "CAPA Actions", icon: ClipboardCheck, url: "/capa-actions" },
  { title: "Audit Trail", icon: ScrollText, url: "/audit-trail" },
  { title: "Reports", icon: FileBarChart, url: "/reports" },
];

const systemItems = [
  { title: "Data Management", icon: Database, url: "/data-management" },
];

export function CapaSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-slate-950 text-slate-100"
    >
      <SidebarHeader className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
            <div className="relative h-8 w-8 rounded bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-amber-400" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-semibold text-slate-100 text-sm truncate">CAPA AI</h1>
                <p className="text-[10px] text-slate-400 truncate">Quality Management</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-6 w-6 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-slate-500 px-2 mb-1">
              Quality
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url === "/" && location.pathname === "/investigation");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      tooltip={isCollapsed ? item.title : undefined}
                      className={cn(
                        "w-full justify-start gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-slate-500 px-2 mb-1">
              System
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      tooltip={isCollapsed ? item.title : undefined}
                      className={cn(
                        "w-full justify-start gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-slate-800">
        <div className="flex flex-col gap-1">
          <ThemeToggle collapsed={isCollapsed} />
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-full h-7 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-[10px] text-slate-500">v1.0.0 · Enterprise</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-5 w-5 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
