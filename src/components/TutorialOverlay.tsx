import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTutorial } from "@/contexts/TutorialContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TutorialOverlay() {
  const { 
    isActive, 
    currentStep, 
    steps, 
    nextStep, 
    prevStep, 
    skipTutorial,
    endTutorial 
  } = useTutorial();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Navigate to the correct page for the current step
  useEffect(() => {
    if (isActive && step?.page && location.pathname !== step.page) {
      navigate(step.page);
    }
  }, [isActive, step, location.pathname, navigate]);

  // Find and position the tooltip relative to the target element
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(step.targetSelector!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Calculate tooltip position based on placement
        const padding = 16;
        let top = 0;
        let left = 0;

        switch (step.placement) {
          case "top":
            top = rect.top - padding;
            left = rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - padding;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + padding;
            break;
          default:
            top = window.innerHeight / 2;
            left = window.innerWidth / 2;
        }

        setTooltipPosition({ top, left });
      }
    };

    // Wait for page navigation and DOM updates
    const timer = setTimeout(findElement, 300);
    window.addEventListener("resize", findElement);
    window.addEventListener("scroll", findElement);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", findElement);
      window.removeEventListener("scroll", findElement);
    };
  }, [isActive, step, currentStep]);

  if (!isActive) return null;

  const isCenterPlacement = step?.placement === "center" || !step?.targetSelector;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm" />

      {/* Spotlight cutout for target element */}
      {targetRect && !isCenterPlacement && (
        <div
          className="fixed z-[9999] ring-4 ring-primary/50 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tutorial Card */}
      <Card
        className={cn(
          "fixed z-[10000] w-[400px] max-w-[90vw] p-6 shadow-2xl border-2 border-primary/20 bg-card",
          isCenterPlacement && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={
          !isCenterPlacement
            ? {
                top: Math.min(
                  Math.max(tooltipPosition.top, 100),
                  window.innerHeight - 350
                ),
                left: Math.min(
                  Math.max(tooltipPosition.left - 200, 20),
                  window.innerWidth - 420
                ),
              }
            : undefined
        }
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {isFirstStep ? (
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              ) : isLastStep ? (
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              ) : (
                <span className="text-xs font-bold text-primary-foreground">
                  {currentStep + 1}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
              <Progress value={progress} className="h-1.5 w-24 mt-1" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={skipTutorial}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-foreground">{step?.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step?.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTutorial}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip tutorial
          </Button>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLastStep ? endTutorial : nextStep}
              className="gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
