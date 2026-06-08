import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AILoadingSpinner } from "@/components/shared/AILoadingSpinner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { topicClusters } from "@/mock-data";
import { useCapas, useFindings } from "@/hooks/api";
import type { Finding, TopicCluster } from "@/types/finding";
import { formatCAPAType } from "@/utils/formatters";

function riskClassName(riskLevel: TopicCluster["riskLevel"]) {
  if (riskLevel === "High") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (riskLevel === "Medium") return "border-severity-major/30 bg-severity-major/10 text-severity-major";
  return "border-status-ready/30 bg-status-ready/10 text-status-ready";
}

function TrendBadge({ trend }: { trend: TopicCluster["trend"] }) {
  const icon =
    trend === "up" ? (
      <TrendingUp className="h-3 w-3" />
    ) : trend === "down" ? (
      <TrendingDown className="h-3 w-3" />
    ) : (
      <Minus className="h-3 w-3" />
    );

  return (
    <Badge variant="outline" className="gap-1.5">
      {icon}
      {trend === "up" ? "Trend Up" : trend === "down" ? "Trend Down" : "Stable"}
    </Badge>
  );
}

function getSeverityTotal(cluster: TopicCluster) {
  return (
    (cluster.severityDistribution.Ungraded ?? 0) +
    cluster.severityDistribution.Minor +
    cluster.severityDistribution.Major +
    cluster.severityDistribution.Critical
  );
}

export function TopicsGroupingPage() {
  const findings = useFindings().data ?? [];
  const capas = useCapas().data ?? [];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const findingById = useMemo(
    () => new Map(findings.map((finding) => [finding.id, finding])),
    [findings],
  );
  const capaFindingIds = useMemo(
    () => new Set(capas.map((capa) => capa.findingId)),
    [capas],
  );

  async function analyzeTopics() {
    setIsAnalyzing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
    setHasAnalyzed(true);
    setIsAnalyzing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Topics Grouping</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            AI-powered grouping for recurring finding patterns across deviations, audit findings, and complaints.
          </p>
        </div>
        <Button onClick={analyzeTopics} disabled={isAnalyzing}>
          <BrainCircuit className="mr-2 h-4 w-4" />
          Analyze Topics
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Findings</div>
            <div className="mt-2 text-2xl font-semibold">{findings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">CAPA Linked</div>
            <div className="mt-2 text-2xl font-semibold">{capaFindingIds.size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">High Risk Topics</div>
            <div className="mt-2 text-2xl font-semibold">
              {(topicClusters as TopicCluster[]).filter((cluster) => cluster.riskLevel === "High").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">Recurring Clusters</div>
            <div className="mt-2 text-2xl font-semibold">{hasAnalyzed ? topicClusters.length : "--"}</div>
          </CardContent>
        </Card>
      </div>

      {isAnalyzing && (
        <Card>
          <CardContent className="p-4">
            <AILoadingSpinner label="Nova is clustering findings by recurring quality topics…" />
          </CardContent>
        </Card>
      )}

      {!hasAnalyzed && !isAnalyzing && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Click Analyze Topics to generate recurring finding clusters with trend, risk, and related finding links.
          </CardContent>
        </Card>
      )}

      {hasAnalyzed && (
        <div className="grid gap-4 xl:grid-cols-2">
          {(topicClusters as TopicCluster[]).map((cluster) => {
            const relatedFindings = cluster.findingIds
              .map((findingId) => findingById.get(findingId))
              .filter(Boolean) as Finding[];
            const severityTotal = Math.max(getSeverityTotal(cluster), 1);
            const capaCount = relatedFindings.filter((finding) => finding.linkedCapaId).length;

            return (
              <Card key={cluster.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">{cluster.name}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{cluster.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={riskClassName(cluster.riskLevel)}>
                        {cluster.riskLevel} Risk
                      </Badge>
                      <TrendBadge trend={cluster.trend} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded border p-3">
                      <div className="text-xs font-medium uppercase text-muted-foreground">Finding Count</div>
                      <div className="mt-2 text-xl font-semibold">{cluster.findingIds.length}</div>
                    </div>
                    <div className="rounded border p-3">
                      <div className="text-xs font-medium uppercase text-muted-foreground">CAPA Count</div>
                      <div className="mt-2 text-xl font-semibold">{capaCount}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-medium uppercase text-muted-foreground">Severity Distribution</div>
                    {(["Critical", "Major", "Minor", "Ungraded"] as const).map((severity) => {
                      const value = cluster.severityDistribution[severity];
                      const percent = Math.round((value / severityTotal) * 100);
                      return (
                        <div key={severity} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <SeverityBadge severity={severity} />
                            <span className="text-muted-foreground">
                              {value} · {percent}%
                            </span>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-medium uppercase text-muted-foreground">Related Findings</div>
                    {relatedFindings.map((finding) => (
                      <Link
                        key={finding.id}
                        to={`/findings/${finding.id}`}
                        className="block rounded border p-3 transition hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="font-sans text-xs text-primary">{finding.id}</div>
                            <p className="mt-1 text-sm">{finding.shortDescription}</p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {formatCAPAType(finding.type)} · {finding.department}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                    {relatedFindings.length === 0 && (
                      <div className="rounded border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Related finding details are not available in the mock dataset.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
