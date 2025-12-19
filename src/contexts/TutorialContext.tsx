import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  page?: string;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  hasCompletedTutorial: boolean;
  setHasCompletedTutorial: (value: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Quality Management System",
    description: "This guided tour will walk you through the key features of our AI-powered quality management platform. Let's explore how to monitor findings, investigate issues, and manage CAPAs efficiently.",
    placement: "center",
  },
  {
    id: "dashboard-overview",
    title: "Quality Health Dashboard",
    description: "This is your command center. Here you can see real-time quality metrics including open findings, AI-resolved issues, and average resolution times. The dashboard provides a comprehensive overview of your organization's quality health.",
    targetSelector: "[data-tutorial='dashboard-cards']",
    placement: "bottom",
    page: "/",
  },
  {
    id: "priority-tasks",
    title: "High Priority Task List",
    description: "Critical quality findings that need immediate attention appear here. Look for the 'AI Ready' badge - these items can be investigated using our AI-powered diagnostic tools for faster root cause analysis.",
    targetSelector: "[data-tutorial='priority-tasks']",
    placement: "right",
    page: "/",
  },
  {
    id: "ai-ready-badge",
    title: "AI-Ready Findings",
    description: "Items marked 'AI Ready' have sufficient data for AI-assisted investigation. Click on any AI-ready finding to open the Investigation panel where our AI will help analyze the root cause and suggest corrective actions.",
    targetSelector: "[data-tutorial='ai-ready-item']",
    placement: "bottom",
    page: "/",
  },
  {
    id: "charts-overview",
    title: "Quality Trends & Analytics",
    description: "Track quality trends over time with interactive charts. Monitor findings by department, analyze priority distribution, and identify patterns to prevent recurring issues.",
    targetSelector: "[data-tutorial='charts-section']",
    placement: "top",
    page: "/",
  },
  {
    id: "sidebar-navigation",
    title: "Navigation Sidebar",
    description: "Use the sidebar to navigate between different sections: Quality Findings for all deviations, CAPA Actions for corrective measures, Audit Trail for compliance tracking, and Reports for documentation.",
    targetSelector: "[data-tutorial='sidebar']",
    placement: "right",
    page: "/",
  },
  {
    id: "quality-findings",
    title: "Quality Findings Page",
    description: "The Quality Findings page lists all deviations, audit observations, and complaints. Use the filter and search features to find specific items. Click on any AI-ready finding to start an investigation.",
    placement: "center",
    page: "/deviations",
  },
  {
    id: "investigation-panel",
    title: "AI Investigation Panel",
    description: "When you click an AI-ready finding, the Investigation page opens with detailed information. The AI Diagnostic Panel analyzes the data and provides root cause hypotheses, risk assessments, and recommended actions.",
    placement: "center",
    page: "/investigation",
  },
  {
    id: "capa-actions",
    title: "CAPA Management",
    description: "The CAPA Actions page tracks all Corrective and Preventive Actions. Monitor implementation progress, due dates, and effectiveness verification. Each CAPA is linked to its source finding for full traceability.",
    placement: "center",
    page: "/capa-actions",
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    description: "Every action in the system is logged for compliance. The Audit Trail provides a complete history of changes, approvals, and investigations - essential for regulatory inspections.",
    placement: "center",
    page: "/audit-trail",
  },
  {
    id: "reports",
    title: "Reports & Documentation",
    description: "Generate compliance reports, trend analyses, and management summaries. Export data for external audits or integrate with your document management system.",
    placement: "center",
    page: "/reports",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You've completed the tutorial! Start by exploring the Dashboard, clicking on an AI-ready finding to see the investigation tools, or browse the Quality Findings list. Remember, you can restart this tutorial anytime from the help menu.",
    placement: "center",
  },
];

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    const saved = localStorage.getItem("tutorial-completed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("tutorial-completed", String(hasCompletedTutorial));
  }, [hasCompletedTutorial]);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const endTutorial = () => {
    setIsActive(false);
    setHasCompletedTutorial(true);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    setHasCompletedTutorial(true);
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps: tutorialSteps,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        hasCompletedTutorial,
        setHasCompletedTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
