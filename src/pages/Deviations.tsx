import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  FileText,
  ClipboardList,
  MessageSquareWarning,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FindingStatus = "open" | "in-progress" | "closed" | "ai-ready";
type Priority = "critical" | "high" | "medium" | "low";
type FindingSource = "deviation" | "audit" | "complaint";
type SortField = "id" | "date" | "priority" | "title";
type SortOrder = "asc" | "desc";

interface Finding {
  id: string;
  title: string;
  batch: string;
  status: FindingStatus;
  priority: Priority;
  date: string;
  assignee: string;
  department: string;
  type: string;
  source: FindingSource;
}

const allFindings: Finding[] = [
  { id: "DEV-2025-089", title: "Temperature Excursion - Warehouse B (Cold Storage)", batch: "#BF-VAC-2025-X", status: "ai-ready", priority: "critical", date: "2025-01-15", assignee: "Dr. Sarah Chen", department: "Quality Assurance", type: "Environmental", source: "deviation" },
  { id: "DEV-2025-088", title: "Particulate Matter Detection - Clean Room A", batch: "#BF-INJ-2025-Y", status: "ai-ready", priority: "high", date: "2025-01-14", assignee: "James Wilson", department: "Manufacturing", type: "Environmental", source: "deviation" },
  { id: "DEV-2025-087", title: "Documentation Gap - Batch Record Review", batch: "#BF-TAB-2025-Z", status: "in-progress", priority: "medium", date: "2025-01-13", assignee: "Maria Garcia", department: "Documentation", type: "Documentation", source: "deviation" },
  { id: "DEV-2025-086", title: "Equipment Calibration Drift - HPLC Unit 3", batch: "#BF-API-2025-A", status: "ai-ready", priority: "high", date: "2025-01-12", assignee: "Dr. Robert Kim", department: "Analytical", type: "Equipment", source: "deviation" },
  { id: "DEV-2025-085", title: "Raw Material Specification Failure - Excipient Lot", batch: "#BF-TAB-2025-B", status: "open", priority: "critical", date: "2025-01-11", assignee: "Lisa Thompson", department: "Quality Control", type: "Material", source: "deviation" },
  { id: "DEV-2025-084", title: "Process Parameter Deviation - Granulation", batch: "#BF-TAB-2025-C", status: "closed", priority: "medium", date: "2025-01-10", assignee: "David Chen", department: "Manufacturing", type: "Process", source: "deviation" },
  { id: "DEV-2025-083", title: "Humidity Control Failure - Stability Chamber 2", batch: "#BF-API-2025-D", status: "ai-ready", priority: "critical", date: "2025-01-09", assignee: "Dr. Sarah Chen", department: "Quality Control", type: "Environmental", source: "deviation" },
  { id: "AUD-2025-023", title: "GMP Documentation Non-Compliance - SOP Updates", batch: "N/A", status: "open", priority: "high", date: "2025-01-14", assignee: "Dr. Emily Watson", department: "Quality Assurance", type: "Compliance", source: "audit" },
  { id: "AUD-2025-022", title: "Training Records Gap - New Equipment Operators", batch: "N/A", status: "ai-ready", priority: "medium", date: "2025-01-12", assignee: "Michael Brown", department: "Training", type: "Training", source: "audit" },
  { id: "AUD-2025-021", title: "Supplier Qualification Incomplete - API Vendor", batch: "N/A", status: "ai-ready", priority: "critical", date: "2025-01-10", assignee: "Jennifer Lee", department: "Supply Chain", type: "Supplier", source: "audit" },
  { id: "AUD-2025-020", title: "CAPA Effectiveness Review Overdue", batch: "N/A", status: "ai-ready", priority: "high", date: "2025-01-08", assignee: "Dr. Emily Watson", department: "Quality Assurance", type: "Compliance", source: "audit" },
  { id: "CMP-2025-045", title: "Product Discoloration Reported - Tablet Batch", batch: "#BF-TAB-2025-G", status: "ai-ready", priority: "high", date: "2025-01-15", assignee: "Maria Garcia", department: "Quality Assurance", type: "Product Quality", source: "complaint" },
  { id: "CMP-2025-044", title: "Packaging Damage - Distribution Issue", batch: "#BF-INJ-2025-H", status: "in-progress", priority: "medium", date: "2025-01-13", assignee: "Lisa Thompson", department: "Packaging", type: "Packaging", source: "complaint" },
  { id: "CMP-2025-043", title: "Adverse Event Report - Injection Site Reaction", batch: "#BF-INJ-2025-I", status: "ai-ready", priority: "critical", date: "2025-01-11", assignee: "Dr. Sarah Chen", department: "Pharmacovigilance", type: "Safety", source: "complaint" },
  { id: "CMP-2025-042", title: "Foreign Particle Found in Vial", batch: "#BF-INJ-2025-J", status: "ai-ready", priority: "critical", date: "2025-01-09", assignee: "James Wilson", department: "Quality Control", type: "Product Quality", source: "complaint" },
];

