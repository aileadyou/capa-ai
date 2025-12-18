import { SidebarProvider } from "@/components/ui/sidebar";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  FileText,
  Factory,
  BookOpen,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  Brain,
  Sparkles,
} from "lucide-react";

const dataSources = [
  {
    id: "eqms",
    title: "eQMS",
    description: "Electronic Quality Management System",
    icon: Database,
    color: "from-blue-500 to-cyan-500",
    records: 2847,
    lastSync: "2 mins ago",
    status: "synced",
    types: ["Audits", "Deviations", "Complaints", "CAPAs"],
  },
  {
    id: "mes",
    title: "MES",
    description: "Manufacturing Execution System",
    icon: Factory,
    color: "from-green-500 to-emerald-500",
    records: 15623,
    lastSync: "5 mins ago",
    status: "synced",
    types: ["Batch Records", "Process Data", "Equipment Logs", "Production Orders"],
  },
  {
    id: "documents",
    title: "Physical Documents",
    description: "Digitized Paper Records",
    icon: FileText,
    color: "from-orange-500 to-amber-500",
    records: 892,
    lastSync: "1 hour ago",
    status: "syncing",
    types: ["Audit Findings", "Deviation Reports", "Batch Reports", "SOPs"],
  },
  {
    id: "external",
    title: "External Knowledge",
    description: "Regulations & Public Domain",
    icon: BookOpen,
    color: "from-purple-500 to-violet-500",
    records: 4521,
    lastSync: "Daily",
    status: "synced",
    types: ["FDA Regulations", "ICH Guidelines", "EU GMP Laws", "Industry Standards"],
  },
];

const recentIngestions = [
  { name: "DEV-2024-0892 Investigation Report", source: "eQMS", time: "2 mins ago" },
  { name: "Batch Record BR-20241215-A", source: "MES", time: "5 mins ago" },
  { name: "FDA 21 CFR Part 211 Update", source: "External", time: "1 hour ago" },
  { name: "SOP-QA-0045 Rev 3", source: "Documents", time: "2 hours ago" },
];

export default function DataManagement() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Data Management System</h1>
                  <p className="text-muted-foreground">The AI Knowledge Brain for CAPA AI Quality Management</p>
                </div>
              </div>
              <Button className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync All Sources
              </Button>
            </div>

            {/* AI Status Card */}
            <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">AI Knowledge Base Active</h3>
                      <p className="text-sm text-muted-foreground">Processing and indexing data from all sources</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">23,883</p>
                    <p className="text-sm text-muted-foreground">Total Records Indexed</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vector embeddings generated</span>
                    <span className="text-foreground font-medium">98.5%</span>
                  </div>
                  <Progress value={98.5} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Data Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataSources.map((source) => (
                <Card key={source.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${source.color} flex items-center justify-center`}>
                          <source.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{source.title}</CardTitle>
                          <CardDescription>{source.description}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={source.status === "synced" ? "default" : "secondary"}
                        className={source.status === "synced" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                      >
                        {source.status === "synced" ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Synced</>
                        ) : (
                          <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Syncing</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Records indexed</span>
                      <span className="font-semibold text-foreground">{source.records.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last sync</span>
                      <span className="flex items-center gap-1 text-foreground">
                        <Clock className="h-3 w-3" />
                        {source.lastSync}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {source.types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Data
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Ingestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Data Ingestions</CardTitle>
                <CardDescription>Latest records added to the AI knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentIngestions.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">From {item.source}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
