import { useState, useMemo } from "react";
import { 
  Search,
  Filter,
  ChevronDown,
  Calendar,
  User,
  FileText,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Plus,
  Eye,
  Send,
  Download,
  RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type ActivityType = "create" | "update" | "delete" | "approve" | "submit" | "view" | "export" | "system";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  type: ActivityType;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

const auditData: AuditEntry[] = [
  {
    id: "AUD-99281",
    timestamp: "2025-01-15T14:32:00",
    user: "Dr. Sarah Chen",
    userRole: "QA Officer",
    action: "CAPA Plan Submitted",
    type: "submit",
    entity: "CAPA",
    entityId: "CAPA-2025-089",
    details: "CAPA plan for DEV-2025-089 submitted for approval",
    ipAddress: "192.168.1.45",
  },
  {
    id: "AUD-99280",
    timestamp: "2025-01-15T14:28:00",
    user: "Dr. Sarah Chen",
    userRole: "QA Officer",
    action: "CAPA Plan Generated",
    type: "create",
    entity: "CAPA",
    entityId: "CAPA-2025-089",
    details: "AI-assisted CAPA plan generated for deviation DEV-2025-089",
    ipAddress: "192.168.1.45",
  },
  {
    id: "AUD-99279",
    timestamp: "2025-01-15T14:15:00",
    user: "System",
    userRole: "AI Engine",
    action: "Root Cause Analysis Completed",
    type: "system",
    entity: "Deviation",
    entityId: "DEV-2025-089",
    details: "AI analysis completed with 92% confidence. Suggested root cause: HVAC Sensor Drift",
    ipAddress: "System",
  },
  {
    id: "AUD-99278",
    timestamp: "2025-01-15T12:45:00",
    user: "James Wilson",
    userRole: "Manufacturing Lead",
    action: "Deviation Created",
    type: "create",
    entity: "Deviation",
    entityId: "DEV-2025-089",
    details: "Temperature excursion detected in Warehouse B Cold Storage",
    ipAddress: "192.168.1.102",
  },
  {
    id: "AUD-99277",
    timestamp: "2025-01-15T11:30:00",
    user: "Maria Garcia",
    userRole: "Documentation Specialist",
    action: "Investigation Updated",
    type: "update",
    entity: "Deviation",
    entityId: "DEV-2025-087",
    details: "Added supporting documentation for batch record review",
    ipAddress: "192.168.1.88",
  },
  {
    id: "AUD-99276",
    timestamp: "2025-01-15T10:15:00",
    user: "Dr. Robert Kim",
    userRole: "QA Manager",
    action: "CAPA Approved",
    type: "approve",
    entity: "CAPA",
    entityId: "CAPA-2025-084",
    details: "Approved corrective action plan for granulation process deviation",
    ipAddress: "192.168.1.12",
  },
  {
    id: "AUD-99275",
    timestamp: "2025-01-15T09:45:00",
    user: "Lisa Thompson",
    userRole: "QC Analyst",
    action: "Deviation Viewed",
    type: "view",
    entity: "Deviation",
    entityId: "DEV-2025-085",
    details: "Accessed raw material specification failure details",
    ipAddress: "192.168.1.67",
  },
  {
    id: "AUD-99274",
    timestamp: "2025-01-15T09:00:00",
    user: "System",
    userRole: "Scheduler",
    action: "Daily Report Generated",
    type: "system",
    entity: "Report",
    entityId: "RPT-2025-015",
    details: "Automated daily quality metrics report generated",
    ipAddress: "System",
  },
  {
    id: "AUD-99273",
    timestamp: "2025-01-14T17:30:00",
    user: "Michael Brown",
    userRole: "Packaging Supervisor",
    action: "Deviation Closed",
    type: "update",
    entity: "Deviation",
    entityId: "DEV-2025-082",
    details: "Labeling error resolved. Root cause: Printer configuration mismatch",
    ipAddress: "192.168.1.134",
  },
  {
    id: "AUD-99272",
    timestamp: "2025-01-14T16:15:00",
    user: "Dr. Emily Watson",
    userRole: "Microbiology Lead",
    action: "Report Exported",
    type: "export",
    entity: "Report",
    entityId: "DEV-2025-083",
    details: "Exported sterility test investigation report as PDF",
    ipAddress: "192.168.1.91",
  },
  {
    id: "AUD-99271",
    timestamp: "2025-01-14T15:00:00",
    user: "Jennifer Lee",
    userRole: "Utilities Engineer",
    action: "Investigation Started",
    type: "update",
    entity: "Deviation",
    entityId: "DEV-2025-081",
    details: "Initiated investigation for WFI loop water system alert",
    ipAddress: "192.168.1.156",
  },
  {
    id: "AUD-99270",
    timestamp: "2025-01-14T14:00:00",
    user: "David Chen",
    userRole: "Process Engineer",
    action: "Evidence Uploaded",
    type: "create",
    entity: "Attachment",
    entityId: "ATT-2025-445",
    details: "Uploaded 3 supporting documents for DEV-2025-084",
    ipAddress: "192.168.1.78",
  },
];

const getActionIcon = (type: ActivityType) => {
  switch (type) {
    case "create":
      return <Plus className="w-4 h-4" />;
    case "update":
      return <Edit3 className="w-4 h-4" />;
    case "delete":
      return <Trash2 className="w-4 h-4" />;
    case "approve":
      return <CheckCircle2 className="w-4 h-4" />;
    case "submit":
      return <Send className="w-4 h-4" />;
    case "view":
      return <Eye className="w-4 h-4" />;
    case "export":
      return <Download className="w-4 h-4" />;
    case "system":
      return <Settings className="w-4 h-4" />;
  }
};

const getActionColor = (type: ActivityType) => {
  switch (type) {
    case "create":
      return "bg-success/10 text-success border-success/20";
    case "update":
      return "bg-primary/10 text-primary border-primary/20";
    case "delete":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "approve":
      return "bg-success/10 text-success border-success/20";
    case "submit":
      return "bg-accent/10 text-accent border-accent/20";
    case "view":
      return "bg-muted text-muted-foreground border-border";
    case "export":
      return "bg-primary/10 text-primary border-primary/20";
    case "system":
      return "bg-warning/10 text-warning border-warning/20";
  }
};

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredEntries = useMemo(() => {
    let result = [...auditData];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(entry =>
        entry.id.toLowerCase().includes(query) ||
        entry.user.toLowerCase().includes(query) ||
        entry.action.toLowerCase().includes(query) ||
        entry.details.toLowerCase().includes(query) ||
        entry.entityId.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter(entry => entry.type === typeFilter);
    }

    if (entityFilter !== "all") {
      result = result.filter(entry => entry.entity === entityFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        switch (dateFilter) {
          case "today":
            return entryDate >= today;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return entryDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return result;
  }, [searchQuery, typeFilter, entityFilter, dateFilter]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const uniqueEntities = [...new Set(auditData.map(e => e.entity))];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Audit Trail</h1>
                <p className="text-muted-foreground mt-1">
                  Complete chronological log of all system activities
                </p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Log
              </Button>
            </div>

            {/* Filters */}
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="relative flex-1 lg:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[130px] h-9">
                        <Calendar className="w-3 h-3 mr-2" />
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Action Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="create">Created</SelectItem>
                        <SelectItem value="update">Updated</SelectItem>
                        <SelectItem value="approve">Approved</SelectItem>
                        <SelectItem value="submit">Submitted</SelectItem>
                        <SelectItem value="view">Viewed</SelectItem>
                        <SelectItem value="export">Exported</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Entity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        {uniqueEntities.map(entity => (
                          <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(typeFilter !== "all" || entityFilter !== "all" || dateFilter !== "all" || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setTypeFilter("all");
                          setEntityFilter("all");
                          setDateFilter("all");
                          setSearchQuery("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Timeline */}
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="p-4 space-y-1">
                    {filteredEntries.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No audit entries found matching your criteria
                      </div>
                    ) : (
                      filteredEntries.map((entry, index) => {
                        const { date, time } = formatTimestamp(entry.timestamp);
                        const showDateHeader = index === 0 || 
                          formatTimestamp(filteredEntries[index - 1].timestamp).date !== date;

                        return (
                          <div key={entry.id}>
                            {showDateHeader && (
                              <div className="sticky top-0 bg-background py-2 mb-2 border-b">
                                <span className="text-sm font-medium text-muted-foreground">{date}</span>
                              </div>
                            )}
                            <div className="flex gap-4 py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors group">
                              {/* Timeline indicator */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getActionColor(entry.type)}`}>
                                  {getActionIcon(entry.type)}
                                </div>
                                {index < filteredEntries.length - 1 && (
                                  <div className="w-px h-full bg-border mt-2 min-h-[20px]" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-foreground">{entry.action}</span>
                                      <Badge variant="outline" className="text-xs font-mono">
                                        {entry.entityId}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {entry.details}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        {entry.user}
                                        <span className="text-muted-foreground/60 ml-1">({entry.userRole})</span>
                                      </span>
                                      <span className="hidden sm:inline">IP: {entry.ipAddress}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-sm text-muted-foreground">{time}</span>
                                    <p className="text-xs font-mono text-muted-foreground/60 mt-1">
                                      {entry.id}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredEntries.length} of {auditData.length} entries</span>
              <span className="flex items-center">
                <RefreshCw className="w-3 h-3 mr-1" />
                Last updated: Just now
              </span>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
