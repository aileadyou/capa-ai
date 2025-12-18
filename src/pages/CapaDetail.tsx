import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Calendar, Clock, User, FileText, CheckCircle2, Circle, AlertTriangle, Paperclip, MessageSquare, Send, Target, Shield, TrendingUp } from "lucide-react";

interface ImplementationStep { id: string; title: string; description: string; status: "completed" | "in-progress" | "pending"; dueDate: string; completedDate?: string; assignee: string; notes?: string; }
interface Activity { id: string; type: "comment" | "status_change" | "step_completed" | "attachment"; user: string; content: string; timestamp: string; }
interface Attachment { id: string; name: string; type: string; size: string; uploadedBy: string; uploadedAt: string; }

const capaData = { id: "CAPA-2025-045", title: "Implement Enhanced Environmental Monitoring System", type: "preventive", status: "in-progress", priority: "high", progress: 65, description: "Implementation of an advanced environmental monitoring system to prevent contamination events in cleanroom facilities.", rootCause: "Inadequate real-time monitoring capabilities and delayed alert notifications.", linkedDeviation: "DEV-2025-089", createdDate: "2025-01-15", dueDate: "2025-02-28", owner: "Sarah Chen", department: "Quality Assurance", effectiveness: { criteria: "Zero environmental excursions for 90 consecutive days post-implementation", verificationDate: "2025-05-28", status: "pending" } };

const implementationSteps: ImplementationStep[] = [
  { id: "step-1", title: "Conduct Gap Analysis", description: "Review current monitoring capabilities and identify gaps.", status: "completed", dueDate: "2025-01-20", completedDate: "2025-01-19", assignee: "Sarah Chen", notes: "Gap analysis completed. Identified 3 critical gaps." },
  { id: "step-2", title: "Vendor Selection & Procurement", description: "Evaluate and select environmental monitoring system vendors.", status: "completed", dueDate: "2025-01-31", completedDate: "2025-01-30", assignee: "Michael Rodriguez", notes: "Selected EnviroTech Pro system." },
  { id: "step-3", title: "System Installation", description: "Install new monitoring sensors and connect to central system.", status: "completed", dueDate: "2025-02-10", completedDate: "2025-02-08", assignee: "Technical Services" },
  { id: "step-4", title: "System Validation (IQ/OQ)", description: "Complete Installation and Operational Qualification protocols.", status: "in-progress", dueDate: "2025-02-18", assignee: "Quality Assurance", notes: "IQ completed. OQ in progress - 75% complete." },
  { id: "step-5", title: "Performance Qualification (PQ)", description: "Execute PQ protocol under actual operating conditions.", status: "pending", dueDate: "2025-02-25", assignee: "Quality Assurance" },
  { id: "step-6", title: "Training & Documentation", description: "Train personnel and update SOPs.", status: "pending", dueDate: "2025-02-28", assignee: "Training Department" },
];

const activities: Activity[] = [
  { id: "act-1", type: "step_completed", user: "Technical Services", content: "Completed step: System Installation", timestamp: "2025-02-08 14:30" },
  { id: "act-2", type: "comment", user: "Sarah Chen", content: "IQ protocol completed successfully.", timestamp: "2025-02-12 09:15" },
  { id: "act-3", type: "attachment", user: "Michael Rodriguez", content: "Uploaded: IQ_Protocol_Executed.pdf", timestamp: "2025-02-12 10:00" },
];

const attachments: Attachment[] = [
  { id: "att-1", name: "Gap_Analysis_Report.pdf", type: "PDF", size: "2.4 MB", uploadedBy: "Sarah Chen", uploadedAt: "2025-01-19" },
  { id: "att-2", name: "Vendor_Evaluation_Matrix.xlsx", type: "Excel", size: "156 KB", uploadedBy: "Michael Rodriguez", uploadedAt: "2025-01-28" },
  { id: "att-3", name: "IQ_Protocol_Executed.pdf", type: "PDF", size: "4.1 MB", uploadedBy: "Michael Rodriguez", uploadedAt: "2025-02-12" },
];

