import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string;
}

export function ThemeToggle({ collapsed = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "h-7 gap-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        collapsed ? "w-7 px-0 justify-center" : "w-full justify-start px-2",
        className
      )}
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {!collapsed && <span className="text-xs">Theme</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
