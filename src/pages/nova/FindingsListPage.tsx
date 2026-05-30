import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ScorePill } from "@/components/shared/ScorePill";
import { useCapaStore } from "@/store";
import type { CAPACase, CAPAType, Severity } from "@/types";
import type { Finding, FindingStatus } from "@/types/finding";
import { formatCAPAType, formatDate } from "@/utils/formatters";

const allValue = "all";
const dateRanges = ["all", "last_7_days", "last_30_days", "last_90_days", "last_12_months"] as const;
type DateRange = (typeof dateRanges)[number];

function dateRangeLabel(range: DateRange): string {
  const labels: Record<DateRange, string> = {
    all: "All Dates",
    last_7_days: "Last 7 days",
    last_30_days: "Last 30 days",
    last_90_days: "Last 90 days",
    last_12_months: "Last 12 months",
  };
  return labels[range];
}

function isWithinRange(dateStr: string, range: DateRange): boolean {
  if (range === "all") return true;
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  const days = range === "last_7_days" ? 7 : range === "last_30_days" ? 30 : range === "last_90_days" ? 90 : 365;
  return date >= now - days * 86400000;
}

function CapaQuickViewDialog({
  finding,
  capa,
  open,
  onClose,
}: {
  finding: Finding;
  capa: CAPACase;
  open: boolean;
  onClose: () => void;
}) {
  const stepLabels: Record<string, string> = {
    problem: "D1 Problem",
    containment: "D2 Containment",
    rca: "D3 RCA",
    ca: "D4 Corrective Action",
    pa: "D5 Preventive Action",
    verification: "D6 Verification",
    signoff: "D7 Sign-Off",
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{capa.id}</DialogTitle>
          <DialogDescription>Quick CAPA status preview for {finding.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">Status</div>
              <div className="mt-1.5">
                <StatusBadge status={capa.status} />
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">Quality Score</div>
              <div className="mt-1.5">
                <ScorePill score={capa.score.total} />
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">Current Step</div>
              <div className="mt-1 font-medium">{stepLabels[capa.currentStep] ?? capa.currentStep}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">Type</div>
              <div className="mt-1">{formatCAPAType(capa.type)}</div>
            </div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Title</div>
            <div className="mt-1 leading-5">{capa.title}</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button asChild>
              <Link to={`/capa/${capa.id}`} onClick={onClose}>
                Open Full CAPA
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FindingsListPage() {
  const findings = useCapaStore((state) => state.findings);
  const getCAPAById = useCapaStore((state) => state.getCAPAById);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CAPAType | typeof allValue>(allValue);
  const [severityFilter, setSeverityFilter] = useState<Severity | typeof allValue>(allValue);
  const [statusFilter, setStatusFilter] = useState<FindingStatus | typeof allValue>(allValue);
  const [departmentFilter, setDepartmentFilter] = useState(allValue);
  const [dateRange, setDateRange] = useState<DateRange>(allValue);
  const [quickViewFindingId, setQuickViewFindingId] = useState<string | undefined>();

  const quickViewFinding = useMemo(
    () => findings.find((f) => f.id === quickViewFindingId),
    [findings, quickViewFindingId],
  );
  const quickViewCapa = useMemo(
    () => (quickViewFinding?.linkedCapaId ? getCAPAById(quickViewFinding.linkedCapaId) : undefined),
    [getCAPAById, quickViewFinding],
  );

  const departments = useMemo(
    () => Array.from(new Set(findings.map((finding) => finding.department))).sort(),
    [findings],
  );

  const filteredFindings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return findings.filter((finding) => {
      if (typeFilter !== allValue && finding.type !== typeFilter) return false;
      if (severityFilter !== allValue && finding.severity !== severityFilter) return false;
      if (statusFilter !== allValue && finding.status !== statusFilter) return false;
      if (departmentFilter !== allValue && finding.department !== departmentFilter) return false;
      if (!isWithinRange(finding.reportedAt, dateRange)) return false;
      if (!normalizedQuery) return true;

      return [
        finding.id,
        finding.shortDescription,
        finding.department,
        finding.source,
        finding.linkedCapaId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [dateRange, departmentFilter, findings, query, severityFilter, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Findings List</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review Deviation, Audit Finding, and Complaint records imported from mocked source systems before creating or opening CAPA workflows.
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
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(5,minmax(140px,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search finding, CAPA, source, or department"
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FindingStatus | typeof allValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Statuses</SelectItem>
                <SelectItem value="pending_capa">Pending CAPA</SelectItem>
                <SelectItem value="capa_in_progress">CAPA In Progress</SelectItem>
                <SelectItem value="capa_closed">CAPA Closed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range} value={range}>
                    {dateRangeLabel(range)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filteredFindings.length} Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Reported</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((finding) => (
                  <tr key={finding.id} className="border-t align-top">
                    <td className="px-3 py-3 font-mono text-xs">
                      <Link className="text-primary hover:underline" to={`/findings/${finding.id}`}>
                        {finding.id}
                      </Link>
                      <div className="mt-2">
                        <SourceBadge source={finding.source} />
                      </div>
                    </td>
                    <td className="px-3 py-3">{formatCAPAType(finding.type)}</td>
                    <td className="max-w-xl px-3 py-3">{finding.shortDescription}</td>
                    <td className="px-3 py-3">
                      <SeverityBadge severity={finding.severity} />
                    </td>
                    <td className="px-3 py-3">{finding.department}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(finding.reportedAt)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={finding.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/findings/${finding.id}`}>View Finding</Link>
                        </Button>
                        {finding.linkedCapaId ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setQuickViewFindingId(finding.id)}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Quick View
                            </Button>
                            <Button asChild size="sm">
                              <Link to={`/capa/${finding.linkedCapaId}`}>
                                Open CAPA
                                <ArrowRight className="ml-2 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/capa/new?type=${finding.type}&sourceId=${finding.id}`}>
                              Create CAPA
                              <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {quickViewFinding && quickViewCapa && (
        <CapaQuickViewDialog
          finding={quickViewFinding}
          capa={quickViewCapa}
          open={Boolean(quickViewFindingId)}
          onClose={() => setQuickViewFindingId(undefined)}
        />
      )}
    </div>
  );
}

