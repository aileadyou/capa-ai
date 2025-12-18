import { ReactNode } from "react";
import { ChevronRight, Sparkles } from "lucide-react";

interface DataSourceCardProps {
  title: string;
  isSelected?: boolean;
  children: ReactNode;
  onViewAll?: () => void;
  onSelect?: () => void;
}

export const DataSourceCard = ({
  title,
  isSelected = false,
  children,
  onViewAll,
  onSelect,
}: DataSourceCardProps) => {
  return (
    <div
      className={`group relative rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in-up ${
        isSelected
          ? "border-primary bg-gradient-to-br from-primary/5 to-primary-light/20 shadow-glow"
          : "border-border-light bg-card hover:border-primary/50"
      }`}
    >
      {isSelected && (
        <div className="absolute -top-1 -right-1 animate-pulse">
          <Sparkles className="h-5 w-5 text-primary" fill="currentColor" />
        </div>
      )}
      
      <button 
        onClick={onSelect}
        className="mb-4 flex items-center gap-3 cursor-pointer w-full group/button"
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ${
            isSelected 
              ? "border-primary bg-primary shadow-glow" 
              : "border-muted-foreground group-hover/button:border-primary group-hover/button:scale-110"
          }`}
        >
          {isSelected && (
            <div className="h-2 w-2 rounded-full bg-white animate-scale-in" />
          )}
        </div>
        <h3
          className={`text-xl transition-all duration-300 ${
            isSelected 
              ? "font-bold text-foreground" 
              : "font-medium text-foreground/80 group-hover/button:text-foreground"
          }`}
        >
          {title}
        </h3>
      </button>
      
      <div className="mb-4">{children}</div>
      
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-2 text-base font-medium text-primary hover:text-primary-dark transition-all duration-300 hover:gap-3 group/link"
        >
          View all dataset
          <ChevronRight className="h-5 w-5 transition-transform group-hover/link:translate-x-1" />
        </button>
      )}
    </div>
  );
};
