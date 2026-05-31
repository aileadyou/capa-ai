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
  Activity,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Building2, Target } from "lucide-react";

const findingsTrendData = [
  { month: "Jul", deviations: 12, audits: 5, complaints: 8 },
  { month: "Aug", deviations: 15, audits: 7, complaints: 6 },
  { month: "Sep", deviations: 11, audits: 4, complaints: 9 },
  { month: "Oct", deviations: 9, audits: 6, complaints: 7 },
  { month: "Nov", deviations: 7, audits: 8, complaints: 5 },
  { month: "Dec", deviations: 5, audits: 5, complaints: 4 },
];

const departmentBreakdownData = [
  { department: "QA", deviations: 8, audits: 12, complaints: 5 },
  { department: "Manufacturing", deviations: 15, audits: 6, complaints: 3 },
  { department: "QC", deviations: 6, audits: 8, complaints: 7 },
  { department: "Packaging", deviations: 4, audits: 3, complaints: 9 },
  { department: "Utilities", deviations: 5, audits: 2, complaints: 2 },
  { department: "Supply Chain", deviations: 2, audits: 4, complaints: 6 },
];

const priorityDistributionData = [
  { name: "Critical", value: 8, color: "var(--danger)" },
  { name: "High", value: 15, color: "var(--warning)" },
  { name: "Medium", value: 22, color: "var(--fg-3)" },
  { name: "Low", value: 12, color: "var(--fg-2)" },
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
    <EnterpriseLayout
      breadcrumbs={[{ label: "Quality" }, { label: "Dashboard" }]}
      title="Quality Health Overview"
      subtitle="Real-time quality metrics and AI-powered insights"
      actions={
        <Badge variant="outline" className="text-xs">
          <Activity className="w-3 h-3 mr-1" />
          Live
        </Badge>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tutorial="dashboard-cards">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Open Findings</p>
                <p className="text-2xl font-semibold text-foreground mt-0.5">18</p>
                <p className="text-[10px] text-destructive mt-0.5 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  5 Critical
                </p>
              </div>
              <div className="h-10 w-10 rounded bg-destructive/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">AI Resolved</p>
                <p className="text-2xl font-semibold text-foreground mt-0.5">47</p>
                <p className="text-[10px] text-success mt-0.5 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  +23% this month
                </p>
              </div>
              <div className="h-10 w-10 rounded bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-semibold text-foreground mt-0.5">4.2d</p>
                <p className="text-[10px] text-primary mt-0.5 flex items-center">
                  <Clock className="w-3 h-3 mr-0.5" />
                  -18% vs Q3
                </p>
              </div>
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Monthly Comparison</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-semibold">14</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Month</span>
                <span className="font-semibold">21</span>
              </div>
              <div className="pt-1.5 border-t flex items-center gap-1.5">
                <div className="flex items-center text-success text-xs">
                  <ArrowDownRight className="w-3 h-3" />
                  <span className="font-medium">33%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">fewer findings</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Priority Tasks */}
        <Card className="xl:col-span-3 border shadow-sm" data-tutorial="priority-tasks">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center">
              <ClipboardCheck className="w-4 h-4 mr-2 text-primary" />
              High Priority Task List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {priorityTasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                data-tutorial={task.status === "ai-ready" && index === 0 ? "ai-ready-item" : undefined}
                className={`p-3 rounded border cursor-pointer transition-all hover:shadow-sm ${
                  task.status === "ai-ready" 
                    ? "bg-accent/5 border-accent/30 hover:border-accent" 
                    : "bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{task.id}</span>
                      {task.status === "ai-ready" && (
                        <Badge className="bg-gradient-to-r from-accent to-purple-500 text-accent-foreground animate-pulse-subtle text-[10px] px-1.5 py-0">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          AI Ready
                        </Badge>
                      )}
                      {task.status === "pending" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pending</Badge>
                      )}
                      {task.status === "in-progress" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">In Progress</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground truncate">{task.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Batch: {task.batch}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge 
                      variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {task.priority}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{task.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Findings Trends Chart */}
        <Card className="xl:col-span-2 border shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center">
              <TrendingDown className="w-4 h-4 mr-2 text-success" />
              Quality Findings Trends
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={findingsTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickMargin={6} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} iconType="circle" iconSize={6} />
                  <Line type="monotone" dataKey="deviations" name="Deviations" stroke="var(--warning)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="audits" name="Audits" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="complaints" name="Complaints" stroke="var(--success)" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3" data-tutorial="charts-section">
        {/* Department Breakdown Chart */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-primary" />
              Findings by Department
            </CardTitle>
            <p className="text-xs text-muted-foreground">Breakdown across all finding types</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentBreakdownData} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} iconType="rect" iconSize={8} />
                  <Bar dataKey="deviations" name="Deviations" stackId="a" fill="var(--warning)" />
                  <Bar dataKey="audits" name="Audits" stackId="a" fill="var(--accent)" />
                  <Bar dataKey="complaints" name="Complaints" stackId="a" fill="var(--success)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution Pie Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center">
              <Target className="w-4 h-4 mr-2 text-destructive" />
              Priority Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">Findings by severity</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityDistributionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                    iconType="circle"
                    iconSize={6}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnterpriseLayout>
  );
}
