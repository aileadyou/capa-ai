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
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // Deviations
  {
    id: "DEV-2025-089",
    title: "Temperature Excursion - Warehouse B (Cold Storage)",
    batch: "#BF-VAC-2025-X",
    status: "ai-ready",
    priority: "critical",
    date: "2025-01-15",
    assignee: "Dr. Sarah Chen",
    department: "Quality Assurance",
    type: "Environmental",
    source: "deviation",
  },
  {
    id: "DEV-2025-088",
    title: "Particulate Matter Detection - Clean Room A",
    batch: "#BF-INJ-2025-Y",
    status: "open",
    priority: "high",
    date: "2025-01-14",
    assignee: "James Wilson",
    department: "Manufacturing",
    type: "Environmental",
    source: "deviation",
  },
  {
    id: "DEV-2025-087",
    title: "Documentation Gap - Batch Record Review",
    batch: "#BF-TAB-2025-Z",
    status: "in-progress",
    priority: "medium",
    date: "2025-01-13",
    assignee: "Maria Garcia",
    department: "Documentation",
    type: "Documentation",
    source: "deviation",
  },
  {
    id: "DEV-2025-086",
    title: "Equipment Calibration Drift - HPLC Unit 3",
    batch: "#BF-API-2025-A",
    status: "in-progress",
    priority: "high",
    date: "2025-01-12",
    assignee: "Dr. Robert Kim",
    department: "Analytical",
    type: "Equipment",
    source: "deviation",
  },
  {
    id: "DEV-2025-085",
    title: "Raw Material Specification Failure - Excipient Lot",
    batch: "#BF-TAB-2025-B",
    status: "open",
    priority: "critical",
    date: "2025-01-11",
    assignee: "Lisa Thompson",
    department: "Quality Control",
    type: "Material",
    source: "deviation",
  },
  {
    id: "DEV-2025-084",
    title: "Process Parameter Deviation - Granulation",
    batch: "#BF-TAB-2025-C",
    status: "closed",
    priority: "medium",
    date: "2025-01-10",
    assignee: "David Chen",
    department: "Manufacturing",
    type: "Process",
    source: "deviation",
  },
  // Audit Findings
  {
    id: "AUD-2025-023",
    title: "GMP Documentation Non-Compliance - SOP Updates",
    batch: "N/A",
    status: "open",
    priority: "high",
    date: "2025-01-14",
    assignee: "Dr. Emily Watson",
    department: "Quality Assurance",
    type: "Compliance",
    source: "audit",
  },
  {
    id: "AUD-2025-022",
    title: "Training Records Gap - New Equipment Operators",
    batch: "N/A",
    status: "in-progress",
    priority: "medium",
    date: "2025-01-12",
    assignee: "Michael Brown",
    department: "Training",
    type: "Training",
    source: "audit",
  },
  {
    id: "AUD-2025-021",
    title: "Supplier Qualification Incomplete - API Vendor",
    batch: "N/A",
    status: "ai-ready",
    priority: "critical",
    date: "2025-01-10",
    assignee: "Jennifer Lee",
    department: "Supply Chain",
    type: "Supplier",
    source: "audit",
  },
  {
    id: "AUD-2025-020",
    title: "Data Integrity Finding - Lab Notebook Entries",
    batch: "N/A",
    status: "open",
    priority: "high",
    date: "2025-01-08",
    assignee: "Dr. Robert Kim",
    department: "Quality Control",
    type: "Data Integrity",
    source: "audit",
  },
  {
    id: "AUD-2025-019",
    title: "Cleaning Validation Protocol Missing - Line 3",
    batch: "N/A",
    status: "closed",
    priority: "medium",
    date: "2025-01-05",
    assignee: "Andrew Smith",
    department: "Validation",
    type: "Validation",
    source: "audit",
  },
  // Complaints
  {
    id: "CMP-2025-045",
    title: "Product Discoloration Reported - Tablet Batch",
    batch: "#BF-TAB-2025-G",
    status: "open",
    priority: "high",
    date: "2025-01-15",
    assignee: "Maria Garcia",
    department: "Quality Assurance",
    type: "Product Quality",
    source: "complaint",
  },
  {
    id: "CMP-2025-044",
    title: "Packaging Damage - Distribution Issue",
    batch: "#BF-INJ-2025-H",
    status: "in-progress",
    priority: "medium",
    date: "2025-01-13",
    assignee: "Lisa Thompson",
    department: "Packaging",
    type: "Packaging",
    source: "complaint",
  },
  {
    id: "CMP-2025-043",
    title: "Adverse Event Report - Injection Site Reaction",
    batch: "#BF-INJ-2025-I",
    status: "ai-ready",
    priority: "critical",
    date: "2025-01-11",
    assignee: "Dr. Sarah Chen",
    department: "Pharmacovigilance",
    type: "Safety",
    source: "complaint",
  },
  {
    id: "CMP-2025-042",
    title: "Labeling Complaint - Expiry Date Unclear",
    batch: "#BF-TAB-2025-J",
    status: "closed",
    priority: "low",
    date: "2025-01-09",
    assignee: "James Wilson",
    department: "Packaging",
    type: "Labeling",
    source: "complaint",
  },
  {
    id: "CMP-2025-041",
    title: "Efficacy Concern - Customer Feedback",
    batch: "#BF-TAB-2025-K",
    status: "in-progress",
    priority: "high",
    date: "2025-01-07",
    assignee: "Dr. Emily Watson",
    department: "Medical Affairs",
    type: "Efficacy",
    source: "complaint",
  },
];

