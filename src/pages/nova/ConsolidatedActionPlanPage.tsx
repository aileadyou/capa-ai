import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, Download, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AILoadingSpinner } from "@/components/shared/AILoadingSpinner";
import { useCapaStore } from "@/store";
import type { ActionStatus, CorrectiveAction, PreventiveAction } from "@/types";
import { formatDate } from "@/utils/formatters";

type GroupMode = "rootCause" | "department" | "risk";
type UnifiedAction =
  | {
      kind: "CA";
      id: string;
      capaId: string;
      description: string;
      pic: string;
      targetDate: string;
      status: ActionStatus;
      department: string;
      rootCause: string;
      riskPriority: "High" | "Medium" | "Low";
    }
  | {
      kind: "PA";
      id: string;
      capaId: string;
      description: string;
      pic: string;
      targetDate: string;
      status: ActionStatus;
      department: string;
      rootCause: string;
      riskPriority: "High" | "Medium" | "Low";
    };

interface ActionGroup {
  id: string;
  title: string;
  description: string;
  actions: UnifiedAction[];
}

function getRootCauseCluster(rootCause: string, description: string) {
  const text = `${rootCause} ${description}`.toLowerCase();

  if (text.includes("hepa") || text.includes("airflow") || text.includes("environmental")) {
    return "HEPA Filter Maintenance";
  }

  if (text.includes("documentation") || text.includes("verification") || text.includes("record")) {
    return "GMP Documentation Control";
  }

  if (text.includes("visual") || text.includes("particulate") || text.includes("inspection")) {
    return "Visual Inspection Reconciliation";
  }

  if (text.includes("cold") || text.includes("temperature") || text.includes("alarm")) {
    return "Cold Chain Escalation";
  }

  return "General CAPA System";
}

function getRiskPriority(severity: string | undefined, status: ActionStatus, targetDate: string) {
  const isLate = !["completed", "verified"].includes(status) && new Date(targetDate).getTime() < Date.now();

  if (severity === "Critical" || isLate) return "High";
  if (severity === "Major") return "Medium";
  return "Low";
}

function getProgress(actions: UnifiedAction[]) {
  if (actions.length === 0) return 0;
  const completed = actions.filter((action) => ["completed", "verified"].includes(action.status)).length;
  return Math.round((completed / actions.length) * 100);
}

function groupActions(actions: UnifiedAction[], groupMode: GroupMode): ActionGroup[] {
  const groupMap = new Map<string, UnifiedAction[]>();

  actions.forEach((action) => {
    const key =
      groupMode === "rootCause"
        ? getRootCauseCluster(action.rootCause, action.description)
        : groupMode === "department"
          ? action.department
          : action.riskPriority;
    groupMap.set(key, [...(groupMap.get(key) ?? []), action]);
  });

  return Array.from(groupMap.entries())
    .map(([title, groupActionsValue]) => ({
      id: title,
      title,
      description:
        groupMode === "rootCause"
          ? "Grouped by recurring RCA signal and action theme."
          : groupMode === "department"
            ? "Grouped by accountable operating area."
            : "Grouped by severity, overdue risk, and closure urgency.",
      actions: groupActionsValue,
    }))
    .sort((left, right) => right.actions.length - left.actions.length);
}

