import * as React from "react";

interface Step {
  number: number;
  title: string;
  subtitle: string;
  isActive: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

export const StepIndicator = ({ steps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 animate-fade-in">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div 
            className="flex items-start gap-4 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`relative flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 transition-all duration-300 ${
                step.isActive
                  ? "border-primary bg-gradient-to-br from-primary/10 to-primary-light/20 shadow-glow"
                  : "border-border bg-card/50"
              }`}
            >
              {step.isActive && (
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              )}
              <span
                className={`relative z-10 text-2xl font-bold transition-all duration-300 ${
                  step.isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {step.number}
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className={`text-lg font-semibold transition-all duration-300 ${
                  step.isActive 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
              <span
                className={`text-sm transition-all duration-300 ${
                  step.isActive 
                    ? "text-muted-foreground" 
                    : "text-muted-foreground/50"
                }`}
                dangerouslySetInnerHTML={{ __html: step.subtitle }}
              />
            </div>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`mb-7 h-[2px] w-[34px] rounded-full transition-all duration-500 ${
                step.isActive 
                  ? "bg-gradient-to-r from-primary to-primary/50" 
                  : "bg-border"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
