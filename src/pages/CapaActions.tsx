import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search,
  Filter,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Target,
  Shield,
  ArrowUpDown,
  FileText,
  User,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CapaStatus = "draft" | "pending-approval" | "in-progress" | "completed" | "overdue";
type CapaType = "corrective" | "preventive" | "both";
type Priority = "critical" | "high" | "medium" | "low";

interface CapaAction {
  id: string;
  title: string;
  deviationId: string;
  type: CapaType;
  status: CapaStatus;
  priority: Priority;
  progress: number;
  dueDate: string;
  assignee: string;
  department: string;
  createdDate: string;
  correctionSummary: string;
  preventionSummary: string;
  aiGenerated: boolean;
}

const capaActions: CapaAction[] = [
  {
    id: "CAPA-2025-089",
    title: "Temperature Control Enhancement - Warehouse B",
    deviationId: "DEV-2025-089",
    type: "both",
    status: "pending-approval",
    priority: "critical",
    progress: 85,
    dueDate: "2025-01-25",
    assignee: "Dr. Sarah Chen",
    department: "Quality Assurance",
    createdDate: "2025-01-15",
    correctionSummary: "Recalibrate Sensor ID-55, manual temperature verification",
    preventionSummary: "Update PM schedule, install voltage stabilizer",
    aiGenerated: true,
  },
  {
    id: "CAPA-2025-088",
    title: "Clean Room Air Quality Improvement",
    deviationId: "DEV-2025-088",
    type: "preventive",
    status: "in-progress",
    priority: "high",
    progress: 45,
    dueDate: "2025-02-01",
    assignee: "James Wilson",
    department: "Manufacturing",
    createdDate: "2025-01-14",
    correctionSummary: "N/A",
    preventionSummary: "Upgrade HEPA filters, increase air change rate",
    aiGenerated: false,
  },
  {
    id: "CAPA-2025-087",
    title: "Batch Record Documentation Standardization",
    deviationId: "DEV-2025-087",
    type: "corrective",
    status: "in-progress",
    priority: "medium",
    progress: 60,
    dueDate: "2025-01-30",
    assignee: "Maria Garcia",
    department: "Documentation",
    createdDate: "2025-01-13",
    correctionSummary: "Complete missing entries for affected batches",
    preventionSummary: "N/A",
    aiGenerated: true,
  },
  {
    id: "CAPA-2025-086",
    title: "HPLC Calibration Protocol Update",
    deviationId: "DEV-2025-086",
    type: "both",
    status: "in-progress",
    priority: "high",
    progress: 70,
    dueDate: "2025-01-28",
    assignee: "Dr. Robert Kim",
    department: "Analytical",
    createdDate: "2025-01-12",
    correctionSummary: "Recalibrate HPLC Unit 3 with certified standards",
    preventionSummary: "Implement weekly calibration checks",
    aiGenerated: true,
  },
  {
    id: "CAPA-2025-085",
    title: "Excipient Supplier Qualification Review",
    deviationId: "DEV-2025-085",
    type: "preventive",
    status: "draft",
    priority: "critical",
    progress: 15,
    dueDate: "2025-02-10",
    assignee: "Lisa Thompson",
    department: "Quality Control",
    createdDate: "2025-01-11",
    correctionSummary: "N/A",
    preventionSummary: "Revise supplier audit criteria, add incoming inspection step",
    aiGenerated: false,
  },
  {
    id: "CAPA-2025-084",
    title: "Granulation Process Parameter Controls",
    deviationId: "DEV-2025-084",
    type: "both",
    status: "completed",
    priority: "medium",
    progress: 100,
    dueDate: "2025-01-15",
    assignee: "David Chen",
    department: "Manufacturing",
    createdDate: "2025-01-10",
    correctionSummary: "Adjusted granulation time and binder addition rate",
    preventionSummary: "Added real-time monitoring alerts",
    aiGenerated: true,
  },
  {
    id: "CAPA-2025-083",
    title: "Sterility Testing Protocol Enhancement",
    deviationId: "DEV-2025-083",
    type: "both",
    status: "completed",
    priority: "critical",
    progress: 100,
    dueDate: "2025-01-12",
    assignee: "Dr. Emily Watson",
    department: "Microbiology",
    createdDate: "2025-01-09",
    correctionSummary: "Re-tested batch with expanded sample size",
    preventionSummary: "Updated sampling protocol, added environmental controls",
    aiGenerated: false,
  },
  {
    id: "CAPA-2025-082",
    title: "Packaging Line Label Verification",
    deviationId: "DEV-2025-082",
    type: "corrective",
    status: "completed",
    priority: "low",
    progress: 100,
    dueDate: "2025-01-10",
    assignee: "Michael Brown",
    department: "Packaging",
    createdDate: "2025-01-08",
    correctionSummary: "Corrected printer configuration, verified labels",
    preventionSummary: "N/A",
    aiGenerated: false,
  },
  {
    id: "CAPA-2025-081",
    title: "WFI System Maintenance Upgrade",
    deviationId: "DEV-2025-081",
    type: "preventive",
    status: "overdue",
    priority: "high",
    progress: 30,
    dueDate: "2025-01-14",
    assignee: "Jennifer Lee",
    department: "Utilities",
    createdDate: "2025-01-07",
    correctionSummary: "N/A",
    preventionSummary: "Install backup sensors, upgrade PLC logic",
    aiGenerated: true,
  },
];

