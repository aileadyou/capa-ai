import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ChevronDown, CheckCircle2, Clock, AlertTriangle, Sparkles, Target, Shield, ArrowUpDown, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type CapaStatus = "draft" | "pending-approval" | "in-progress" | "completed" | "overdue";
type CapaType = "corrective" | "preventive" | "both";
type Priority = "critical" | "high" | "medium" | "low";

interface CapaAction { id: string; title: string; deviationId: string; type: CapaType; status: CapaStatus; priority: Priority; progress: number; dueDate: string; assignee: string; aiGenerated: boolean; }

const capaActions: CapaAction[] = [
  { id: "CAPA-2025-089", title: "Temperature Control Enhancement - Warehouse B", deviationId: "DEV-2025-089", type: "both", status: "pending-approval", priority: "critical", progress: 85, dueDate: "2025-01-25", assignee: "Dr. Sarah Chen", aiGenerated: true },
  { id: "CAPA-2025-088", title: "Clean Room Air Quality Improvement", deviationId: "DEV-2025-088", type: "preventive", status: "in-progress", priority: "high", progress: 45, dueDate: "2025-02-01", assignee: "James Wilson", aiGenerated: false },
  { id: "CAPA-2025-087", title: "Batch Record Documentation Standardization", deviationId: "DEV-2025-087", type: "corrective", status: "in-progress", priority: "medium", progress: 60, dueDate: "2025-01-30", assignee: "Maria Garcia", aiGenerated: true },
  { id: "CAPA-2025-086", title: "HPLC Calibration Protocol Update", deviationId: "DEV-2025-086", type: "both", status: "in-progress", priority: "high", progress: 70, dueDate: "2025-01-28", assignee: "Dr. Robert Kim", aiGenerated: true },
  { id: "CAPA-2025-084", title: "Granulation Process Parameter Controls", deviationId: "DEV-2025-084", type: "both", status: "completed", priority: "medium", progress: 100, dueDate: "2025-01-15", assignee: "David Chen", aiGenerated: true },
  { id: "CAPA-2025-081", title: "WFI System Maintenance Upgrade", deviationId: "DEV-2025-081", type: "preventive", status: "overdue", priority: "high", progress: 30, dueDate: "2025-01-14", assignee: "Jennifer Lee", aiGenerated: true },
];

