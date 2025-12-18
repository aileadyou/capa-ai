import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  AlertTriangle,
  FileSearch,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Database,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItemProps {
  path: string;
  label: string;
  icon: React.ElementType;
  isCollapsed: boolean;
}

const NavItem = ({ path, label, icon: Icon, isCollapsed }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <NavLink
      to={path}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
        isCollapsed ? "justify-center" : "",
        isActive && "bg-sidebar-accent text-sidebar-foreground border-l-2 border-primary"
      )}
      activeClassName="bg-sidebar-accent text-sidebar-foreground border-l-2 border-primary"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && <span className="text-sm truncate">{label}</span>}
    </NavLink>
  );
};

export const EnterpriseSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    } else {
      navigate("/");
      toast({
        title: "Signed out",
        description: "Session ended.",
      });
    }
  };

  const mainNavItems = [
    { path: "/quality", label: "Dashboard", icon: Home },
    { path: "/deviations", label: "Deviations", icon: AlertTriangle },
    { path: "/investigation", label: "Investigation", icon: FileSearch },
    { path: "/capa", label: "CAPA", icon: ClipboardList },
    { path: "/audit-trail", label: "Audit Trail", icon: FileText },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const systemNavItems = [
    { path: "/data-management", label: "Data Management", icon: Database },
    { path: "/quality-dashboard", label: "Quality Metrics", icon: Shield },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-200",
        isCollapsed ? "w-14" : "w-52"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-12 flex items-center border-b border-sidebar-border px-3",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
            QMS Platform
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 py-1.5">
            <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              Quality
            </span>
          </div>
        )}
        {mainNavItems.map((item) => (
          <NavItem key={item.path} {...item} isCollapsed={isCollapsed} />
        ))}

        <div className="my-2 border-t border-sidebar-border" />

        {!isCollapsed && (
          <div className="px-3 py-1.5">
            <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              System
            </span>
          </div>
        )}
        {systemNavItems.map((item) => (
          <NavItem key={item.path} {...item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <NavItem
          path="/settings"
          label="Settings"
          icon={Settings}
          isCollapsed={isCollapsed}
        />
        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
