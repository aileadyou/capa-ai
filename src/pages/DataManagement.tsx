import { useState } from "react";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, FileText, Factory, BookOpen, Upload, RefreshCw, Clock, Brain, Sparkles, Wifi, Activity } from "lucide-react";

type ConnectionStatus = "connected" | "syncing" | "disconnected" | "error";

interface DataSource {
  id: string;
  title: string;
  description: string;
  icon: typeof Database;
  color: string;
  records: number;
  lastSync: string;
  status: ConnectionStatus;
  syncProgress: number;
  types: string[];
  latency: number;
}

const dataSources: DataSource[] = [
  { id: "eqms", title: "eQMS", description: "Electronic Quality Management System", icon: Database, color: "from-blue-500 to-cyan-500", records: 2847, lastSync: "2 mins ago", status: "connected", syncProgress: 100, types: ["Audits", "Deviations", "Complaints", "CAPAs"], latency: 24 },
  { id: "mes", title: "MES", description: "Manufacturing Execution System", icon: Factory, color: "from-green-500 to-emerald-500", records: 15623, lastSync: "5 mins ago", status: "connected", syncProgress: 100, types: ["Batch Records", "Process Data", "Equipment Logs"], latency: 18 },
  { id: "documents", title: "Physical Documents", description: "Digitized Paper Records", icon: FileText, color: "from-orange-500 to-amber-500", records: 892, lastSync: "1 hour ago", status: "syncing", syncProgress: 67, types: ["Audit Findings", "Deviation Reports", "SOPs"], latency: 156 },
  { id: "external", title: "External Knowledge", description: "Regulations & Public Domain", icon: BookOpen, color: "from-purple-500 to-violet-500", records: 4521, lastSync: "Daily", status: "connected", syncProgress: 100, types: ["FDA Regulations", "ICH Guidelines", "EU GMP Laws"], latency: 89 },
];

const recentIngestions = [
  { name: "DEV-2024-0892 Investigation Report", source: "eQMS", time: "2 mins ago" },
  { name: "Batch Record BR-20241215-A", source: "MES", time: "5 mins ago" },
  { name: "FDA 21 CFR Part 211 Update", source: "External", time: "1 hour ago" },
  { name: "SOP-QA-0045 Rev 3", source: "Documents", time: "2 hours ago" },
];

export default function DataManagement() {
  const [totalRecords] = useState(23883);

  return (
    <EnterpriseLayout
      breadcrumbs={[{ label: "System" }, { label: "Data Management" }]}
      title="Data Management System"
      subtitle="AI Knowledge Brain for CAPA AI Quality Management"
      actions={
        <Button size="sm" className="h-8">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Sync All
        </Button>
      }
    >
      {/* AI Status Card */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-success rounded-full border-2 border-background" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">AI Knowledge Base Active</h3>
                  <Badge className="bg-success/10 text-success text-[10px] px-1.5 py-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Processing and indexing data from all sources</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums">{totalRecords.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Vector embeddings generated</span>
              <span className="font-medium">98.5%</span>
            </div>
            <Progress value={98.5} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dataSources.map((source) => (
          <Card key={source.id} className="overflow-hidden relative">
            <div className={`absolute top-0 left-0 h-0.5 bg-gradient-to-r ${source.color} transition-all ${source.status === "syncing" ? "animate-pulse" : ""}`} style={{ width: source.status === "syncing" ? `${source.syncProgress}%` : "100%" }} />
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded bg-gradient-to-br ${source.color} flex items-center justify-center`}>
                    <source.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{source.title}</CardTitle>
                    <CardDescription className="text-[10px]">{source.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${source.status === "connected" ? "bg-success" : source.status === "syncing" ? "bg-warning animate-pulse" : "bg-muted-foreground"}`} />
                  <Wifi className={`h-3 w-3 ${source.status === "connected" ? "text-success" : "text-muted-foreground"}`} />
                  <span className="text-[10px] text-muted-foreground">{source.latency}ms</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {source.status === "syncing" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Syncing...</span>
                    <span>{Math.round(source.syncProgress)}%</span>
                  </div>
                  <Progress value={source.syncProgress} className="h-1" />
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Records</span>
                <span className="font-medium tabular-nums">{source.records.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last sync</span>
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{source.lastSync}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {source.types.map((type) => (
                  <Badge key={type} variant="outline" className="text-[10px] px-1.5 py-0">{type}</Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                <Upload className="h-3 w-3 mr-1.5" />
                Upload Data
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Ingestions */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm">Recent Data Ingestions</CardTitle>
          <CardDescription className="text-xs">Latest records added to the AI knowledge base</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {recentIngestions.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {index === 0 && <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-success rounded-full animate-pulse" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">From {item.source}</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </EnterpriseLayout>
  );
}
