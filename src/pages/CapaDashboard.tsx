import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  TrendingDown,
  FileText,
  ClipboardCheck,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const findingsTrendData = [
  { month: "Jul", deviations: 12, audits: 5, complaints: 8 },
  { month: "Aug", deviations: 15, audits: 7, complaints: 6 },
  { month: "Sep", deviations: 11, audits: 4, complaints: 9 },
  { month: "Oct", deviations: 9, audits: 6, complaints: 7 },
  { month: "Nov", deviations: 7, audits: 8, complaints: 5 },
  { month: "Dec", deviations: 5, audits: 5, complaints: 4 },
];

const priorityTasks = [
  {
    id: "DEV-2025-089",
    title: "Temperature Excursion - Warehouse B (Cold Storage)",
    batch: "#BF-VAC-2025-X",
    status: "ai-ready",
    priority: "critical",
    time: "2h ago",
  },
  {
    id: "DEV-2025-088",
    title: "Particulate Matter Detection - Clean Room A",
    batch: "#BF-INJ-2025-Y",
    status: "pending",
    priority: "high",
    time: "5h ago",
  },
  {
    id: "DEV-2025-087",
    title: "Documentation Gap - Batch Record Review",
    batch: "#BF-TAB-2025-Z",
    status: "in-progress",
    priority: "medium",
    time: "1d ago",
  },
];

export default function CapaDashboard() {
  const navigate = useNavigate();

  const handleTaskClick = (taskId: string) => {
    if (taskId === "DEV-2025-089") {
      navigate("/investigation");
    }
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
                <h1 className="text-2xl font-semibold text-foreground">Quality Health Overview</h1>
                <p className="text-muted-foreground mt-1">Real-time quality metrics and AI-powered insights</p>
              </div>
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Open Findings</p>
                      <p className="text-3xl font-semibold text-foreground mt-1">18</p>
                      <p className="text-xs text-destructive mt-1 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        5 Critical
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">AI Resolved</p>
                      <p className="text-3xl font-semibold text-foreground mt-1">47</p>
                      <p className="text-xs text-success mt-1 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        +23% this month
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                      <p className="text-3xl font-semibold text-foreground mt-1">4.2d</p>
                      <p className="text-xs text-primary mt-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        -18% vs last quarter
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Priority Tasks */}
              <Card className="lg:col-span-3 border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                    High Priority Task List
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priorityTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        task.status === "ai-ready" 
                          ? "bg-accent/5 border-accent/30 hover:border-accent" 
                          : "bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                            {task.status === "ai-ready" && (
                              <Badge 
                                className="bg-gradient-to-r from-accent to-purple-500 text-accent-foreground animate-pulse-subtle text-xs"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Analysis Ready
                              </Badge>
                            )}
                            {task.status === "pending" && (
                              <Badge variant="secondary" className="text-xs">Pending Review</Badge>
                            )}
                            {task.status === "in-progress" && (
                              <Badge variant="outline" className="text-xs">In Progress</Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-foreground">{task.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Batch: {task.batch}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2">{task.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Findings Trends Chart */}
              <Card className="lg:col-span-2 border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2 text-success" />
                    Quality Findings Trends
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Last 6 months</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={findingsTrendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px' }}
                          iconType="circle"
                          iconSize={8}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="deviations" 
                          name="Deviations"
                          stroke="#f97316" 
                          strokeWidth={2}
                          dot={{ fill: '#f97316', r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="audits" 
                          name="Audit Findings"
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="complaints" 
                          name="Complaints"
                          stroke="#a855f7" 
                          strokeWidth={2}
                          dot={{ fill: '#a855f7', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}