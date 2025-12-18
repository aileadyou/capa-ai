import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQualityData } from "@/contexts/QualityDataContext";
import { AlertCircle, TrendingUp, FileCheck, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high": return "hsl(var(--destructive))";
    case "medium": return "hsl(var(--warning))";
    case "low": return "hsl(var(--muted))";
    default: return "hsl(var(--muted))";
  }
};

const getQualityScore = (quality: string) => {
  switch (quality) {
    case "good": return 90;
    case "fair": return 60;
    case "poor": return 30;
    default: return 0;
  }
};

export default function QualityDashboard() {
  const { qualityData } = useQualityData();

  // Calculate metrics
  const totalFiles = qualityData.length;
  const avgQualityScore = totalFiles > 0 
    ? qualityData.reduce((sum, data) => sum + getQualityScore(data.analysis.overallQuality), 0) / totalFiles 
    : 0;

  const issuesBySeverity = qualityData.reduce((acc, data) => {
    data.analysis.issues.forEach((issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const issuesByCategory = qualityData.reduce((acc, data) => {
    data.analysis.issues.forEach((issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const severityData = [
    { name: "High", value: issuesBySeverity.high || 0, fill: "hsl(var(--destructive))" },
    { name: "Medium", value: issuesBySeverity.medium || 0, fill: "hsl(var(--warning))" },
    { name: "Low", value: issuesBySeverity.low || 0, fill: "hsl(var(--muted))" },
  ];

  const categoryData = Object.entries(issuesByCategory).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  const allIssues = qualityData.flatMap((data) => 
    data.analysis.issues.map((issue) => ({
      ...issue,
      filename: data.filename,
      timestamp: data.timestamp,
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pb-20 md:pb-0 flex items-start justify-center">
        <main className="w-full max-w-5xl px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Lead Dashboard
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              An electronic research data management system that consolidates and organizes vast datasets, streamlining data handling processes
            </p>
          </div>

          {totalFiles === 0 ? (
            <Card className="p-12 text-center">
              <FileCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Quality Data Available</h3>
              <p className="text-muted-foreground">
                Upload datasets on the Data Collection page to see quality metrics here.
              </p>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Total Datasets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalFiles}</div>
                    <p className="text-xs text-muted-foreground mt-1">Files analyzed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Average Quality Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{avgQualityScore.toFixed(0)}%</div>
                    <Progress value={avgQualityScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Total Issues Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{allIssues.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Across all datasets</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Issues by Severity</CardTitle>
                    <CardDescription>Distribution of issue severity levels</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={severityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {severityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Issues by Category</CardTitle>
                    <CardDescription>Most common issue types</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* All Issues Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Detected Issues</CardTitle>
                  <CardDescription>Complete list of quality issues across all datasets</CardDescription>
                </CardHeader>
                <CardContent>
                  {allIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No issues detected in any dataset
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allIssues.map((issue, index) => (
                        <Card key={index} className="p-4 border-l-4" style={{
                          borderLeftColor: getSeverityColor(issue.severity)
                        }}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {issue.category.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {issue.filename}
                                </span>
                                {issue.column && (
                                  <span className="text-xs text-muted-foreground">
                                    Column: <span className="font-mono font-semibold">{issue.column}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium">{issue.description}</p>
                              <div className="bg-muted/50 rounded-md p-3">
                                <p className="text-xs font-semibold mb-1 text-muted-foreground">💡 Suggested Fix:</p>
                                <p className="text-sm">{issue.suggestion}</p>
                              </div>
                              {issue.affectedRows !== "unknown" && (
                                <p className="text-xs text-muted-foreground">
                                  Affected rows: {issue.affectedRows}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
