import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, FileSearch, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { TypeDonutChart } from "@/components/charts/TypeDonutChart";
import { RootCauseBarChart } from "@/components/charts/RootCauseBarChart";
import { DeptHeatmap } from "@/components/charts/DeptHeatmap";
import { RecurrenceTrendChart } from "@/components/charts/RecurrenceTrendChart";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ScorePill } from "@/components/shared/ScorePill";
import {
  getDashboardAlerts,
  getDashboardStats,
  getDepartmentHeatmap,
  getFindingTrend,
  getLatestFindings,
  getRecurrenceTrend,
  getRootCauseTrends,
  getTypeBreakdown,
} from "@/services/dashboardService";
import { formatDate, formatPercent } from "@/utils/formatters";

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: typeof FileSearch;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const stats = getDashboardStats();
  const latestFindings = getLatestFindings(5);
  const alerts = getDashboardAlerts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Nova helps QA teams turn quality findings into structured, audit-ready CAPA workflows.
          </p>
        </div>
        <Button asChild>
          <Link to="/findings">
            Open Findings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Findings" value={stats.totalFindingsMTD} helper="Month to date" icon={FileSearch} />
        <StatCard title="Open CAPAs" value={stats.openCapas} helper="Across all statuses" icon={ClipboardCheck} />
        <StatCard title="Overdue CAPAs" value={stats.overdueCapas} helper="Needs management attention" icon={Timer} />
        <StatCard title="Effectiveness Rate" value={formatPercent(stats.effectivenessRate)} helper="Verified CAPA effectiveness" icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Finding Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={getFindingTrend()} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <TypeDonutChart data={getTypeBreakdown()} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Root Cause Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <RootCauseBarChart data={getRootCauseTrends()} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Completion Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <DeptHeatmap data={getDepartmentHeatmap()} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Finding Recurrence Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Comparison of new findings vs. recurring findings (same root cause pattern reappearing) over the past 12 months.
          </p>
          <RecurrenceTrendChart data={getRecurrenceTrend()} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {latestFindings.map((finding) => (
                    <tr key={finding.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link className="text-primary hover:underline" to={`/findings/${finding.id}`}>
                          {finding.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{finding.shortDescription}</td>
                      <td className="px-3 py-2">
                        <SourceBadge source={finding.source} />
                      </td>
                      <td className="px-3 py-2">
                        <SeverityBadge severity={finding.severity} />
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={finding.status} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(finding.reportedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-severity-major" />
              CAPA Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                to={`/capa/${alert.id}`}
                className="block rounded border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{alert.id}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{alert.title}</p>
                  </div>
                  <ScorePill score={alert.score} />
                </div>
                <div className="mt-2">
                  <StatusBadge status={alert.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

