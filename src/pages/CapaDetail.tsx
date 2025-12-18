import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  Send,
  Target,
  Shield,
  TrendingUp,
} from "lucide-react";

interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  dueDate: string;
  completedDate?: string;
  assignee: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: "comment" | "status_change" | "step_completed" | "attachment";
  user: string;
  content: string;
  timestamp: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

const capaData = {
  id: "CAPA-2025-045",
  title: "Implement Enhanced Environmental Monitoring System",
  type: "preventive",
  status: "in-progress",
  priority: "high",
  progress: 65,
  description: "Implementation of an advanced environmental monitoring system to prevent contamination events in cleanroom facilities. This CAPA addresses recurring environmental excursions identified in Q4 2024.",
  rootCause: "Inadequate real-time monitoring capabilities and delayed alert notifications leading to extended exposure periods during environmental excursions.",
  linkedDeviation: "DEV-2025-089",
  createdDate: "2025-01-15",
  dueDate: "2025-02-28",
  owner: "Sarah Chen",
  department: "Quality Assurance",
  effectiveness: {
    criteria: "Zero environmental excursions for 90 consecutive days post-implementation",
    verificationDate: "2025-05-28",
    status: "pending"
  }
};

const implementationSteps: ImplementationStep[] = [
  {
    id: "step-1",
    title: "Conduct Gap Analysis",
    description: "Review current monitoring capabilities and identify gaps in coverage, alert thresholds, and response times.",
    status: "completed",
    dueDate: "2025-01-20",
    completedDate: "2025-01-19",
    assignee: "Sarah Chen",
    notes: "Gap analysis completed. Identified 3 critical gaps in particle monitoring coverage."
  },
  {
    id: "step-2",
    title: "Vendor Selection & Procurement",
    description: "Evaluate and select environmental monitoring system vendors. Complete procurement process.",
    status: "completed",
    dueDate: "2025-01-31",
    completedDate: "2025-01-30",
    assignee: "Michael Rodriguez",
    notes: "Selected EnviroTech Pro system. Purchase order #PO-2025-1234 approved."
  },
  {
    id: "step-3",
    title: "System Installation",
    description: "Install new monitoring sensors and connect to central data collection system.",
    status: "completed",
    dueDate: "2025-02-10",
    completedDate: "2025-02-08",
    assignee: "Technical Services",
  },
  {
    id: "step-4",
    title: "System Validation (IQ/OQ)",
    description: "Complete Installation Qualification and Operational Qualification protocols.",
    status: "in-progress",
    dueDate: "2025-02-18",
    assignee: "Quality Assurance",
    notes: "IQ completed. OQ in progress - 75% complete."
  },
  {
    id: "step-5",
    title: "Performance Qualification (PQ)",
    description: "Execute Performance Qualification protocol under actual operating conditions.",
    status: "pending",
    dueDate: "2025-02-25",
    assignee: "Quality Assurance",
  },
  {
    id: "step-6",
    title: "Training & Documentation",
    description: "Train all relevant personnel and update SOPs to reflect new system procedures.",
    status: "pending",
    dueDate: "2025-02-28",
    assignee: "Training Department",
  },
];

const activities: Activity[] = [
  {
    id: "act-1",
    type: "step_completed",
    user: "Technical Services",
    content: "Completed step: System Installation - All 12 sensors installed and connected.",
    timestamp: "2025-02-08 14:30"
  },
  {
    id: "act-2",
    type: "comment",
    user: "Sarah Chen",
    content: "IQ protocol completed successfully. Moving forward with OQ testing.",
    timestamp: "2025-02-12 09:15"
  },
  {
    id: "act-3",
    type: "attachment",
    user: "Michael Rodriguez",
    content: "Uploaded: IQ_Protocol_Executed.pdf",
    timestamp: "2025-02-12 10:00"
  },
  {
    id: "act-4",
    type: "status_change",
    user: "System",
    content: "Progress updated to 65%",
    timestamp: "2025-02-15 08:00"
  },
];