export default function CapaDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newComment, setNewComment] = useState("");
  const [steps] = useState(implementationSteps);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-success/10 text-success text-[10px] px-1.5 py-0"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Completed</Badge>;
      case "in-progress": return <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0"><Clock className="w-2.5 h-2.5 mr-0.5" />In Progress</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => type === "corrective" 
    ? <Badge className="bg-warning/10 text-warning-foreground text-[10px] px-1.5 py-0"><Target className="w-2.5 h-2.5 mr-0.5" />Corrective</Badge>
    : <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0"><Shield className="w-2.5 h-2.5 mr-0.5" />Preventive</Badge>;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>;
      case "high": return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">High</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Medium</Badge>;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "in-progress": return <Clock className="h-4 w-4 text-primary animate-pulse" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageSquare className="h-3 w-3" />;
      case "step_completed": return <CheckCircle2 className="h-3 w-3 text-success" />;
      case "attachment": return <Paperclip className="h-3 w-3" />;
      default: return <TrendingUp className="h-3 w-3" />;
    }
  };

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const daysRemaining = Math.ceil((new Date(capaData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <EnterpriseLayout
      breadcrumbs={[{ label: "Quality", href: "/" }, { label: "CAPA Actions", href: "/capa-actions" }, { label: capaData.id }]}
      title={capaData.id}
      subtitle={capaData.title}
      actions={
        <div className="flex items-center gap-2">
          {getTypeBadge(capaData.type)}
          {getStatusBadge(capaData.status)}
          {getPriorityBadge(capaData.priority)}
          <Button variant="outline" size="sm" className="h-8">Edit</Button>
          <Button size="sm" className="h-8">Complete CAPA</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div>
                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs">{capaData.description}</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Root Cause</h4>
                <p className="text-xs">{capaData.rootCause}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Linked Deviation</h4>
                  <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => navigate("/investigation")}>{capaData.linkedDeviation}</Button>
                </div>
                <div>
                  <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Department</h4>
                  <p className="text-xs">{capaData.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Steps */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Implementation Steps</CardTitle>
                  <CardDescription className="text-xs">{completedSteps} of {steps.length} steps completed</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{capaData.progress}%</div>
                  <p className="text-[10px] text-muted-foreground">Progress</p>
                </div>
              </div>
              <Progress value={capaData.progress} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={step.id} className={`relative pl-6 ${index !== steps.length - 1 ? "pb-2" : ""}`}>
                    <div className="absolute left-0 top-0">{getStepIcon(step.status)}</div>
                    {index !== steps.length - 1 && <div className="absolute left-2 top-5 w-px h-full bg-border" />}
                    <div className={`p-2.5 rounded border ${step.status === "in-progress" ? "border-primary/30 bg-primary/5" : step.status === "completed" ? "border-success/20 bg-success/5" : "border-border bg-muted/30"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] text-muted-foreground">Step {index + 1}</span>
                            {getStatusBadge(step.status)}
                          </div>
                          <h4 className="text-xs font-medium">{step.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                          {step.notes && <div className="mt-1.5 p-1.5 bg-background/50 rounded text-[10px] text-muted-foreground border"><strong>Notes:</strong> {step.notes}</div>}
                        </div>
                        <div className="text-right text-[10px] shrink-0 space-y-0.5">
                          <div className="flex items-center gap-0.5 text-muted-foreground justify-end"><User className="h-2.5 w-2.5" />{step.assignee}</div>
                          <div className="flex items-center gap-0.5 text-muted-foreground justify-end"><Calendar className="h-2.5 w-2.5" />Due: {step.dueDate}</div>
                          {step.completedDate && <div className="flex items-center gap-0.5 text-success justify-end"><CheckCircle2 className="h-2.5 w-2.5" />{step.completedDate}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Effectiveness */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm flex items-center gap-1.5"><Target className="h-4 w-4 text-primary" />Effectiveness Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <div>
                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Success Criteria</h4>
                <p className="text-xs">{capaData.effectiveness.criteria}</p>
              </div>
              <div className="flex items-center gap-4">
                <div><h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Verification Date</h4><p className="text-xs">{capaData.effectiveness.verificationDate}</p></div>
                <div><h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</h4><Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pending</Badge></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Owner</span>
                <div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">SC</AvatarFallback></Avatar><span className="font-medium">{capaData.owner}</span></div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Created</span><span>{capaData.createdDate}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Due Date</span><span className="font-medium">{capaData.dueDate}</span></div>
              <Separator />
              <div className={`p-2 rounded ${daysRemaining <= 7 ? "bg-destructive/10" : daysRemaining <= 14 ? "bg-warning/10" : "bg-success/10"}`}>
                <div className="flex items-center gap-1.5">
                  {daysRemaining <= 7 ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className={`text-xs font-medium ${daysRemaining <= 7 ? "text-destructive" : ""}`}>{daysRemaining} days remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm">Attachments ({attachments.length})</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-primary" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{att.name}</p><p className="text-[10px] text-muted-foreground">{att.size}</p></div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-xs"><Paperclip className="h-3 w-3 mr-1.5" />Add Attachment</Button>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2 mb-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">{getActivityIcon(act.type)}</div>
                    <div className="flex-1 min-w-0"><p className="text-xs">{act.content}</p><p className="text-[10px] text-muted-foreground">{act.user} · {act.timestamp}</p></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="text-xs min-h-[60px]" />
              </div>
              <Button size="sm" className="w-full mt-2 h-7 text-xs"><Send className="h-3 w-3 mr-1.5" />Post Comment</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
