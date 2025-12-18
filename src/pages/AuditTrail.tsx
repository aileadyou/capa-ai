import { useState, useMemo } from "react";
import { Search, Filter, Calendar, User, FileText, Settings, CheckCircle2, Edit3, Plus, Eye, Send, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type ActivityType = "create" | "update" | "delete" | "approve" | "submit" | "view" | "export" | "system";
interface AuditEntry { id: string; timestamp: string; user: string; userRole: string; action: string; type: ActivityType; entity: string; entityId: string; details: string; }

const auditData: AuditEntry[] = [
  { id: "AUD-99281", timestamp: "2025-01-15T14:32:00", user: "Dr. Sarah Chen", userRole: "QA Officer", action: "CAPA Plan Submitted", type: "submit", entity: "CAPA", entityId: "CAPA-2025-089", details: "CAPA plan for DEV-2025-089 submitted for approval" },
  { id: "AUD-99280", timestamp: "2025-01-15T14:28:00", user: "Dr. Sarah Chen", userRole: "QA Officer", action: "CAPA Plan Generated", type: "create", entity: "CAPA", entityId: "CAPA-2025-089", details: "AI-assisted CAPA plan generated for deviation DEV-2025-089" },
  { id: "AUD-99279", timestamp: "2025-01-15T14:15:00", user: "System", userRole: "AI Engine", action: "Root Cause Analysis Completed", type: "system", entity: "Deviation", entityId: "DEV-2025-089", details: "AI analysis completed with 92% confidence" },
  { id: "AUD-99278", timestamp: "2025-01-15T12:45:00", user: "James Wilson", userRole: "Manufacturing Lead", action: "Deviation Created", type: "create", entity: "Deviation", entityId: "DEV-2025-089", details: "Temperature excursion detected in Warehouse B" },
  { id: "AUD-99277", timestamp: "2025-01-15T11:30:00", user: "Maria Garcia", userRole: "Documentation Specialist", action: "Investigation Updated", type: "update", entity: "Deviation", entityId: "DEV-2025-087", details: "Added supporting documentation" },
  { id: "AUD-99276", timestamp: "2025-01-15T10:15:00", user: "Dr. Robert Kim", userRole: "QA Manager", action: "CAPA Approved", type: "approve", entity: "CAPA", entityId: "CAPA-2025-084", details: "Approved corrective action plan" },
];

const getActionIcon = (type: ActivityType) => {
  switch (type) { case "create": return <Plus className="w-3.5 h-3.5" />; case "update": return <Edit3 className="w-3.5 h-3.5" />; case "approve": return <CheckCircle2 className="w-3.5 h-3.5" />; case "submit": return <Send className="w-3.5 h-3.5" />; case "view": return <Eye className="w-3.5 h-3.5" />; case "export": return <Download className="w-3.5 h-3.5" />; case "system": return <Settings className="w-3.5 h-3.5" />; default: return <FileText className="w-3.5 h-3.5" />; }
};
const getActionColor = (type: ActivityType) => {
  switch (type) { case "create": case "approve": return "bg-success/10 text-success border-success/20"; case "update": case "export": return "bg-primary/10 text-primary border-primary/20"; case "submit": return "bg-accent/10 text-accent border-accent/20"; case "system": return "bg-warning/10 text-warning border-warning/20"; default: return "bg-muted text-muted-foreground border-border"; }
};

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const filteredEntries = useMemo(() => {
    let result = [...auditData];
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(e => e.id.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q)); }
    if (typeFilter !== "all") result = result.filter(e => e.type === typeFilter);
    if (entityFilter !== "all") result = result.filter(e => e.entity === entityFilter);
    return result;
  }, [searchQuery, typeFilter, entityFilter]);

  const formatTimestamp = (ts: string) => { const d = new Date(ts); return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }; };
  const uniqueEntities = [...new Set(auditData.map(e => e.entity))];

  return (
    <EnterpriseLayout breadcrumbs={[{ label: "System" }, { label: "Audit Trail" }]} title="Audit Trail" subtitle="Complete chronological log of all system activities" actions={<Button variant="outline" size="sm" className="h-8"><Download className="w-3.5 h-3.5 mr-1.5" />Export</Button>}>
      <Card className="border shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
            <div className="relative flex-1 lg:max-w-sm"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Search audit entries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" /></div>
            <div className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-muted-foreground" /><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="all">All Actions</SelectItem><SelectItem value="create">Created</SelectItem><SelectItem value="update">Updated</SelectItem><SelectItem value="approve">Approved</SelectItem><SelectItem value="submit">Submitted</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select><Select value={entityFilter} onValueChange={setEntityFilter}><SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Entity" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{uniqueEntities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-3 space-y-1">
              {filteredEntries.map((entry) => {
                const { date, time } = formatTimestamp(entry.timestamp);
                return (
                  <div key={entry.id} className="flex gap-3 py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                    <div className={`w-7 h-7 rounded flex items-center justify-center border shrink-0 ${getActionColor(entry.type)}`}>{getActionIcon(entry.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-sm font-medium">{entry.action}</span><Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{entry.entityId}</Badge></div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground"><span className="flex items-center"><User className="w-2.5 h-2.5 mr-0.5" />{entry.user}</span><span>{entry.userRole}</span></div>
                    </div>
                    <div className="text-right shrink-0"><span className="text-xs text-muted-foreground">{time}</span><p className="text-[10px] text-muted-foreground/60">{date}</p></div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </EnterpriseLayout>
  );
}