const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function Deviations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filteredFindings = useMemo(() => {
    let result = [...allFindings];
    if (sourceFilter !== "all") result = result.filter(d => d.source === sourceFilter);
    if (activeTab !== "all") {
      if (activeTab === "open") result = result.filter(d => d.status === "open" || d.status === "ai-ready");
      else result = result.filter(d => d.status === activeTab);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.id.toLowerCase().includes(query) || d.title.toLowerCase().includes(query) || d.assignee.toLowerCase().includes(query)
      );
    }
    if (typeFilter !== "all") result = result.filter(d => d.type === typeFilter);
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id": comparison = a.id.localeCompare(b.id); break;
        case "date": comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case "priority": comparison = priorityOrder[a.priority] - priorityOrder[b.priority]; break;
        case "title": comparison = a.title.localeCompare(b.title); break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return result;
  }, [activeTab, searchQuery, sortField, sortOrder, typeFilter, sourceFilter]);

  const handleRowClick = (finding: Finding) => {
    if (finding.status === "ai-ready") {
      navigate("/investigation");
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case "ai-ready": return <Badge className="bg-gradient-to-r from-accent to-purple-500 text-accent-foreground text-[10px] px-1.5 py-0"><Sparkles className="w-2.5 h-2.5 mr-0.5" />AI Ready</Badge>;
      case "open": return <Badge variant="destructive" className="text-[10px] px-1.5 py-0"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Open</Badge>;
      case "in-progress": return <Badge variant="secondary" className="bg-warning/20 text-warning-foreground text-[10px] px-1.5 py-0"><Clock className="w-2.5 h-2.5 mr-0.5" />In Progress</Badge>;
      case "closed": return <Badge variant="outline" className="bg-success/10 text-success text-[10px] px-1.5 py-0"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Closed</Badge>;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "critical": return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>;
      case "high": return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">High</Badge>;
      case "medium": return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Medium</Badge>;
      case "low": return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Low</Badge>;
    }
  };

  const getSourceBadge = (source: FindingSource) => {
    switch (source) {
      case "deviation": return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0"><AlertCircle className="w-2.5 h-2.5 mr-0.5" />DEV</Badge>;
      case "audit": return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] px-1.5 py-0"><ClipboardList className="w-2.5 h-2.5 mr-0.5" />AUD</Badge>;
      case "complaint": return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] px-1.5 py-0"><MessageSquareWarning className="w-2.5 h-2.5 mr-0.5" />CMP</Badge>;
    }
  };

  const filteredBySource = sourceFilter === "all" ? allFindings : allFindings.filter(f => f.source === sourceFilter);
  const uniqueTypes = [...new Set(filteredBySource.map(d => d.type))];
  const counts = {
    all: filteredBySource.length,
    open: filteredBySource.filter(d => d.status === "open" || d.status === "ai-ready").length,
    "in-progress": filteredBySource.filter(d => d.status === "in-progress").length,
    closed: filteredBySource.filter(d => d.status === "closed").length,
  };
  const sourceCounts = {
    all: allFindings.length,
    deviation: allFindings.filter(f => f.source === "deviation").length,
    audit: allFindings.filter(f => f.source === "audit").length,
    complaint: allFindings.filter(f => f.source === "complaint").length,
  };

  return (
    <EnterpriseLayout
      breadcrumbs={[{ label: "Quality" }, { label: "Findings" }]}
      title="Quality Findings"
      subtitle="Track and manage deviations, audit findings, and complaints"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              New Finding
              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><AlertCircle className="w-3.5 h-3.5 mr-2 text-orange-500" />New Deviation</DropdownMenuItem>
            <DropdownMenuItem><ClipboardList className="w-3.5 h-3.5 mr-2 text-blue-500" />New Audit Finding</DropdownMenuItem>
            <DropdownMenuItem><MessageSquareWarning className="w-3.5 h-3.5 mr-2 text-purple-500" />New Complaint</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {/* Source Category Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "all", label: "All Findings", count: sourceCounts.all, icon: FileText, color: "from-gray-500 to-gray-600" },
          { key: "deviation", label: "Deviations", count: sourceCounts.deviation, icon: AlertCircle, color: "from-orange-500 to-amber-500" },
          { key: "audit", label: "Audits", count: sourceCounts.audit, icon: ClipboardList, color: "from-blue-500 to-cyan-500" },
          { key: "complaint", label: "Complaints", count: sourceCounts.complaint, icon: MessageSquareWarning, color: "from-purple-500 to-violet-500" },
        ].map((item) => (
          <Card 
            key={item.key}
            className={`cursor-pointer transition-all hover:shadow-sm ${sourceFilter === item.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSourceFilter(item.key)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="border shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="h-8 bg-muted/50">
                <TabsTrigger value="all" className="text-xs h-7 px-2.5 data-[state=active]:bg-background">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="open" className="text-xs h-7 px-2.5 data-[state=active]:bg-background">Open ({counts.open})</TabsTrigger>
                <TabsTrigger value="in-progress" className="text-xs h-7 px-2.5 data-[state=active]:bg-background">In Progress ({counts["in-progress"]})</TabsTrigger>
                <TabsTrigger value="closed" className="text-xs h-7 px-2.5 data-[state=active]:bg-background">Closed ({counts.closed})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search findings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs"><ArrowUpDown className="w-3 h-3 mr-1.5" />Sort</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortField("date")}>Date</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortField("priority")}>Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortField("id")}>ID</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="border rounded overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[10px] font-semibold h-8 px-3">ID</TableHead>
                  <TableHead className="text-[10px] font-semibold h-8 px-3">Source</TableHead>
                  <TableHead className="text-[10px] font-semibold h-8 px-3">Title</TableHead>
                  <TableHead className="text-[10px] font-semibold h-8 px-3">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold h-8 px-3">Priority</TableHead>
                  <TableHead className="text-[10px] font-semibold h-8 px-3">Assignee</TableHead>
                  <TableHead className="text-[10px] font-semibold h-8 px-3">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFindings.map((finding) => (
                  <TableRow key={finding.id} onClick={() => handleRowClick(finding)} className="cursor-pointer hover:bg-muted/50 h-10">
                    <TableCell className="font-mono text-xs px-3 py-2">{finding.id}</TableCell>
                    <TableCell className="px-3 py-2">{getSourceBadge(finding.source)}</TableCell>
                    <TableCell className="text-xs px-3 py-2 max-w-[300px] truncate">{finding.title}</TableCell>
                    <TableCell className="px-3 py-2">{getStatusBadge(finding.status)}</TableCell>
                    <TableCell className="px-3 py-2">{getPriorityBadge(finding.priority)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground px-3 py-2">{finding.assignee}</TableCell>
                    <TableCell className="text-xs text-muted-foreground px-3 py-2">{finding.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>Showing {filteredFindings.length} of {allFindings.length} findings</span>
          </div>
        </CardContent>
      </Card>
    </EnterpriseLayout>
  );
}
