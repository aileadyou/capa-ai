import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  ScrollText,
  FileBarChart,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import leadAiLogo from "@/assets/lead-ai-graphic.png";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/" },
  { title: "Deviations", icon: AlertTriangle, url: "/deviations" },
  { title: "CAPA Actions", icon: ClipboardCheck, url: "/capa-actions" },
  { title: "Audit Trail", icon: ScrollText, url: "/audit-trail" },
  { title: "Reports", icon: FileBarChart, url: "/reports" },
];

export function CapaSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-ai flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Shield className="h-5 w-5 text-white/90 z-10" />
            <Sparkles className="h-3 w-3 text-white absolute top-1 right-1 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground text-lg">CAPA AI</h1>
            <p className="text-xs text-sidebar-foreground/60">Quality Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url === "/" && location.pathname === "/investigation");
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Button>
        
        <div className="flex items-center gap-2 pt-2 border-t border-sidebar-border/50">
          <img src={leadAiLogo} alt="Lead AI" className="h-8 w-auto" />
          <div className="text-xs text-sidebar-foreground/50">
            <span>Powered by </span>
            <span className="font-medium text-sidebar-foreground/70">Lead AI</span>
            <p className="text-[10px]">(for demo purposes only)</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}