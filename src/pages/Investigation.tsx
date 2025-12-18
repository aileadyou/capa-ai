import { useState } from "react";
import { 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Thermometer,
  Cpu,
  Link2,
  CheckCircle2,
  Loader2,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const deviationData = {
  id: "DEV-2025-089",
  title: "Temperature Excursion - Warehouse B (Cold Storage)",
  batch: "#BF-VAC-2025-X",
  eventTime: "02:14 AM",
  detectedBy: "MES Sensor ID-55",
  value: "8.5°C",
  limit: "2.0°C - 8.0°C",
  duration: "15 Minutes",
};

const linkedCases = [
  { id: "DEV-2023-004", year: "2023" },
  { id: "DEV-2024-012", year: "2024" },
  { id: "DEV-2024-045", year: "2024" },
];

export default function Investigation() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"ai-ready" | "pending-approval">("ai-ready");
  const [showCapaPlan, setShowCapaPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [correction, setCorrection] = useState(
    "Immediate recalibration of Sensor ID-55 and manual temperature check of Batch #BF-VAC-2025-X."
  );
  const [prevention, setPrevention] = useState(
    "Update Preventive Maintenance (PM) schedule for HVAC sensors from Quarterly to Monthly. Install voltage stabilizer for Warehouse B."
  );
  const [riskAssessment, setRiskAssessment] = useState(
    "Medium Impact - No product degradation detected."
  );

  const handleGenerateCapa = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowCapaPlan(true);
    }, 1500);
  };

  const handleSubmitForApproval = () => {
    setStatus("pending-approval");
    toast({
      title: "CAPA Plan Submitted Successfully",
      description: "Audit Trail #99281 updated.",
      className: "bg-success text-success-foreground",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-foreground">
                    Deviation #{deviationData.id}: Investigation Phase
                  </h1>
                  {status === "ai-ready" && (
                    <Badge className="bg-gradient-to-r from-accent to-purple-500 text-accent-foreground animate-pulse-subtle">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Analysis Ready
                    </Badge>
                  )}
                  {status === "pending-approval" && (
                    <Badge variant="outline" className="border-warning text-warning">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending QA Manager Approval
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{deviationData.title}</p>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Left Column - The Facts (30%) */}
              <Card className="lg:col-span-3 border shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-destructive" />
                    The Facts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Event Time</p>
                        <p className="text-sm font-medium">{deviationData.eventTime}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Cpu className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Detected By</p>
                        <p className="text-sm font-medium">{deviationData.detectedBy}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <Thermometer className="w-4 h-4 text-destructive mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Recorded Value</p>
                        <p className="text-sm font-bold text-destructive">{deviationData.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Limit: {deviationData.limit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">{deviationData.duration}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Batch Reference</p>
                      <Badge variant="secondary" className="font-mono">
                        {deviationData.batch}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - AI Copilot (70%) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Root Cause Prediction */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-semibold flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-accent" />
                      AI Suggested Root Cause
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-foreground font-medium">
                        HVAC Unit 4 Sensor Drift due to power fluctuation.
                      </p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <span className="text-sm font-semibold text-accent">92%</span>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Similarity Engine */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-semibold flex items-center">
                      <Link2 className="w-4 h-4 mr-2 text-primary" />
                      Similarity Engine
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Analysis based on <span className="font-semibold text-foreground">3 similar historical closed cases</span> (2023, 2024).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {linkedCases.map((caseItem) => (
                        <Badge
                          key={caseItem.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                        >
                          <Link2 className="w-3 h-3 mr-1" />
                          Linked to {caseItem.id}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Generate CAPA Button */}
                {!showCapaPlan && !isGenerating && (
                  <Button 
                    onClick={handleGenerateCapa}
                    className="w-full h-12 text-base font-medium gradient-ai hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Recommended CAPA Plan
                  </Button>
                )}

                {/* Loading State */}
                {isGenerating && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full gradient-ai opacity-20 animate-ping absolute" />
                          <div className="h-16 w-16 rounded-full gradient-ai flex items-center justify-center relative">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">AI is analyzing...</p>
                          <p className="text-sm text-muted-foreground">Generating recommended CAPA plan</p>
                        </div>
                        <div className="w-full max-w-xs space-y-2">
                          <div className="h-3 rounded skeleton-loader" />
                          <div className="h-3 rounded skeleton-loader w-4/5" />
                          <div className="h-3 rounded skeleton-loader w-3/5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CAPA Plan Form */}
                {showCapaPlan && (
                  <Card className="border shadow-sm animate-fade-in-up">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-base font-semibold flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                        Recommended CAPA Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Correction (Immediate Action)
                        </label>
                        <Textarea
                          value={correction}
                          onChange={(e) => setCorrection(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Prevention (Long-term Action)
                        </label>
                        <Textarea
                          value={prevention}
                          onChange={(e) => setPrevention(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Risk Assessment
                        </label>
                        <Textarea
                          value={riskAssessment}
                          onChange={(e) => setRiskAssessment(e.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <Button 
                          onClick={handleSubmitForApproval}
                          className="w-full h-11 bg-success hover:bg-success/90 text-success-foreground"
                          disabled={status === "pending-approval"}
                        >
                          {status === "pending-approval" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Submitted for Approval
                            </>
                          ) : (
                            "Submit for Approval"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}