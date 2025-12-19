import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Thermometer,
  Cpu,
  CheckCircle2,
  Loader2,
  Brain,
  FileText,
  History,
  Package,
  Info,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { AIDataCard } from "@/components/AIDataCard";
import { SimilarityChart } from "@/components/SimilarityChart";
import { SystemLogToast } from "@/components/SystemLogToast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const deviationData = {
  id: "DEV-2025-089",
  title: "Temperature Excursion - Warehouse B (Cold Storage)",
  batch: "#BF-VAC-2025-X",
  eventTime: "02:14 AM",
  eventDate: "2025-01-15",
  detectedBy: "MES Sensor ID-55",
  value: "8.5°C",
  limit: "2.0°C - 8.0°C",
  duration: "15 Minutes",
  status: "Investigation",
  priority: "High",
};

const linkedCases = [
  { id: "DEV-2023-004", similarity: 94, year: "2023" },
  { id: "DEV-2024-012", similarity: 87, year: "2024" },
  { id: "DEV-2024-045", similarity: 72, year: "2024" },
];

const auditTrailEntries = [
  { action: "Investigation opened", user: "J. Smith", timestamp: "2025-01-15 02:18:33", id: "99278" },
  { action: "AI analysis initiated", user: "System", timestamp: "2025-01-15 02:18:45", id: "99279" },
  { action: "Root cause suggested", user: "AI Engine", timestamp: "2025-01-15 02:19:02", id: "99280" },
];

const batchLogEntries = [
  { time: "02:00", temp: "7.2°C", status: "Normal" },
  { time: "02:05", temp: "7.5°C", status: "Normal" },
  { time: "02:10", temp: "7.9°C", status: "Warning" },
  { time: "02:14", temp: "8.5°C", status: "Excursion" },
  { time: "02:20", temp: "8.2°C", status: "Excursion" },
  { time: "02:29", temp: "7.8°C", status: "Normal" },
];

