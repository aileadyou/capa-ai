import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCapaStore } from "@/store";
import type { ActionStatus, CAPACase, PreventiveAction } from "@/types";
import { formatDate, formatRelativeTime } from "@/utils/formatters";

const allValue = "all";
const targetDateFilters = ["all", "overdue", "next_30_days", "completed"] as const;

type TargetDateFilter = (typeof targetDateFilters)[number];

interface PreventiveActionRow {
  action: PreventiveAction;
  capa?: CAPACase;
  department: string;
  capaTitle: string;
}

function isOverdue(action: PreventiveAction) {
  if (["completed", "verified"].includes(action.status)) return false;
  return new Date(action.targetDate).getTime() < Date.now();
}

function isWithinNextThirtyDays(date: string) {
  const now = new Date();
  const target = new Date(date);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  return target >= now && target <= thirtyDaysFromNow;
}

function getRecurrenceIndicator(action: PreventiveAction, capa?: CAPACase) {
  if (action.status === "overdue" || isOverdue(action)) {
    return {
      label: "Recurrence Risk",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }

  if (action.status === "verified" || capa?.status === "closed") {
    return {
      label: "No Recurrence",
      className: "border-status-ready/30 bg-status-ready/10 text-status-ready",
    };
  }

  return {
    label: "Monitoring",
    className: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
  };
}

export function PreventiveActionsPage() {
  const preventiveActions = useCapaStore((state) => state.preventiveActions);
  const capas = useCapaStore((state) => state.capas);
  const updatePAStatus = useCapaStore((state) => state.updatePAStatus);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | typeof allValue>(allValue);
  const [picFilter, setPicFilter] = useState(allValue);
  const [departmentFilter, setDepartmentFilter] = useState(allValue);
  const [targetDateFilter, setTargetDateFilter] = useState<TargetDateFilter>(allValue);

  const rows = useMemo<PreventiveActionRow[]>(
    () =>
      preventiveActions.map((action) => {
        const capa = capas.find((record) => record.id === action.capaId);
        return {
          action,
          capa,
          department: capa?.department ?? "Unknown",
          capaTitle: capa?.title ?? action.capaId,
        };
      }),
    [capas, preventiveActions],
  );

  const pics = useMemo(
    () => Array.from(new Set(preventiveActions.map((action) => action.pic))).sort(),
    [preventiveActions],
  );
  const departments = useMemo(
    () => Array.from(new Set(rows.map((row) => row.department))).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter(({ action, department, capaTitle }) => {
      if (statusFilter !== allValue && action.status !== statusFilter) return false;
      if (picFilter !== allValue && action.pic !== picFilter) return false;
      if (departmentFilter !== allValue && department !== departmentFilter) return false;
      if (targetDateFilter === "overdue" && !isOverdue(action)) return false;
      if (targetDateFilter === "next_30_days" && !isWithinNextThirtyDays(action.targetDate)) return false;
      if (targetDateFilter === "completed" && !["completed", "verified"].includes(action.status)) return false;
      if (!normalizedQuery) return true;

      return [action.id, action.capaId, action.description, action.pic, department, capaTitle]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [departmentFilter, picFilter, query, rows, statusFilter, targetDateFilter]);

  function markCompleted(action: PreventiveAction) {
    updatePAStatus(action.id, "completed");
    toast.success("Preventive action completed", {
      description: `${action.id} was marked completed.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preventive Action List</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Global view of preventive actions across CAPA cases with recurrence monitoring, ownership, target dates, and CAPA links.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(150px,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search PA, CAPA, PIC, department, or description"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ActionStatus | typeof allValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={picFilter} onValueChange={setPicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All PICs</SelectItem>
                {pics.map((pic) => (
                  <SelectItem key={pic} value={pic}>
                    {pic}
                  </SelectItem>
                ))}
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
            <Select value={targetDateFilter} onValueChange={(value) => setTargetDateFilter(value as TargetDateFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Target date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Target Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="next_30_days">Due Next 30 Days</SelectItem>
                <SelectItem value="completed">Completed / Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filteredRows.length} Preventive Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">PA ID</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">CAPA</th>
                  <th className="px-3 py-2">PIC</th>
                  <th className="px-3 py-2">Target Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Recurrence</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ action, capa, department, capaTitle }) => {
                  const recurrence = getRecurrenceIndicator(action, capa);
                  return (
                    <tr key={action.id} className="border-t align-top">
                      <td className="px-3 py-3 font-mono text-xs text-primary">{action.id}</td>
                      <td className="max-w-lg px-3 py-3">
                        <div>{action.description}</div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {action.novaGenerated ? "Nova generated" : "User generated"}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Link className="font-mono text-xs text-primary hover:underline" to={`/capa/${action.capaId}`}>
                          {action.capaId}
                        </Link>
                        <div className="mt-1 max-w-[220px] text-xs text-muted-foreground">{capaTitle}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{department}</div>
                      </td>
                      <td className="px-3 py-3">{action.pic}</td>
                      <td className="px-3 py-3">
                        <div>{formatDate(action.targetDate)}</div>
                        <div className="text-xs text-muted-foreground">{formatRelativeTime(action.targetDate)}</div>
                        {isOverdue(action) && (
                          <Badge variant="outline" className="mt-2 border-destructive/30 bg-destructive/10 text-destructive">
                            Overdue
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={action.status} />
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={recurrence.className}>
                          {recurrence.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={["completed", "verified"].includes(action.status)}
                            onClick={() => markCompleted(action)}
                          >
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            Mark Completed
                          </Button>
                          <Button asChild size="sm">
                            <Link to={`/capa/${action.capaId}`}>
                              Open CAPA
                              <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
