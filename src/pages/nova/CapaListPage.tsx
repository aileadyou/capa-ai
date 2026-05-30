import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { ScorePill } from "@/components/shared/ScorePill";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCapaStore } from "@/store";
import type { CAPACase, CAPAStatus, CAPAType, CorrectiveAction, PreventiveAction, Severity } from "@/types";
import { formatCAPAType, formatDate, formatRelativeTime } from "@/utils/formatters";

const allValue = "all";
const dateFilters = ["all", "overdue", "next_7_days", "updated_30_days"] as const;

type DateFilter = (typeof dateFilters)[number];

interface CapaRow {
  capa: CAPACase;
  nextDueDate?: string;
}

function getNextDueDate(
  capaId: string,
  correctiveActions: CorrectiveAction[],
  preventiveActions: PreventiveAction[],
) {
  const dates = [
    ...correctiveActions
      .filter((action) => action.capaId === capaId && !["completed", "verified"].includes(action.status))
      .map((action) => action.dueDate),
    ...preventiveActions
      .filter((action) => action.capaId === capaId && !["completed", "verified"].includes(action.status))
      .map((action) => action.targetDate),
  ].sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

  return dates[0];
}

function isWithinNextSevenDays(date: string) {
  const now = new Date();
  const target = new Date(date);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  return target >= now && target <= sevenDaysFromNow;
}

export function CapaListPage() {
  const capas = useCapaStore((state) => state.capas);
  const correctiveActions = useCapaStore((state) => state.correctiveActions);
  const preventiveActions = useCapaStore((state) => state.preventiveActions);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CAPAType | typeof allValue>(allValue);
  const [statusFilter, setStatusFilter] = useState<CAPAStatus | typeof allValue>(allValue);
  const [departmentFilter, setDepartmentFilter] = useState(allValue);
  const [severityFilter, setSeverityFilter] = useState<Severity | typeof allValue>(allValue);
  const [dateFilter, setDateFilter] = useState<DateFilter>(allValue);

  const departments = useMemo(
    () => Array.from(new Set(capas.map((capa) => capa.department))).sort(),
    [capas],
  );

  const rows = useMemo<CapaRow[]>(
    () =>
      capas.map((capa) => ({
        capa,
        nextDueDate: getNextDueDate(capa.id, correctiveActions, preventiveActions),
      })),
    [capas, correctiveActions, preventiveActions],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = new Date();
    const updatedCutoff = new Date(now);
    updatedCutoff.setDate(now.getDate() - 30);

    return rows.filter(({ capa, nextDueDate }) => {
      if (typeFilter !== allValue && capa.type !== typeFilter) return false;
      if (statusFilter !== allValue && capa.status !== statusFilter) return false;
      if (departmentFilter !== allValue && capa.department !== departmentFilter) return false;
      if (severityFilter !== allValue && capa.impact.severity !== severityFilter) return false;
      if (dateFilter === "overdue" && (!nextDueDate || new Date(nextDueDate) >= now)) return false;
      if (dateFilter === "next_7_days" && (!nextDueDate || !isWithinNextSevenDays(nextDueDate))) return false;
      if (dateFilter === "updated_30_days" && new Date(capa.updatedAt) < updatedCutoff) return false;
      if (!normalizedQuery) return true;

      return [
        capa.id,
        capa.findingId,
        capa.title,
        capa.department,
        capa.status,
        capa.type,
        capa.assignedTo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [dateFilter, departmentFilter, query, rows, severityFilter, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CAPA List</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Track every Deviation, Audit Finding, and Complaint CAPA with quality score, due date, status, and workflow entry points.
          </p>
        </div>
        <Button asChild>
          <Link to="/capa/new">
            <Plus className="mr-2 h-4 w-4" />
            New CAPA
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.5fr)_repeat(5,minmax(150px,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search CAPA, finding, title, or department"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as CAPAType | typeof allValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Types</SelectItem>
                <SelectItem value="deviation">Deviation</SelectItem>
                <SelectItem value="audit">Audit Finding</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CAPAStatus | typeof allValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="disposisi">Disposition</SelectItem>
                <SelectItem value="investigation">Investigation</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as Severity | typeof allValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Severities</SelectItem>
                <SelectItem value="Minor">Minor</SelectItem>
                <SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Dates</SelectItem>
                <SelectItem value="overdue">Overdue Due Date</SelectItem>
                <SelectItem value="next_7_days">Due Next 7 Days</SelectItem>
                <SelectItem value="updated_30_days">Updated Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filteredRows.length} CAPA Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">CAPA</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Quality</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ capa, nextDueDate }) => (
                  <tr key={capa.id} className="border-t align-top">
                    <td className="max-w-sm px-3 py-3">
                      <Link className="font-mono text-xs font-medium text-primary hover:underline" to={`/capa/${capa.id}`}>
                        {capa.id}
                      </Link>
                      <div className="mt-1 font-medium">{capa.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Source: {capa.findingId}</div>
                    </td>
                    <td className="px-3 py-3">{formatCAPAType(capa.type)}</td>
                    <td className="px-3 py-3">
                      <SeverityBadge severity={capa.impact.severity} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={capa.status} />
                    </td>
                    <td className="px-3 py-3">
                      <ScorePill score={capa.score.total} />
                    </td>
                    <td className="px-3 py-3">{capa.department}</td>
                    <td className="px-3 py-3">
                      {nextDueDate ? (
                        <div>
                          <div>{formatDate(nextDueDate)}</div>
                          <div className="text-xs text-muted-foreground">{formatRelativeTime(nextDueDate)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No open action</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Button asChild size="sm">
                        <Link to={`/capa/${capa.id}`}>
                          Open
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
