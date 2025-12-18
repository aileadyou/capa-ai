import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleNovaClick = () => {
    toast({
      title: "Coming Soon",
      description: "Nova is currently under development. Stay tuned!",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div 
      className={`relative flex h-[73px] items-center justify-center rounded-[36.5px] border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="absolute inset-0 rounded-[36.5px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
      
      <div className="relative flex items-center gap-1">
        <button 
          onClick={() => navigate("/dashboard")}
          className={`group flex h-[46px] items-center gap-2 rounded-[23px] px-6 transition-all duration-300 hover:bg-muted/50 ${
            location.pathname === '/dashboard' ? 'bg-muted/50' : ''
          }`}
        >
          <BarChart3 className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" />
          <span className="text-base font-bold text-muted-foreground transition-all duration-300 group-hover:text-foreground">Dashboard</span>
        </button>
        
        <button 
          onClick={() => navigate("/stream")}
          className={`group relative flex h-[46px] items-center gap-2 rounded-[23px] px-8 shadow-glow transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            location.pathname === '/' || location.pathname === '/stream' 
              ? 'bg-gradient-to-r from-primary to-primary-dark' 
              : 'bg-muted/50'
          }`}
        >
          <div className="absolute inset-0 rounded-[23px] bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Zap className={`relative h-5 w-5 transition-all duration-300 group-hover:rotate-12 ${
            location.pathname === '/' || location.pathname === '/stream' ? 'text-white' : 'text-muted-foreground'
          }`} fill="currentColor" />
          <span className={`relative text-base font-bold ${
            location.pathname === '/' || location.pathname === '/stream' ? 'text-white' : 'text-muted-foreground'
          }`}>Stream</span>
        </button>
        
        <button 
          onClick={handleNovaClick}
          className="group flex h-[46px] items-center gap-2 rounded-[23px] px-6 transition-all duration-300 hover:bg-muted/50 relative"
        >
          <Sparkles className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-accent group-hover:scale-110" />
          <span className="text-base font-bold text-muted-foreground transition-all duration-300 group-hover:text-foreground">Nova</span>
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full">Soon</span>
        </button>
      </div>
    </div>
  );
};