export function ConsolidatedActionPlanPage() {
  const capas = useCapaStore((state) => state.capas);
  const correctiveActions = useCapaStore((state) => state.correctiveActions);
  const preventiveActions = useCapaStore((state) => state.preventiveActions);
  const [groupMode, setGroupMode] = useState<GroupMode>("rootCause");
  const [hasClustered, setHasClustered] = useState(false);
  const [isClustering, setIsClustering] = useState(false);

  const unifiedActions = useMemo<UnifiedAction[]>(() => {
    const capaById = new Map(capas.map((capa) => [capa.id, capa]));

    const corrective = correctiveActions.map((action: CorrectiveAction): UnifiedAction => {
      const capa = capaById.get(action.capaId);
      return {
        kind: "CA",
        id: action.id,
        capaId: action.capaId,
        description: action.description,
        pic: action.pic,
        targetDate: action.dueDate,
        status: action.status,
        department: capa?.department ?? "Unknown",
        rootCause: action.linkedRootCause || capa?.rca.confirmedRootCauses[0] || "Unclassified root cause",
        riskPriority: getRiskPriority(capa?.impact.severity, action.status, action.dueDate),
      };
    });

    const preventive = preventiveActions.map((action: PreventiveAction): UnifiedAction => {
      const capa = capaById.get(action.capaId);
      const rootCause = capa?.rca.confirmedRootCauses[0] ?? "Preventive control";
      return {
        kind: "PA",
        id: action.id,
        capaId: action.capaId,
        description: action.description,
        pic: action.pic,
        targetDate: action.targetDate,
        status: action.status,
        department: capa?.department ?? "Unknown",
        rootCause,
        riskPriority: getRiskPriority(capa?.impact.severity, action.status, action.targetDate),
      };
    });

    return [...corrective, ...preventive];
  }, [capas, correctiveActions, preventiveActions]);

  const groups = useMemo(
    () => groupActions(unifiedActions, hasClustered ? groupMode : "department"),
    [groupMode, hasClustered, unifiedActions],
  );
  const totalProgress = getProgress(unifiedActions);

  async function runAIClustering() {
    setIsClustering(true);
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
    setHasClustered(true);
    setIsClustering(false);
    toast.success("Nova clustering complete", {
      description: "Actions were grouped by root cause, department, and risk priority signals.",
    });
  }

  function exportToExcel() {
    toast.success("Export prepared", {
      description: "Consolidated action plan Excel export is mocked in this demo.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consolidated Action Plan</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Management overview that consolidates corrective and preventive actions by recurring root cause, department, or risk priority.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={runAIClustering} disabled={isClustering}>
            {isClustering ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            AI Clustering
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Total Actions</div>
            <div className="mt-2 text-2xl font-semibold">{unifiedActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Corrective</div>
            <div className="mt-2 text-2xl font-semibold">{correctiveActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Preventive</div>
            <div className="mt-2 text-2xl font-semibold">{preventiveActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Overall Progress</div>
            <div className="mt-2 text-2xl font-semibold">{totalProgress}%</div>
            <Progress className="mt-3 h-2" value={totalProgress} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grouping</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
          <Select value={groupMode} onValueChange={(value) => setGroupMode(value as GroupMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rootCause">Root Cause Cluster</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="risk">Risk Priority</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded border bg-muted/30 p-3 text-sm text-muted-foreground">
            {hasClustered
              ? "Nova clustering is active. Switch grouping modes to inspect management views."
              : "Default view is grouped by department. Run AI Clustering to activate root cause and risk-priority grouping suggestions."}
          </div>
        </CardContent>
      </Card>

      {isClustering && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <AILoadingSpinner label="Nova is clustering CA and PA records by recurring quality signals..." />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {groups.map((group) => {
          const progress = getProgress(group.actions);
          const owners = Array.from(new Set(group.actions.map((action) => action.pic))).slice(0, 4);

          return (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-base">{group.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  <Badge variant="outline">{group.actions.length} actions</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Group progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PIC: <span className="text-foreground">{owners.join(", ") || "Unassigned"}</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2">CAPA</th>
                        <th className="px-3 py-2">PIC</th>
                        <th className="px-3 py-2">Due / Target</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.actions.map((action) => (
                        <tr key={`${action.kind}-${action.id}`} className="border-t align-top">
                          <td className="px-3 py-3">
                            <Badge variant="outline">{action.kind}</Badge>
                          </td>
                          <td className="max-w-xl px-3 py-3">
                            <div className="font-mono text-xs text-primary">{action.id}</div>
                            <div className="mt-1">{action.description}</div>
                            <div className="mt-2 text-xs text-muted-foreground">Root cause: {action.rootCause}</div>
                          </td>
                          <td className="px-3 py-3">
                            <Link className="font-mono text-xs text-primary hover:underline" to={`/capa/${action.capaId}`}>
                              {action.capaId}
                            </Link>
                          </td>
                          <td className="px-3 py-3">{action.pic}</td>
                          <td className="px-3 py-3">{formatDate(action.targetDate)}</td>
                          <td className="px-3 py-3">
                            <StatusBadge status={action.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link to="/actions/corrective">
            Review Corrective Actions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