export default function Investigation() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"ai-ready" | "pending-approval">("ai-ready");
  const [showCapaPlan, setShowCapaPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSystemLog, setShowSystemLog] = useState(false);

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

  const handleApproveRootCause = () => {
    setShowSystemLog(true);
    toast({
      title: "Root cause approved",
      description: "Audit Trail #99281 updated.",
    });
    setTimeout(() => setShowSystemLog(false), 3000);
  };

  const handleSubmitForApproval = () => {
    setStatus("pending-approval");
    setShowSystemLog(true);
    toast({
      title: "CAPA Plan Submitted",
      description: "Audit Trail #99282 updated.",
    });
    setTimeout(() => setShowSystemLog(false), 3000);
  };

  return (
    <EnterpriseLayout
      breadcrumbs={[
        { label: "Quality" },
        { label: "Findings", href: "/deviations" },
        { label: `#${deviationData.id}` },
      ]}
      title={deviationData.title}
      subtitle={`Batch: ${deviationData.batch}`}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {deviationData.status}
          </Badge>
          <Badge variant="destructive" className="text-xs">
            {deviationData.priority}
          </Badge>
        </div>
      }
    >
      {/* System Log Feedback */}
      {showSystemLog && (
        <SystemLogToast
          action="Action recorded to audit trail"
          timestamp={new Date().toLocaleTimeString()}
          auditId="99281"
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Left Column - Main Content with Tabs */}
            <div className="xl:col-span-8">
              <Card className="border">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-base font-semibold">
                    {deviationData.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                      <TabsTrigger
                        value="details"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
                      >
                        Case Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="evidence"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
                      >
                        Evidence
                      </TabsTrigger>
                      <TabsTrigger
                        value="batch"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
                      >
                        Batch Logs
                      </TabsTrigger>
                      <TabsTrigger
                        value="audit"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
                      >
                        Audit Trail
                      </TabsTrigger>
                    </TabsList>

                    {/* Case Details Tab */}
                    <TabsContent value="details" className="p-4 space-y-4 mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="data-card">
                          <span className="text-xs text-muted-foreground">Event Date</span>
                          <p className="text-sm font-medium mt-1">{deviationData.eventDate}</p>
                        </div>
                        <div className="data-card">
                          <span className="text-xs text-muted-foreground">Event Time</span>
                          <p className="text-sm font-medium mt-1">{deviationData.eventTime}</p>
                        </div>
                        <div className="data-card">
                          <span className="text-xs text-muted-foreground">Duration</span>
                          <p className="text-sm font-medium mt-1">{deviationData.duration}</p>
                        </div>
                        <div className="data-card">
                          <span className="text-xs text-muted-foreground">Detected By</span>
                          <p className="text-sm font-medium mt-1">{deviationData.detectedBy}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="data-card border-destructive/30 bg-destructive/5">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-muted-foreground">Recorded Value</span>
                          </div>
                          <p className="text-lg font-semibold text-destructive mt-1">{deviationData.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">Limit: {deviationData.limit}</p>
                        </div>
                        <div className="data-card">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Batch Reference</span>
                          </div>
                          <p className="text-sm font-mono font-medium mt-1">{deviationData.batch}</p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Evidence Tab */}
                    <TabsContent value="evidence" className="p-4 mt-0">
                      <div className="text-sm text-muted-foreground text-center py-8">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p>No evidence documents attached.</p>
                        <Button variant="outline" size="sm" className="mt-3">
                          Upload Evidence
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Batch Logs Tab */}
                    <TabsContent value="batch" className="p-4 mt-0">
                      <div className="border rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Time</th>
                              <th className="px-3 py-2 text-left font-medium">Temperature</th>
                              <th className="px-3 py-2 text-left font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchLogEntries.map((entry, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2 font-mono">{entry.time}</td>
                                <td className="px-3 py-2">{entry.temp}</td>
                                <td className="px-3 py-2">
                                  <Badge
                                    variant={
                                      entry.status === "Excursion"
                                        ? "destructive"
                                        : entry.status === "Warning"
                                        ? "outline"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {entry.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    {/* Audit Trail Tab */}
                    <TabsContent value="audit" className="p-4 mt-0">
                      <div className="space-y-2">
                        {auditTrailEntries.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <History className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{entry.action}</p>
                                <p className="text-xs text-muted-foreground">{entry.user}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-xs">{entry.timestamp}</p>
                              <p className="text-xs text-muted-foreground">#{entry.id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* CAPA Plan Section */}
              {showCapaPlan && (
                <Card className="border mt-4 animate-fade-in">
                  <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Recommended CAPA Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        CORRECTION (Immediate Action)
                      </label>
                      <Textarea
                        value={correction}
                        onChange={(e) => setCorrection(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        PREVENTION (Long-term Action)
                      </label>
                      <Textarea
                        value={prevention}
                        onChange={(e) => setPrevention(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        RISK ASSESSMENT
                      </label>
                      <Textarea
                        value={riskAssessment}
                        onChange={(e) => setRiskAssessment(e.target.value)}
                        className="min-h-[40px] resize-none text-sm"
                      />
                    </div>

                    <div className="pt-2 border-t flex justify-end">
                      <Button
                        onClick={handleSubmitForApproval}
                        className="bg-primary hover:bg-primary-dark"
                        disabled={status === "pending-approval"}
                      >
                        {status === "pending-approval" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Submitted
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

            {/* Right Column - AI Sidecar Panel */}
            <div className="xl:col-span-4">
              <div className="sticky top-14 space-y-4">
                {/* AI Diagnostic Panel */}
                <Card className="border bg-panel">
                  <CardHeader className="py-3 px-4 border-b bg-panel">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Brain className="h-4 w-4 text-accent" />
                      AI Diagnostic
                      {status === "ai-ready" && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Ready
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Root Cause Analysis */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                        Root Cause Analysis
                      </h4>
                      <AIDataCard
                        title="Primary Cause"
                        value="HVAC Unit 4 Sensor Drift due to power fluctuation"
                        confidence={92}
                        source="Historical deviation pattern matching"
                        sourceRef="Pattern DB v2.4"
                      />
                    </div>

                    {/* Similarity Analysis */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                        Similar Cases
                        <button className="text-primary hover:underline text-xs font-normal">
                          <ExternalLink className="h-3 w-3 inline mr-0.5" />
                          View All
                        </button>
                      </h4>
                      <SimilarityChart cases={linkedCases} />
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t space-y-2">
                      <Button
                        onClick={handleApproveRootCause}
                        className="w-full bg-primary hover:bg-primary-dark text-sm"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve AI Suggestion
                      </Button>

                      {!showCapaPlan && !isGenerating && (
                        <Button
                          onClick={handleGenerateCapa}
                          variant="outline"
                          className="w-full text-sm"
                          size="sm"
                        >
                          Generate CAPA Plan
                        </Button>
                      )}

                      {isGenerating && (
                        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating CAPA...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-foreground">3</p>
                        <p className="text-xs text-muted-foreground">Similar Cases</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-success">84%</p>
                        <p className="text-xs text-muted-foreground">Avg Similarity</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
    </EnterpriseLayout>
  );
}