export default function CapaActions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  const filteredCapas = useMemo(() => {
    let result = [...capaActions];

    // Filter by tab/status
    if (activeTab !== "all") {
      if (activeTab === "active") {
        result = result.filter(c => ["in-progress", "pending-approval", "draft"].includes(c.status));
      } else {
        result = result.filter(c => c.status === activeTab);
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.deviationId.toLowerCase().includes(query) ||
        c.assignee.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(c => c.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority":
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "progress":
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    return result;
  }, [activeTab, searchQuery, typeFilter, sortBy]);

  const getStatusBadge = (status: CapaStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "pending-approval":
        return (
          <Badge className="bg-accent/20 text-accent border-accent/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: CapaType) => {
    switch (type) {
      case "corrective":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30">
            <Target className="w-3 h-3 mr-1" />
            Corrective
          </Badge>
        );
      case "preventive":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Shield className="w-3 h-3 mr-1" />
            Preventive
          </Badge>
        );
      case "both":
        return (
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
            <Target className="w-3 h-3 mr-1" />
            C & P
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case "high":
        return <Badge className="bg-warning text-warning-foreground text-xs">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  const counts = {
    all: capaActions.length,
    active: capaActions.filter(c => ["in-progress", "pending-approval", "draft"].includes(c.status)).length,
    completed: capaActions.filter(c => c.status === "completed").length,
    overdue: capaActions.filter(c => c.status === "overdue").length,
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">CAPA Actions</h1>
                <p className="text-muted-foreground mt-1">
                  Manage corrective and preventive action plans
                </p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <FileText className="w-4 h-4 mr-2" />
                New CAPA
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active CAPAs</p>
                      <p className="text-2xl font-semibold mt-1">{counts.active}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-semibold mt-1">{counts.completed}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-semibold mt-1">{counts.overdue}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Generated</p>
                      <p className="text-2xl font-semibold mt-1">
                        {capaActions.filter(c => c.aiGenerated).length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs and Filters */}
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="all" className="data-[state=active]:bg-background">
                        All ({counts.all})
                      </TabsTrigger>
                      <TabsTrigger value="active" className="data-[state=active]:bg-background">
                        Active ({counts.active})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="data-[state=active]:bg-background">
                        Completed ({counts.completed})
                      </TabsTrigger>
                      <TabsTrigger value="overdue" className="data-[state=active]:bg-background">
                        Overdue ({counts.overdue})
                      </TabsTrigger>
                    </TabsList>

                    <div className="relative flex-1 lg:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search CAPAs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-sm">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="both">Both (C & P)</SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <ArrowUpDown className="w-3 h-3 mr-2" />
                          Sort
                          <ChevronDown className="w-3 h-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setSortBy("dueDate")}>
                          Due Date
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("priority")}>
                          Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("progress")}>
                          Progress
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {(typeFilter !== "all" || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8"
                        onClick={() => {
                          setTypeFilter("all");
                          setSearchQuery("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <TabsContent value={activeTab} className="mt-0 space-y-3">
                    {filteredCapas.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No CAPA actions found matching your criteria
                      </div>
                    ) : (
                      filteredCapas.map((capa) => {
                        const daysRemaining = getDaysRemaining(capa.dueDate);
                        
                        return (
                          <Card 
                            key={capa.id}
                            className={`border cursor-pointer transition-all hover:shadow-md ${
                              capa.aiGenerated ? "bg-accent/5 border-accent/20" : ""
                            } ${capa.status === "overdue" ? "border-destructive/30" : ""}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="font-mono text-sm text-muted-foreground">{capa.id}</span>
                                    {capa.aiGenerated && (
                                      <Badge className="bg-gradient-to-r from-accent to-purple-500 text-accent-foreground text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        AI Generated
                                      </Badge>
                                    )}
                                    {getTypeBadge(capa.type)}
                                    {getStatusBadge(capa.status)}
                                  </div>
                                  
                                  <h3 className="font-medium text-foreground mb-1">{capa.title}</h3>
                                  
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center">
                                      <FileText className="w-3 h-3 mr-1" />
                                      {capa.deviationId}
                                    </span>
                                    <span className="flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      {capa.assignee}
                                    </span>
                                    <span className="hidden sm:flex items-center">
                                      {capa.department}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress & Due Date */}
                                <div className="flex items-center gap-6 lg:w-auto">
                                  <div className="flex-1 lg:w-32">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-muted-foreground">Progress</span>
                                      <span className="font-medium">{capa.progress}%</span>
                                    </div>
                                    <Progress value={capa.progress} className="h-2" />
                                  </div>

                                  <div className="text-right lg:w-24">
                                    <div className="flex items-center justify-end gap-1 text-sm">
                                      <Calendar className="w-3 h-3 text-muted-foreground" />
                                      <span className={daysRemaining < 0 ? "text-destructive font-medium" : daysRemaining <= 3 ? "text-warning font-medium" : "text-muted-foreground"}>
                                        {daysRemaining < 0 
                                          ? `${Math.abs(daysRemaining)}d overdue`
                                          : daysRemaining === 0 
                                            ? "Due today"
                                            : `${daysRemaining}d left`
                                        }
                                      </span>
                                    </div>
                                    <div className="mt-1">
                                      {getPriorityBadge(capa.priority)}
                                    </div>
                                  </div>

                                  <ChevronRight className="w-5 h-5 text-muted-foreground hidden lg:block" />
                                </div>
                              </div>

                              {/* Action Summary */}
                              {(capa.correctionSummary !== "N/A" || capa.preventionSummary !== "N/A") && (
                                <div className="mt-3 pt-3 border-t grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {capa.correctionSummary !== "N/A" && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground flex items-center mb-1">
                                        <Target className="w-3 h-3 mr-1" />
                                        Correction:
                                      </span>
                                      <p className="text-foreground line-clamp-1">{capa.correctionSummary}</p>
                                    </div>
                                  )}
                                  {capa.preventionSummary !== "N/A" && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground flex items-center mb-1">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Prevention:
                                      </span>
                                      <p className="text-foreground line-clamp-1">{capa.preventionSummary}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
              Showing {filteredCapas.length} of {capaActions.length} CAPA actions
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
