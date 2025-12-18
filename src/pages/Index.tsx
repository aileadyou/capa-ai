import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Database, Sparkles, Filter, Wand2, ArrowDownUp, LogIn, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ParticleBackground } from "@/components/ParticleBackground";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useProgress, PipelineStep } from "@/hooks/use-progress";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isStepComplete, getProgressPercentage, resetProgress } = useProgress();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      icon: Database,
      title: "Data Collection",
      description: "Upload or fetch bioactivity data via URLs",
      path: "/stream/data-collection",
      step: "data-collection" as PipelineStep
    },
    {
      icon: Sparkles,
      title: "Standard Cleaning",
      description: "Remove missing values and normalize units",
      path: "/stream/standard-cleaning",
      step: "standard-cleaning" as PipelineStep
    },
    {
      icon: Filter,
      title: "Filtering",
      description: "Filter by molecular weight and measurement quality",
      path: "/stream/filtering",
      step: "filtering" as PipelineStep
    },
    {
      icon: Wand2,
      title: "Selective Cleaning",
      description: "Optional cleaning with full data retention",
      path: "/stream/selective-cleaning",
      step: "selective-cleaning" as PipelineStep
    },
    {
      icon: ArrowDownUp,
      title: "Grouping & Sorting",
      description: "Aggregate and prioritize high-quality data",
      path: "/stream/grouping-sorting",
      step: "grouping-sorting" as PipelineStep
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Sidebar />
      
      <main className="p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section - Centered */}
          <div className="text-center mb-16 animate-fade-in relative">
            {!isAuthenticated && (
              <Button 
                onClick={() => navigate("/auth")}
                variant="outline"
                className="absolute top-0 right-0 gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
              Lead Stream
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transform bioactivity data into machine‑learning‑ready datasets. 
              Upload, clean, filter and analyze in a seamless pipeline.
            </p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Pipeline Progress
                </span>
                <span className="text-sm font-bold text-primary">
                  {getProgressPercentage()}%
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <button
                onClick={resetProgress}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
              >
                Reset Progress
              </button>
            </div>
            
            <Button 
              size="lg"
              onClick={() => navigate("/stream/data-collection")}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-glow transition-all duration-300 animate-scale-in"
            >
              <Database className="mr-2 h-5 w-5" />
              Start Your Pipeline
            </Button>
          </div>

          {/* Workflow Pipeline */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12 animate-fade-in-up">
              Data Processing Pipeline
            </h2>
            
            {/* Step 1: Data Collection - Full Width Featured */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <button
                onClick={() => navigate("/stream/data-collection")}
                className="group w-full p-8 bg-gradient-to-br from-card to-muted/20 rounded-2xl border-2 border-primary/30 hover:border-primary hover:shadow-glow transition-all duration-300 text-left relative overflow-hidden"
              >
                {isStepComplete("data-collection") && (
                  <div className="absolute top-4 right-4 p-2 bg-success rounded-full animate-scale-in">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-gradient-to-br from-primary to-primary-dark rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <Database className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">STEP 1</span>
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        Data Collection
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      Upload or fetch bioactivity data via URLs - Start your pipeline here
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Steps 2-5: 2x2 Grid for Symmetry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {features.slice(1).map((feature, index) => {
                const Icon = feature.icon;
                const stepNumber = index + 2;
                const isComplete = isStepComplete(feature.step);
                return (
                  <button
                    key={feature.path}
                    onClick={() => navigate(feature.path)}
                    className="group p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 text-left animate-fade-in-up relative overflow-hidden"
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    {isComplete && (
                      <div className="absolute top-3 right-3 p-1.5 bg-success rounded-full animate-scale-in">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-bold rounded-full">
                            STEP {stepNumber}
                          </span>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center py-12 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <p className="text-lg text-muted-foreground mb-4">
              Complete all steps to generate your ML-ready dataset
            </p>
            <div className="flex justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">Pipeline Ready</span>
              </div>
            </div>
          </div>

          {/* Feature Navigation */}
          <div className="flex justify-center mt-16 mb-8 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
            <BottomNavigation />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
