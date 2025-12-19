import { useEffect, useState } from "react";
import { useTutorial } from "@/contexts/TutorialContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard,
  Search,
  ClipboardCheck,
  FileText
} from "lucide-react";

export function WelcomeModal() {
  const { hasCompletedTutorial, startTutorial, setHasCompletedTutorial } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show welcome modal for first-time users after a short delay
    if (!hasCompletedTutorial) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTutorial]);

  const handleStartTutorial = () => {
    setIsOpen(false);
    startTutorial();
  };

  const handleSkip = () => {
    setIsOpen(false);
    setHasCompletedTutorial(true);
  };

  const features = [
    {
      icon: LayoutDashboard,
      title: "Quality Dashboard",
      description: "Real-time metrics and health overview",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Investigation",
      description: "Automated root cause analysis",
    },
    {
      icon: ClipboardCheck,
      title: "CAPA Management",
      description: "Track corrective actions end-to-end",
    },
    {
      icon: FileText,
      title: "Compliance Reports",
      description: "Audit-ready documentation",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl text-primary-foreground">
                Welcome to Quality Management
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 mt-0.5">
                AI-powered quality control made simple
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-3 rounded-lg border bg-muted/30 space-y-1"
              >
                <feature.icon className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-medium text-foreground">
                  {feature.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Tutorial prompt */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Take a Quick Tour?
                </h4>
                <p className="text-xs text-muted-foreground">
                  Our interactive tutorial will guide you through the key features 
                  in just 2 minutes. Perfect for getting started quickly!
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button
            onClick={handleStartTutorial}
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Start Tutorial
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
