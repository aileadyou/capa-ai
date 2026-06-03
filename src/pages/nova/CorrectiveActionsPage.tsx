import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterCard, FilterSearchInput, FilterSelect } from "@/components/shared/FilterControls";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCapaStore } from "@/store";
import type { ActionStatus, CorrectiveAction } from "@/types";
import { formatDate, formatRelativeTime } from "@/utils/formatters";

const allValue = "all";
const dueDateFilters = ["all", "overdue", "next_7_days", "completed"] as const;

type DueDateFilter = (typeof dueDateFilters)[number];

interface CorrectiveActionRow {
  action: CorrectiveAction;
  department: string;
  capaTitle: string;
}

function isOverdue(action: CorrectiveAction) {
  if (["completed", "verified"].includes(action.status)) return false;
  return new Date(action.dueDate).getTime() < Date.now();
}

function isWithinNextSevenDays(date: string) {
  const now = new Date();
  const target = new Date(date);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  return target >= now && target <= sevenDaysFromNow;
}

export function CorrectiveActionsPage() {
  const correctiveActions = useCapaStore((state) => state.correctiveActions);
  const capas = useCapaStore((state) => state.capas);
  const updateCAStatus = useCapaStore((state) => state.updateCAStatus);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | typeof allValue>(allValue);
  const [picFilter, setPicFilter] = useState(allValue);
  const [departmentFilter, setDepartmentFilter] = useState(allValue);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>(allValue);

  const rows = useMemo<CorrectiveActionRow[]>(
    () =>
      correctiveActions.map((action) => {
        const capa = capas.find((record) => record.id === action.capaId);
        return {
          action,
          department: capa?.department ?? "Unknown",
          capaTitle: capa?.title ?? action.capaId,
        };
      }),
    [capas, correctiveActions],
  );

  const pics = useMemo(
    () => Array.from(new Set(correctiveActions.map((action) => action.pic))).sort(),
    [correctiveActions],
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
      if (dueDateFilter === "overdue" && !isOverdue(action)) return false;
      if (dueDateFilter === "next_7_days" && !isWithinNextSevenDays(action.dueDate)) return false;
      if (dueDateFilter === "completed" && !["completed", "verified"].includes(action.status)) return false;
      if (!normalizedQuery) return true;

      return [
        action.id,
        action.capaId,
        action.description,
        action.pic,
        action.linkedRootCause,
        action.verificationMethod,
        department,
        capaTitle,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [departmentFilter, dueDateFilter, picFilter, query, rows, statusFilter]);

  function markCompleted(action: CorrectiveAction) {
    updateCAStatus(action.id, "completed");
    toast.success("Corrective action completed", {
      description: `${action.id} was marked completed.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Corrective Action List</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Global view of corrective actions across CAPA cases with ownership, due dates, CAPA links, and status updates.
        </p>
      </div>

      <FilterCard>
        <FilterSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search CA, CAPA, PIC, root cause, or verification"
          ariaLabel="Search corrective actions"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as ActionStatus | typeof allValue)}
          ariaLabel="Filter by status"
          options={[
            { value: allValue, label: "All statuses" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "completed", label: "Completed" },
            { value: "overdue", label: "Overdue" },
            { value: "verified", label: "Verified" },
          ]}
        />
        <FilterSelect
          value={picFilter}
          onChange={setPicFilter}
          ariaLabel="Filter by PIC"
          options={[{ value: allValue, label: "All PICs" }, ...pics.map((pic) => ({ value: pic, label: pic }))]}
        />
        <FilterSelect
          value={departmentFilter}
          onChange={setDepartmentFilter}
          ariaLabel="Filter by department"
          options={[{ value: allValue, label: "All departments" }, ...departments.map((department) => ({ value: department, label: department }))]}
        />
        <FilterSelect
          value={dueDateFilter}
          onChange={(value) => setDueDateFilter(value as DueDateFilter)}
          ariaLabel="Filter by due date"
          options={[
            { value: allValue, label: "All due dates" },
            { value: "overdue", label: "Overdue" },
            { value: "next_7_days", label: "Due Next 7 Days" },
            { value: "completed", label: "Completed / Verified" },
          ]}
        />
      </FilterCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filteredRows.length} Corrective Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--table-head-bg)] text-xs uppercase text-[var(--table-head-fg)]">
                <tr>
                  <th className="px-3 py-2">CA ID</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">CAPA</th>
                  <th className="px-3 py-2">PIC</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Effectiveness</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ action, department, capaTitle }) => (
                  <tr key={action.id} className="border-t align-top">
                    <td className="px-3 py-3 font-sans text-xs text-primary">{action.id}</td>
                    <td className="max-w-lg px-3 py-3">
                      <div>{action.description}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Root cause: {action.linkedRootCause}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Link className="font-sans text-xs text-primary hover:underline" to={`/capa/${action.capaId}`}>
                        {action.capaId}
                      </Link>
                      <div className="mt-1 max-w-[220px] text-xs text-muted-foreground">{capaTitle}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{department}</div>
                    </td>
                    <td className="px-3 py-3">{action.pic}</td>
                    <td className="px-3 py-3">
                      <div>{formatDate(action.dueDate)}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(action.dueDate)}</div>
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
                      <div className="text-sm">{action.verificationMethod}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {action.novaGenerated ? "Nova generated" : "User generated"}
                      </div>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
