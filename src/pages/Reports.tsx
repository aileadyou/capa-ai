import { useState } from "react";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Download, FileText, Target, Clock, CheckCircle2, AlertTriangle, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";
import { toast } from "sonner";

const monthlyTrendData = [
  { month: "Jul", opened: 12, closed: 8 },
  { month: "Aug", opened: 15, closed: 12 },
  { month: "Sep", opened: 10, closed: 14 },
  { month: "Oct", opened: 18, closed: 11 },
  { month: "Nov", opened: 14, closed: 16 },
  { month: "Dec", opened: 11, closed: 13 },
  { month: "Jan", opened: 9, closed: 10 },
];

const statusDistribution = [
  { name: "Completed", value: 45, color: "hsl(142, 76%, 36%)" },
  { name: "In Progress", value: 28, color: "hsl(217, 91%, 60%)" },
  { name: "Pending", value: 15, color: "hsl(45, 93%, 47%)" },
  { name: "Draft", value: 8, color: "hsl(215, 20%, 65%)" },
  { name: "Overdue", value: 4, color: "hsl(0, 84%, 60%)" },
];

const departmentData = [
  { department: "QA", corrective: 12, preventive: 8 },
  { department: "Manufacturing", corrective: 18, preventive: 14 },
  { department: "R&D", corrective: 6, preventive: 10 },
  { department: "Packaging", corrective: 8, preventive: 5 },
  { department: "Utilities", corrective: 4, preventive: 7 },
];

const rootCauseData = [
  { cause: "Equipment", count: 24 },
  { cause: "Process", count: 32 },
  { cause: "Training", count: 18 },
  { cause: "Material", count: 12 },
  { cause: "Environment", count: 8 },
];

export default function Reports() {
  const [timeRange, setTimeRange] = useState("6months");
  const [activeTab, setActiveTab] = useState("overview");

  const kpiData = { totalCapas: 100, completionRate: 92, avgClosureTime: 18, overdueCount: 4, aiGenerated: 38, effectivenessRate: 94 };

  return (
    <EnterpriseLayout
      breadcrumbs={[{ label: "Quality" }, { label: "Reports" }]}
      title="Reports & Analytics"
      subtitle="Track CAPA performance metrics and trends"
      actions={
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" onClick={() => toast.info("PDF export coming soon")}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5"><FileText className="w-3 h-3" /><span className="text-[10px]">Total CAPAs</span></div>
            <p className="text-xl font-bold">{kpiData.totalCapas}</p>
            <div className="flex items-center gap-0.5 text-[10px] text-success mt-0.5"><TrendingUp className="w-2.5 h-2.5" />+12%</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5"><CheckCircle2 className="w-3 h-3" /><span className="text-[10px]">Completion</span></div>
            <p className="text-xl font-bold">{kpiData.completionRate}%</p>
            <div className="flex items-center gap-0.5 text-[10px] text-success mt-0.5"><TrendingUp className="w-2.5 h-2.5" />+3%</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5"><Clock className="w-3 h-3" /><span className="text-[10px]">Avg Closure</span></div>
            <p className="text-xl font-bold">{kpiData.avgClosureTime}d</p>
            <div className="flex items-center gap-0.5 text-[10px] text-success mt-0.5"><TrendingDown className="w-2.5 h-2.5" />-2d</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5"><AlertTriangle className="w-3 h-3" /><span className="text-[10px]">Overdue</span></div>
            <p className="text-xl font-bold text-destructive">{kpiData.overdueCount}</p>
            <div className="flex items-center gap-0.5 text-[10px] text-success mt-0.5"><TrendingDown className="w-2.5 h-2.5" />-2</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-gradient-to-br from-accent/10 to-purple-500/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5"><Activity className="w-3 h-3" /><span className="text-[10px]">AI Generated</span></div>
            <p className="text-xl font-bold">{kpiData.aiGenerated}%</p>
            <Badge className="text-[10px] mt-0.5 bg-accent/20 text-accent px-1.5 py-0">38 CAPAs</Badge>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5"><Target className="w-3 h-3" /><span className="text-[10px]">Effectiveness</span></div>
            <p className="text-xl font-bold text-success">{kpiData.effectivenessRate}%</p>
            <div className="flex items-center gap-0.5 text-[10px] text-success mt-0.5"><TrendingUp className="w-2.5 h-2.5" />+5%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 h-8 mb-3">
          <TabsTrigger value="overview" className="text-xs h-7 px-2.5"><BarChart3 className="w-3 h-3 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs h-7 px-2.5"><Activity className="w-3 h-3 mr-1.5" />Trends</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs h-7 px-2.5"><PieChartIcon className="w-3 h-3 mr-1.5" />Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm">CAPA Monthly Trend</CardTitle>
                <CardDescription className="text-xs">Opened vs Closed CAPAs</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Area type="monotone" dataKey="opened" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.3} name="Opened" />
                    <Area type="monotone" dataKey="closed" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.3} name="Closed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm">Status Distribution</CardTitle>
                <CardDescription className="text-xs">Current CAPA status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                      {statusDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm">Department Breakdown</CardTitle>
                <CardDescription className="text-xs">CAPAs by department and type</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="corrective" fill="hsl(25, 95%, 53%)" name="Corrective" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="preventive" fill="hsl(217, 91%, 60%)" name="Preventive" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm">Root Cause Analysis</CardTitle>
                <CardDescription className="text-xs">Top root cause categories</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rootCauseData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="cause" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px", fontSize: "11px" }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-0">
          <Card className="border shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Trends analysis charts will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-0">
          <Card className="border shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Distribution analysis charts will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </EnterpriseLayout>
  );
}