const attachments: Attachment[] = [
  { id: "att-1", name: "Gap_Analysis_Report.pdf", type: "PDF", size: "2.4 MB", uploadedBy: "Sarah Chen", uploadedAt: "2025-01-19" },
  { id: "att-2", name: "Vendor_Evaluation_Matrix.xlsx", type: "Excel", size: "156 KB", uploadedBy: "Michael Rodriguez", uploadedAt: "2025-01-28" },
  { id: "att-3", name: "IQ_Protocol_Executed.pdf", type: "PDF", size: "4.1 MB", uploadedBy: "Michael Rodriguez", uploadedAt: "2025-02-12" },
  { id: "att-4", name: "System_Architecture_Diagram.png", type: "Image", size: "890 KB", uploadedBy: "Technical Services", uploadedAt: "2025-02-05" },
];

export default function CapaDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newComment, setNewComment] = useState("");
  const [steps, setSteps] = useState(implementationSteps);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "corrective" ? (
      <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
        <Target className="h-3 w-3 mr-1" />
        Corrective
      </Badge>
    ) : (
      <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
        <Shield className="h-3 w-3 mr-1" />
        Preventive
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-4 w-4" />;
      case "status_change":
        return <TrendingUp className="h-4 w-4" />;
      case "step_completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "attachment":
        return <Paperclip className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const totalSteps = steps.length;

  const getDaysRemaining = () => {
    const due = new Date(capaData.dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/capa-actions")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{capaData.id}</h1>
              {getTypeBadge(capaData.type)}
              {getStatusBadge(capaData.status)}
              {getPriorityBadge(capaData.priority)}
            </div>
            <p className="text-muted-foreground">{capaData.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Edit</Button>
            <Button>Complete CAPA</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{capaData.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Root Cause</h4>
                  <p className="text-sm">{capaData.rootCause}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Linked Deviation</h4>
                    <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate("/investigation")}>
                      {capaData.linkedDeviation}
                    </Button>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Department</h4>
                    <p className="text-sm">{capaData.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Implementation Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Implementation Steps</CardTitle>
                    <CardDescription>{completedSteps} of {totalSteps} steps completed</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{capaData.progress}%</div>
                    <p className="text-xs text-muted-foreground">Overall Progress</p>
                  </div>
                </div>
                <Progress value={capaData.progress} className="h-2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`relative pl-8 pb-4 ${index !== steps.length - 1 ? "border-l-2 border-muted ml-2.5" : "ml-2.5"}`}
                    >
                      <div className="absolute -left-2.5 top-0 bg-background p-0.5">
                        {getStepIcon(step.status)}
                      </div>
                      <div className={`p-4 rounded-lg border ${step.status === "in-progress" ? "border-blue-500/30 bg-blue-500/5" : step.status === "completed" ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-muted/30"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                              {getStatusBadge(step.status)}
                            </div>
                            <h4 className="font-medium mb-1">{step.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                            {step.notes && (
                              <div className="bg-background/50 rounded p-2 text-xs text-muted-foreground border">
                                <strong>Notes:</strong> {step.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-xs space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground justify-end">
                              <User className="h-3 w-3" />
                              {step.assignee}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground justify-end">
                              <Calendar className="h-3 w-3" />
                              Due: {step.dueDate}
                            </div>
                            {step.completedDate && (
                              <div className="flex items-center gap-1 text-emerald-500 justify-end">
                                <CheckCircle2 className="h-3 w-3" />
                                {step.completedDate}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Effectiveness Check */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Effectiveness Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Success Criteria</h4>
                  <p className="text-sm">{capaData.effectiveness.criteria}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Verification Date</h4>
                    <p className="text-sm">{capaData.effectiveness.verificationDate}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                    <Badge variant="secondary">Pending Verification</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Owner</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">SC</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{capaData.owner}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{capaData.createdDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="text-sm font-medium">{capaData.dueDate}</span>
                </div>
                <Separator />
                <div className={`p-3 rounded-lg ${daysRemaining <= 7 ? "bg-destructive/10" : daysRemaining <= 14 ? "bg-yellow-500/10" : "bg-emerald-500/10"}`}>
                  <div className="flex items-center gap-2">
                    {daysRemaining <= 7 ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm font-medium ${daysRemaining <= 7 ? "text-destructive" : ""}`}>
                      {daysRemaining} days remaining
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Attachments</CardTitle>
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="p-2 rounded bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="p-1.5 rounded-full bg-muted h-fit">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{" "}
                          <span className="text-muted-foreground">{activity.content}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                  <Button size="icon" className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