const priorityOrder: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function Deviations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filteredFindings = useMemo(() => {
    let result = [...allFindings];

    // Filter by source
    if (sourceFilter !== "all") {
      result = result.filter(d => d.source === sourceFilter);
    }

    // Filter by tab/status
    if (activeTab !== "all") {
      if (activeTab === "open") {
        result = result.filter(d => d.status === "open" || d.status === "ai-ready");
      } else {
        result = result.filter(d => d.status === activeTab);
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.id.toLowerCase().includes(query) ||
        d.title.toLowerCase().includes(query) ||
        d.batch.toLowerCase().includes(query) ||
        d.assignee.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(d => d.type === typeFilter);
    }

    // Filter by department
    if (departmentFilter !== "all") {
      result = result.filter(d => d.department === departmentFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "priority":
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [activeTab, searchQuery, sortField, sortOrder, typeFilter, departmentFilter, sourceFilter]);

  const handleRowClick = (finding: Finding) => {
    if (finding.id === "DEV-2025-089" || finding.id === "AUD-2025-021" || finding.id === "CMP-2025-043") {
      navigate("/investigation");
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case "ai-ready":
        return (
          <Badge className="bg-gradient-to-r from-accent to-purple-500 text-accent-foreground animate-pulse-subtle">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Ready
          </Badge>
        );
      case "open":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Open
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning-foreground border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-warning text-warning-foreground">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getSourceBadge = (source: FindingSource) => {
    switch (source) {
      case "deviation":
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Deviation
          </Badge>
        );
      case "audit":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <ClipboardList className="w-3 h-3 mr-1" />
            Audit
          </Badge>
        );
      case "complaint":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
            <MessageSquareWarning className="w-3 h-3 mr-1" />
            Complaint
          </Badge>
        );
    }
  };

  const filteredBySource = sourceFilter === "all" ? allFindings : allFindings.filter(f => f.source === sourceFilter);
  const uniqueTypes = [...new Set(filteredBySource.map(d => d.type))];
  const uniqueDepartments = [...new Set(filteredBySource.map(d => d.department))];

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Quality Findings</h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage deviations, audit findings, and complaints
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <FileText className="w-4 h-4 mr-2" />
                    New Finding
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                    New Deviation
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ClipboardList className="w-4 h-4 mr-2 text-blue-500" />
                    New Audit Finding
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquareWarning className="w-4 h-4 mr-2 text-purple-500" />
                    New Complaint
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Source Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${sourceFilter === "all" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSourceFilter("all")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{sourceCounts.all}</p>
                      <p className="text-sm text-muted-foreground">All Findings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${sourceFilter === "deviation" ? "ring-2 ring-orange-500" : ""}`}
                onClick={() => setSourceFilter("deviation")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{sourceCounts.deviation}</p>
                      <p className="text-sm text-muted-foreground">Deviations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${sourceFilter === "audit" ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSourceFilter("audit")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{sourceCounts.audit}</p>
                      <p className="text-sm text-muted-foreground">Audit Findings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${sourceFilter === "complaint" ? "ring-2 ring-purple-500" : ""}`}
                onClick={() => setSourceFilter("complaint")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                      <MessageSquareWarning className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{sourceCounts.complaint}</p>
                      <p className="text-sm text-muted-foreground">Complaints</p>
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
                      <TabsTrigger value="open" className="data-[state=active]:bg-background">
                        Open ({counts.open})
                      </TabsTrigger>
                      <TabsTrigger value="in-progress" className="data-[state=active]:bg-background">
                        In Progress ({counts["in-progress"]})
                      </TabsTrigger>
                      <TabsTrigger value="closed" className="data-[state=active]:bg-background">
                        Closed ({counts.closed})
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search findings..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-2">Filters:</span>
                    
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-sm">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[160px] h-8 text-sm">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {uniqueDepartments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <ArrowUpDown className="w-3 h-3 mr-2" />
                          Sort: {sortField.charAt(0).toUpperCase() + sortField.slice(1)}
                          <ChevronDown className="w-3 h-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => { setSortField("date"); setSortOrder("desc"); }}>
                          Date (Newest)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortField("date"); setSortOrder("asc"); }}>
                          Date (Oldest)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortField("priority"); setSortOrder("asc"); }}>
                          Priority (High to Low)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortField("priority"); setSortOrder("desc"); }}>
                          Priority (Low to High)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortField("id"); setSortOrder("desc"); }}>
                          ID (Newest)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortField("title"); setSortOrder("asc"); }}>
                          Title (A-Z)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {(typeFilter !== "all" || departmentFilter !== "all" || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setTypeFilter("all");
                          setDepartmentFilter("all");
                          setSearchQuery("");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>

                  <TabsContent value={activeTab} className="mt-0">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Source</TableHead>
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Priority</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Assignee</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFindings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No findings found matching your criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredFindings.map((finding) => (
                              <TableRow 
                                key={finding.id}
                                onClick={() => handleRowClick(finding)}
                                className={`cursor-pointer transition-colors ${
                                  finding.status === "ai-ready" 
                                    ? "bg-accent/5 hover:bg-accent/10" 
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <TableCell className="font-mono text-sm">{finding.id}</TableCell>
                                <TableCell>{getSourceBadge(finding.source)}</TableCell>
                                <TableCell className="font-medium max-w-[250px] truncate">
                                  {finding.title}
                                </TableCell>
                                <TableCell>{getStatusBadge(finding.status)}</TableCell>
                                <TableCell>{getPriorityBadge(finding.priority)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {new Date(finding.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm">{finding.assignee}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <span>Showing {filteredFindings.length} of {filteredBySource.length} findings</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
