import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  FileText,
  ClipboardCheck,
  Activity,
  ArrowDownRight,
  Building2,
  Target,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnterpriseSidebar } from "@/components/EnterpriseSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

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
  { name: "Critical", value: 8, color: "hsl(var(--destructive))" },
  { name: "High", value: 15, color: "hsl(var(--warning))" },
  { name: "Medium", value: 22, color: "hsl(var(--primary))" },
  { name: "Low", value: 12, color: "hsl(var(--muted-foreground))" },
];

const priorityTasks = [
  {
    id: "DEV-2025-089",
    title: "Temperature Excursion - Warehouse B (Cold Storage)",
    batch: "#BF-VAC-2025-X",
    status: "ai-ready",
    priority: "critical",
    time: "2h ago",
    department: "Utilities",
  },
  {
    id: "DEV-2025-088",
    title: "Particulate Matter Detection - Clean Room A",
    batch: "#BF-INJ-2025-Y",
    status: "pending",
    priority: "high",
    time: "5h ago",
    department: "Manufacturing",
  },
  {
    id: "DEV-2025-087",
    title: "Documentation Gap - Batch Record Review",
    batch: "#BF-TAB-2025-Z",
    status: "in-progress",
    priority: "medium",
    time: "1d ago",
    department: "QA",
  },
];

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextType?: "success" | "warning" | "destructive" | "default";
  icon: React.ReactNode;
}

const MetricCard = ({ label, value, subtext, subtextType = "default", icon }: MetricCardProps) => (
  <div className="data-card flex items-start justify-between">
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {subtext && (
        <p className={cn(
          "text-xs flex items-center gap-1",
          subtextType === "success" && "text-success",
          subtextType === "warning" && "text-warning",
          subtextType === "destructive" && "text-destructive",
          subtextType === "default" && "text-muted-foreground"
        )}>
          {subtext}
        </p>
      )}
    </div>
    <div className="h-8 w-8 rounded flex items-center justify-center bg-muted">
      {icon}
    </div>
  </div>
);

export default function CapaDashboard() {
  const navigate = useNavigate();

  const handleTaskClick = (taskId: string) => {
    if (taskId === "DEV-2025-089") {
      navigate("/investigation");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <EnterpriseSidebar />

      {/* Main content */}
      <div className="flex-1 ml-52">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-2">
          <div className="flex items-center justify-between">
            <Breadcrumbs
              items={[
                { label: "Quality", href: "/quality" },
                { label: "Dashboard" },
              ]}
            />
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live
              </span>
              <span className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
            <MetricCard
              label="Open Findings"
              value={18}
              subtext="5 Critical"
              subtextType="destructive"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              label="AI Resolved (MTD)"
              value={47}
              subtext="+23% vs last month"
              subtextType="success"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              label="Avg Resolution"
              value="4.2d"
              subtext="-18% vs Q3"
              subtextType="success"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              label="This Month"
              value={14}
              subtext="vs 21 last month"
              icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
            />
            <div className="data-card col-span-2 md:col-span-4 xl:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Monthly Trend</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-semibold text-success">-33%</span>
                    <ArrowDownRight className="h-4 w-4 text-success" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">fewer findings</p>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Priority Task List */}
            <Card className="xl:col-span-7 border">
              <CardHeader className="py-2.5 px-4 border-b flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Priority Task Queue
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {priorityTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className={cn(
                        "px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
                        task.status === "ai-ready" && "bg-accent/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                            <Badge
                              variant={
                                task.priority === "critical"
                                  ? "destructive"
                                  : task.priority === "high"
                                  ? "outline"
                                  : "secondary"
                              }
                              className="text-xs h-5"
                            >
                              {task.priority}
                            </Badge>
                            {task.status === "ai-ready" && (
                              <Badge className="bg-accent text-accent-foreground text-xs h-5">
                                AI Ready
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{task.batch}</span>
                            <span>•</span>
                            <span>{task.department}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">{task.time}</p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Findings Trend Chart */}
            <Card className="xl:col-span-5 border">
              <CardHeader className="py-2.5 px-4 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Findings Trend (6M)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={findingsTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                        iconType="line"
                        iconSize={12}
                      />
                      <Line
                        type="monotone"
                        dataKey="deviations"
                        name="Deviations"
                        stroke="hsl(var(--warning))"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="audits"
                        name="Audits"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="complaints"
                        name="Complaints"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Department Breakdown */}
            <Card className="lg:col-span-8 border">
              <CardHeader className="py-2.5 px-4 border-b flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Findings by Department
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentBreakdownData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="department"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                        iconType="rect"
                        iconSize={8}
                      />
                      <Bar dataKey="deviations" name="Deviations" stackId="a" fill="hsl(var(--warning))" />
                      <Bar dataKey="audits" name="Audits" stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="complaints" name="Complaints" stackId="a" fill="hsl(var(--accent))" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="lg:col-span-4 border">
              <CardHeader className="py-2.5 px-4 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityDistributionData}
                        cx="50%"
                        cy="45%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {priorityDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => [`${value}`, name]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "10px" }}
                        iconType="circle"
                        iconSize={8}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value, entry) => {
                          const item = priorityDistributionData.find((d) => d.name === value);
                          return `${value} (${item?.value || 0})`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
