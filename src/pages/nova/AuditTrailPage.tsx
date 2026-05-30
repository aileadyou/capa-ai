import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search } from "lucide-react";
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
import { useAuditTrailStore } from "@/store";
import type { AuditDomain, AuditEvent, AuditEventType } from "@/types";
import { formatDateTime } from "@/utils/formatters";

const allValue = "all";
const dateFilters = ["all", "today", "last_7_days", "last_30_days"] as const;

type DateFilter = (typeof dateFilters)[number];

function domainClassName(domain: AuditDomain) {
  const classes: Record<AuditDomain, string> = {
    system: "border-status-investigation/30 bg-status-investigation/10 text-status-investigation",
    ai_decision: "border-nova/30 bg-nova/10 text-nova",
    integration: "border-primary/30 bg-primary/10 text-primary",
    clear_labeling: "border-status-ready/30 bg-status-ready/10 text-status-ready",
  };

  return classes[domain];
}

function formatDomain(domain: AuditDomain) {
  const labels: Record<AuditDomain, string> = {
    system: "System",
    ai_decision: "AI Decision",
    integration: "Integration",
    clear_labeling: "Clear Labeling",
  };

  return labels[domain];
}

function formatEventType(eventType: AuditEventType) {
  return eventType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isInDateFilter(timestamp: string, dateFilter: DateFilter) {
  if (dateFilter === "all") return true;

  const eventDate = new Date(timestamp);
  const now = new Date();

  if (dateFilter === "today") {
    return eventDate.toDateString() === now.toDateString();
  }

  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (dateFilter === "last_7_days" ? 7 : 30));
  return eventDate >= cutoff;
}

export function AuditTrailPage() {
  const events = useAuditTrailStore((state) => state.events);
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<AuditDomain | typeof allValue>(allValue);
  const [capaFilter, setCapaFilter] = useState(allValue);
  const [findingFilter, setFindingFilter] = useState(allValue);
  const [actorFilter, setActorFilter] = useState(allValue);
  const [dateFilter, setDateFilter] = useState<DateFilter>(allValue);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      ),
    [events],
  );

  const capaIds = useMemo(
    () => Array.from(new Set(events.map((event) => event.capaId).filter(Boolean) as string[])).sort(),
    [events],
  );
  const findingIds = useMemo(
    () => Array.from(new Set(events.map((event) => event.findingId).filter(Boolean) as string[])).sort(),
    [events],
  );
  const actors = useMemo(
    () => Array.from(new Set(events.map((event) => event.actorName))).sort(),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedEvents.filter((event) => {
      if (domainFilter !== allValue && event.domain !== domainFilter) return false;
      if (capaFilter !== allValue && event.capaId !== capaFilter) return false;
      if (findingFilter !== allValue && event.findingId !== findingFilter) return false;
      if (actorFilter !== allValue && event.actorName !== actorFilter) return false;
      if (!isInDateFilter(event.timestamp, dateFilter)) return false;
      if (!normalizedQuery) return true;

      return [
        event.id,
        event.actorName,
        event.actorRole,
        event.action,
        event.capaId,
        event.findingId,
        event.before,
        event.after,
        event.eventType,
        event.domain,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [actorFilter, capaFilter, dateFilter, domainFilter, findingFilter, query, sortedEvents]);

  function exportAuditTrail() {
    toast.success("Audit trail export prepared", {
      description: "CSV/PDF export is mocked in this frontend demo.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Global Audit Trail</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Read-only event log for system actions, Nova decisions, integration imports, notifications, approvals, and field changes.
          </p>
        </div>
        <Button variant="outline" onClick={exportAuditTrail}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV/PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Events</div>
            <div className="mt-2 text-2xl font-semibold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">AI Decisions</div>
            <div className="mt-2 text-2xl font-semibold">
              {events.filter((event) => event.domain === "ai_decision").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Integrations</div>
            <div className="mt-2 text-2xl font-semibold">
              {events.filter((event) => event.domain === "integration").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Filtered</div>
            <div className="mt-2 text-2xl font-semibold">{filteredEvents.length}</div>
          </CardContent>
        </Card>
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
                placeholder="Search actor, event, CAPA, finding, before/after"
              />
            </div>
            <Select value={domainFilter} onValueChange={(value) => setDomainFilter(value as AuditDomain | typeof allValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Domains</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="ai_decision">AI Decision</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="clear_labeling">Clear Labeling</SelectItem>
              </SelectContent>
            </Select>
            <Select value={capaFilter} onValueChange={setCapaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="CAPA ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All CAPAs</SelectItem>
                {capaIds.map((capaId) => (
                  <SelectItem key={capaId} value={capaId}>
                    {capaId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={findingFilter} onValueChange={setFindingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Finding ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Findings</SelectItem>
                {findingIds.map((findingId) => (
                  <SelectItem key={findingId} value={findingId}>
                    {findingId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Actors</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor} value={actor}>
                    {actor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filteredEvents.length} Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Domain</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">CAPA / Finding</th>
                  <th className="px-3 py-2">Before / After</th>
                  <th className="px-3 py-2">Nova Metadata</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event: AuditEvent) => (
                  <tr key={event.id} className="border-t align-top">
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs">{event.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={domainClassName(event.domain)}>
                        {formatDomain(event.domain)}
                      </Badge>
                      <div className="mt-2 text-xs text-muted-foreground">{formatEventType(event.eventType)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{event.actorName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{event.actorRole}</div>
                    </td>
                    <td className="max-w-md px-3 py-3">{event.action}</td>
                    <td className="px-3 py-3">
                      {event.capaId ? (
                        <Link className="font-mono text-xs text-primary hover:underline" to={`/capa/${event.capaId}`}>
                          {event.capaId}
                        </Link>
                      ) : (
                        <div className="text-xs text-muted-foreground">No CAPA</div>
                      )}
                      {event.findingId && (
                        <div className="mt-2">
                          <Link className="font-mono text-xs text-primary hover:underline" to={`/findings/${event.findingId}`}>
                            {event.findingId}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="max-w-sm px-3 py-3">
                      {event.before || event.after ? (
                        <div className="space-y-2 text-xs">
                          {event.before && (
                            <div className="rounded border bg-muted/30 p-2">
                              <div className="mb-1 font-medium text-muted-foreground">Before</div>
                              {event.before}
                            </div>
                          )}
                          {event.after && (
                            <div className="rounded border bg-muted/30 p-2">
                              <div className="mb-1 font-medium text-muted-foreground">After</div>
                              {event.after}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No field diff</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {event.novaMetadata ? (
                        <div className="rounded border border-nova/20 bg-nova/5 p-2 text-xs">
                          <div className="font-medium text-nova">{event.novaMetadata.modelName}</div>
                          <div className="mt-1 text-muted-foreground">{event.novaMetadata.modelVersion}</div>
                          <div className="mt-1 text-muted-foreground">
                            Confidence: {event.novaMetadata.confidenceScore}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not AI-generated</span>
                      )}
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