export default function CapaActions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  const filteredCapas = useMemo(() => {
    let result = [...capaActions];
    if (activeTab !== "all") {
      if (activeTab === "active") result = result.filter(c => ["in-progress", "pending-approval", "draft"].includes(c.status));
      else result = result.filter(c => c.status === activeTab);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => c.id.toLowerCase().includes(query) || c.title.toLowerCase().includes(query) || c.assignee.toLowerCase().includes(query));
    }
    if (typeFilter !== "all") result = result.filter(c => c.type === typeFilter);
    result.sort((a, b) => {
      if (sortBy === "dueDate") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === "priority") { const order = { critical: 0, high: 1, medium: 2, low: 3 }; return order[a.priority] - order[b.priority]; }
      return b.progress - a.progress;
    });
    return result;
  }, [activeTab, searchQuery, typeFilter, sortBy]);

  const getStatusBadge = (status: CapaStatus) => {
    switch (status) {
      case "pending-approval": return <Badge className="bg-accent/20 text-accent text-[10px] px-1.5 py-0"><Clock className="w-2.5 h-2.5 mr-0.5" />Pending</Badge>;
      case "in-progress": return <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-1.5 py-0"><Clock className="w-2.5 h-2.5 mr-0.5" />In Progress</Badge>;
      case "completed": return <Badge className="bg-success/10 text-success text-[10px] px-1.5 py-0"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Completed</Badge>;
      case "overdue": return <Badge variant="destructive" className="text-[10px] px-1.5 py-0"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Overdue</Badge>;
      default: return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>;
    }
  };

  const getTypeBadge = (type: CapaType) => {
    if (type === "corrective") return <Badge variant="outline" className="bg-warning/10 text-warning-foreground text-[10px] px-1.5 py-0"><Target className="w-2.5 h-2.5 mr-0.5" />C</Badge>;
    if (type === "preventive") return <Badge variant="outline" className="bg-primary/10 text-primary text-[10px] px-1.5 py-0"><Shield className="w-2.5 h-2.5 mr-0.5" />P</Badge>;
    return <Badge variant="outline" className="bg-accent/10 text-accent text-[10px] px-1.5 py-0">C&P</Badge>;
  };

  const counts = { all: capaActions.length, active: capaActions.filter(c => ["in-progress", "pending-approval", "draft"].includes(c.status)).length, completed: capaActions.filter(c => c.status === "completed").length, overdue: capaActions.filter(c => c.status === "overdue").length };

  return (
    <EnterpriseLayout breadcrumbs={[{ label: "Quality" }, { label: "CAPA Actions" }]} title="CAPA Actions" subtitle="Manage corrective and preventive action plans" actions={<Button size="sm" className="h-8"><FileText className="w-3.5 h-3.5 mr-1.5" />New CAPA</Button>}>
      <div className="grid grid-cols-4 gap-3">
        <Card className="border shadow-sm"><CardContent className="p-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-semibold">{counts.active}</p></div><div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center"><Clock className="h-4 w-4 text-primary" /></div></div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-semibold">{counts.completed}</p></div><div className="h-8 w-8 rounded bg-success/10 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-success" /></div></div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Overdue</p><p className="text-xl font-semibold">{counts.overdue}</p></div><div className="h-8 w-8 rounded bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div></div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">AI Generated</p><p className="text-xl font-semibold">{capaActions.filter(c => c.aiGenerated).length}</p></div><div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-accent" /></div></div></CardContent></Card>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="h-8 bg-muted/50"><TabsTrigger value="all" className="text-xs h-7 px-2.5">All ({counts.all})</TabsTrigger><TabsTrigger value="active" className="text-xs h-7 px-2.5">Active ({counts.active})</TabsTrigger><TabsTrigger value="completed" className="text-xs h-7 px-2.5">Completed</TabsTrigger><TabsTrigger value="overdue" className="text-xs h-7 px-2.5">Overdue</TabsTrigger></TabsList></Tabs>
            <div className="relative flex-1 lg:max-w-xs"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Search CAPAs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" /></div>
            <div className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-muted-foreground" /><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="corrective">Corrective</SelectItem><SelectItem value="preventive">Preventive</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent></Select><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs"><ArrowUpDown className="w-3 h-3 mr-1.5" />Sort</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => setSortBy("dueDate")}>Due Date</DropdownMenuItem><DropdownMenuItem onClick={() => setSortBy("priority")}>Priority</DropdownMenuItem><DropdownMenuItem onClick={() => setSortBy("progress")}>Progress</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
          </div>
          <div className="space-y-2">
            {filteredCapas.map((capa) => (
              <div key={capa.id} onClick={() => navigate(`/capa-actions/${capa.id}`)} className="p-3 border rounded cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5"><span className="text-[10px] font-mono text-muted-foreground">{capa.id}</span>{getTypeBadge(capa.type)}{getStatusBadge(capa.status)}{capa.aiGenerated && <Badge className="bg-gradient-to-r from-accent to-purple-500 text-[10px] px-1.5 py-0"><Sparkles className="w-2.5 h-2.5 mr-0.5" />AI</Badge>}</div>
                    <h3 className="text-sm font-medium truncate">{capa.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{capa.assignee} · Due: {capa.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0"><div className="w-20"><div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">Progress</span><span className="font-medium">{capa.progress}%</span></div><Progress value={capa.progress} className="h-1.5" /></div><ChevronRight className="w-4 h-4 text-muted-foreground" /></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </EnterpriseLayout>
  );
}
