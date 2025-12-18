import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CapaSidebar } from "@/components/capa/CapaSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileText,
  Target,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PieChartIcon,
  Activity,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Mock data for charts
const monthlyTrendData = [
  { month: "Jul", opened: 12, closed: 8, overdue: 2 },
  { month: "Aug", opened: 15, closed: 12, overdue: 3 },
  { month: "Sep", opened: 10, closed: 14, overdue: 2 },
  { month: "Oct", opened: 18, closed: 11, overdue: 4 },
  { month: "Nov", opened: 14, closed: 16, overdue: 3 },
  { month: "Dec", opened: 11, closed: 13, overdue: 2 },
  { month: "Jan", opened: 9, closed: 10, overdue: 1 },
];

const statusDistribution = [
  { name: "Completed", value: 45, color: "hsl(142, 76%, 36%)" },
  { name: "In Progress", value: 28, color: "hsl(217, 91%, 60%)" },
  { name: "Pending Approval", value: 15, color: "hsl(45, 93%, 47%)" },
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

const priorityData = [
  { name: "Critical", value: 8, color: "hsl(0, 84%, 60%)" },
  { name: "High", value: 22, color: "hsl(25, 95%, 53%)" },
  { name: "Medium", value: 45, color: "hsl(45, 93%, 47%)" },
  { name: "Low", value: 25, color: "hsl(215, 20%, 65%)" },
];

const completionTimeData = [
  { range: "< 7 days", count: 15 },
  { range: "7-14 days", count: 28 },
  { range: "15-30 days", count: 32 },
  { range: "31-60 days", count: 18 },
  { range: "> 60 days", count: 7 },
];

const effectivenessData = [
  { month: "Jul", rate: 85 },
  { month: "Aug", rate: 88 },
  { month: "Sep", rate: 82 },
  { month: "Oct", rate: 91 },
  { month: "Nov", rate: 89 },
  { month: "Dec", rate: 94 },
  { month: "Jan", rate: 92 },
];

const rootCauseData = [
  { cause: "Equipment", count: 24 },
  { cause: "Process", count: 32 },
  { cause: "Training", count: 18 },
  { cause: "Material", count: 12 },
  { cause: "Environment", count: 8 },
  { cause: "Documentation", count: 6 },
];

export default function Reports() {
  const [timeRange, setTimeRange] = useState("6months");
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const kpiData = {
    totalCapas: 100,
    completionRate: 92,
    avgClosureTime: 18,
    overdueCount: 4,
    aiGenerated: 38,
    effectivenessRate: 94,
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(31, 41, 55);
      pdf.text("CAPA Reports & Analytics", 14, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${timeRange}`, 14, 22);
      
      // Add image below header
      const contentHeight = imgHeight * ratio;
      const availableHeight = pdfHeight - 30;
      
      if (contentHeight <= availableHeight) {
        pdf.addImage(imgData, "PNG", imgX, 28, imgWidth * ratio, imgHeight * ratio);
      } else {
        // Multi-page support
        let remainingHeight = imgHeight;
        let position = 0;
        let page = 0;
        
        while (remainingHeight > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          const sliceHeight = Math.min(remainingHeight, (availableHeight / ratio));
          pdf.addImage(
            imgData,
            "PNG",
            imgX,
            page === 0 ? 28 : 10,
            imgWidth * ratio,
            imgHeight * ratio,
            undefined,
            "FAST",
            0
          );
          
          remainingHeight -= sliceHeight;
          position += sliceHeight;
          page++;
        }
      }
      
      pdf.save(`CAPA_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CapaSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
                <p className="text-muted-foreground mt-1">
                  Track CAPA performance metrics and trends
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[160px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
              </div>
            </div>

            <div ref={reportRef}>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Total CAPAs</span>
                  </div>
                  <p className="text-2xl font-bold">{kpiData.totalCapas}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% vs last period
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-bold">{kpiData.completionRate}%</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +3% vs last period
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Avg Closure Time</span>
                  </div>
                  <p className="text-2xl font-bold">{kpiData.avgClosureTime}d</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                    <TrendingDown className="w-3 h-3" />
                    -2d vs last period
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Overdue</span>
                  </div>
                  <p className="text-2xl font-bold text-destructive">{kpiData.overdueCount}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                    <TrendingDown className="w-3 h-3" />
                    -2 vs last period
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-accent/10 to-purple-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs">AI Generated</span>
                  </div>
                  <p className="text-2xl font-bold">{kpiData.aiGenerated}%</p>
                  <Badge className="text-xs mt-1 bg-accent/20 text-accent border-accent/30">
                    38 CAPAs
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Effectiveness</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-500">{kpiData.effectivenessRate}%</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% vs last period
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 mb-4">
                <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-background">
                  <Activity className="w-4 h-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="distribution" className="data-[state=active]:bg-background">
                  <PieChartIcon className="w-4 h-4 mr-2" />
                  Distribution
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Trend */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">CAPA Monthly Trend</CardTitle>
                      <CardDescription>Opened vs Closed CAPAs over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="opened"
                            stackId="1"
                            stroke="hsl(217, 91%, 60%)"
                            fill="hsl(217, 91%, 60%)"
                            fillOpacity={0.3}
                            name="Opened"
                          />
                          <Area
                            type="monotone"
                            dataKey="closed"
                            stackId="2"
                            stroke="hsl(142, 76%, 36%)"
                            fill="hsl(142, 76%, 36%)"
                            fillOpacity={0.3}
                            name="Closed"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Status Distribution Pie */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Status Distribution</CardTitle>
                      <CardDescription>Current CAPA status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Department Breakdown */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Department Breakdown</CardTitle>
                      <CardDescription>CAPAs by department and type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis dataKey="department" type="category" className="text-xs" width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="corrective" fill="hsl(25, 95%, 53%)" name="Corrective" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="preventive" fill="hsl(217, 91%, 60%)" name="Preventive" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Root Cause Analysis */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Root Cause Analysis</CardTitle>
                      <CardDescription>Top root cause categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={rootCauseData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="cause" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Effectiveness Trend */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Effectiveness Rate Trend</CardTitle>
                      <CardDescription>CAPA effectiveness verification over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={effectivenessData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis domain={[70, 100]} className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="hsl(142, 76%, 36%)"
                            strokeWidth={3}
                            dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
                            name="Effectiveness %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Completion Time Distribution */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Completion Time Distribution</CardTitle>
                      <CardDescription>Days to complete CAPAs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={completionTimeData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="range" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="CAPAs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Overdue Trend */}
                  <Card className="border shadow-sm lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Overdue CAPAs Trend</CardTitle>
                      <CardDescription>Monthly overdue CAPA count</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="overdue"
                            stroke="hsl(0, 84%, 60%)"
                            fill="hsl(0, 84%, 60%)"
                            fillOpacity={0.3}
                            name="Overdue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Priority Distribution */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Priority Distribution</CardTitle>
                      <CardDescription>CAPAs by priority level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {priorityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Type Split */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">CAPA Type Split</CardTitle>
                      <CardDescription>Corrective vs Preventive actions</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <div className="grid grid-cols-2 gap-8 text-center py-8">
                        <div className="space-y-2">
                          <div className="h-24 w-24 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Target className="h-10 w-10 text-orange-500" />
                          </div>
                          <p className="text-3xl font-bold">42</p>
                          <p className="text-sm text-muted-foreground">Corrective</p>
                          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">42%</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="h-24 w-24 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Shield className="h-10 w-10 text-blue-500" />
                          </div>
                          <p className="text-3xl font-bold">58</p>
                          <p className="text-sm text-muted-foreground">Preventive</p>
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">58%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Table */}
                  <Card className="border shadow-sm lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Department Performance Summary</CardTitle>
                      <CardDescription>Key metrics by department</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">Department</th>
                              <th className="text-center py-3 px-4 font-medium">Total CAPAs</th>
                              <th className="text-center py-3 px-4 font-medium">Completion Rate</th>
                              <th className="text-center py-3 px-4 font-medium">Avg Days</th>
                              <th className="text-center py-3 px-4 font-medium">Overdue</th>
                              <th className="text-center py-3 px-4 font-medium">Effectiveness</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { dept: "Quality Assurance", total: 20, rate: 95, days: 14, overdue: 0, eff: 96 },
                              { dept: "Manufacturing", total: 32, rate: 88, days: 21, overdue: 2, eff: 91 },
                              { dept: "R&D", total: 16, rate: 94, days: 18, overdue: 0, eff: 94 },
                              { dept: "Packaging", total: 13, rate: 85, days: 16, overdue: 1, eff: 88 },
                              { dept: "Utilities", total: 11, rate: 82, days: 24, overdue: 1, eff: 85 },
                            ].map((row, i) => (
                              <tr key={i} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4 font-medium">{row.dept}</td>
                                <td className="text-center py-3 px-4">{row.total}</td>
                                <td className="text-center py-3 px-4">
                                  <Badge variant={row.rate >= 90 ? "default" : "secondary"} className={row.rate >= 90 ? "bg-emerald-500/10 text-emerald-500" : ""}>
                                    {row.rate}%
                                  </Badge>
                                </td>
                                <td className="text-center py-3 px-4">{row.days}d</td>
                                <td className="text-center py-3 px-4">
                                  <span className={row.overdue > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                                    {row.overdue}
                                  </span>
                                </td>
                                <td className="text-center py-3 px-4">
                                  <Badge className={row.eff >= 90 ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-600"}>
                                    {row.eff}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
