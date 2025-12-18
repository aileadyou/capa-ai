import { useState, useEffect, useRef } from "react";
import { NavLink } from "@/components/NavLink";
import { Database, Sparkles, Filter, Wand2, ArrowDownUp, Home, LogOut, User, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import leadAiLogo from "@/assets/lead-ai-logo.png";

export const Sidebar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Delay hiding by 2 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

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
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate("/");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    }
  };

  const navItems = [
    { path: "/stream", label: "Home", icon: Home },
    { path: "/stream/data-collection", label: "Data Collection", icon: Database },
    { path: "/stream/standard-cleaning", label: "Standard Cleaning", icon: Sparkles },
    { path: "/stream/filtering", label: "Filtering", icon: Filter },
    { path: "/stream/selective-cleaning", label: "Selective Cleaning", icon: Wand2 },
    { path: "/stream/grouping-sorting", label: "Grouping & Sorting", icon: ArrowDownUp },
  ];

  const bottomNavItems = isAuthenticated ? [
    { path: "/stream/profile", label: "Profile", icon: User },
    { path: "/stream/glossary", label: "Glossary", icon: BookOpen },
    { path: "/stream/faq", label: "FAQ", icon: HelpCircle },
  ] : [
    { path: "/stream/glossary", label: "Glossary", icon: BookOpen },
    { path: "/stream/faq", label: "FAQ", icon: HelpCircle },
  ];

  return (
    <>
      {/* Hover trigger zone with visual indicator */}
      <div 
        className="fixed left-0 top-0 h-screen w-4 z-40 group"
        onMouseEnter={handleMouseEnter}
      >
        {/* Subtle indicator bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-1 bg-gradient-to-b from-transparent via-primary/40 to-transparent rounded-r-full group-hover:w-2 group-hover:via-primary/60 transition-all duration-300 animate-pulse" />
        
        {/* Glow effect */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-32 w-8 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen w-[240px] bg-gradient-to-b from-card to-muted/20 border-r border-border-light flex flex-col backdrop-blur-sm transition-transform duration-300 ease-in-out z-50 ${
          isHovered ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      <div className="p-6 border-b border-border-light">
        <button
          onClick={() => navigate("/stream")}
          className="relative animate-fade-in w-full cursor-pointer group flex items-center justify-center"
        >
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          <img 
            src={leadAiLogo} 
            alt="Lead AI" 
            className="relative h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 flex flex-col">
        <div className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/stream"}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-primary/10 hover:shadow-sm hover:translate-x-1 transition-all duration-300 animate-fade-in-up"
                activeClassName="bg-gradient-to-r from-primary to-primary-dark text-white shadow-glow"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <span className="text-sm font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        
        {bottomNavItems.length > 0 && (
          <div className="mt-auto space-y-2 pt-4 border-t border-border-light/50">
            {bottomNavItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-primary/10 hover:shadow-sm hover:translate-x-1 transition-all duration-300"
                  activeClassName="bg-gradient-to-r from-primary to-primary-dark text-white shadow-glow"
                >
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-border-light">
        <div className="flex items-center justify-between mb-3">
          <ThemeToggle />
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="sm"
              className="group gap-2 font-semibold hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              Sign Out
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Lead Stream v1.2
        </p>
      </div>
    </aside>
    </>
  );
};
