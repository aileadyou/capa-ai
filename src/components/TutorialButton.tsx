import { useTutorial } from "@/contexts/TutorialContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, GraduationCap } from "lucide-react";

interface TutorialButtonProps {
  variant?: "icon" | "full";
  className?: string;
}

export function TutorialButton({ variant = "icon", className }: TutorialButtonProps) {
  const { startTutorial, isActive } = useTutorial();

  if (isActive) return null;

  if (variant === "full") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={startTutorial}
        className={className}
      >
        <GraduationCap className="h-4 w-4 mr-2" />
        Start Tutorial
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={startTutorial}
          className={className}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start Tutorial</p>
      </TooltipContent>
    </Tooltip>
  );
}
