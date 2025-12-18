import { useState, useEffect } from "react";

export type PipelineStep = 
  | "data-collection"
  | "standard-cleaning"
  | "filtering"
  | "selective-cleaning"
  | "grouping-sorting";

interface ProgressState {
  completedSteps: PipelineStep[];
  currentStep: PipelineStep | null;
}

const STORAGE_KEY = "lead-stream-progress";

export const useProgress = () => {
  const [progress, setProgress] = useState<ProgressState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { completedSteps: [], currentStep: null };
      }
    }
    return { completedSteps: [], currentStep: null };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const markStepComplete = (step: PipelineStep) => {
    setProgress((prev) => {
      if (prev.completedSteps.includes(step)) {
        return prev;
      }
      return {
        ...prev,
        completedSteps: [...prev.completedSteps, step],
      };
    });
  };

  const setCurrentStep = (step: PipelineStep | null) => {
    setProgress((prev) => ({
      ...prev,
      currentStep: step,
    }));
  };

  const isStepComplete = (step: PipelineStep) => {
    return progress.completedSteps.includes(step);
  };

  const resetProgress = () => {
    setProgress({ completedSteps: [], currentStep: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const getProgressPercentage = () => {
    const totalSteps = 5;
    return Math.round((progress.completedSteps.length / totalSteps) * 100);
  };

  return {
    completedSteps: progress.completedSteps,
    currentStep: progress.currentStep,
    markStepComplete,
    setCurrentStep,
    isStepComplete,
    resetProgress,
    getProgressPercentage,
  };
};
