import { useMemo, useState } from "react";
import { BrainCircuit, Search } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AILoadingSpinner } from "@/components/shared/AILoadingSpinner";
import { kgCitations } from "@/mock-data";
import type { CAPAType, KGCitation } from "@/types";
import { formatCAPAType } from "@/utils/formatters";

const allValue = "all";

type OutcomeFilter = KGCitation["outcome"] | typeof allValue;
type TypeFilter = CAPAType | typeof allValue;
type YearFilter = string;

function searchSimilarity(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = structuredClone(kgCitations) as KGCitation[];

  if (!normalizedQuery) return results;

  const matched = results.filter((citation) =>
    [
      citation.deviationId,
      citation.capaId,
      citation.rootCause,
      citation.correctiveAction,
      citation.outcome,
      citation.sourceType,
      citation.year,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );

  if (matched.length > 0) return matched;

  return results
    .map((citation, index) => ({
      ...citation,
      similarityScore: Math.max(70, citation.similarityScore - index * 3),
    }))
    .sort((left, right) => right.similarityScore - left.similarityScore);
}

function outcomeClassName(outcome: KGCitation["outcome"]) {
  if (outcome === "Effective") return "border-status-ready/30 bg-status-ready/10 text-status-ready";
  if (outcome === "Recurred") return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-status-investigation/30 bg-status-investigation/10 text-status-investigation";
}

export function SimilarityExplorerPage() {
  const [query, setQuery] = useState(
    "Environmental monitoring excursion in Grade A filling area with HEPA filter interval concern",
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<KGCitation[]>([]);
  const [minSimilarity, setMinSimilarity] = useState([75]);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>(allValue);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(allValue);
  const [yearFilter, setYearFilter] = useState<YearFilter>(allValue);
  const [selectedResult, setSelectedResult] = useState<KGCitation | undefined>();

  const years = useMemo(
    () =>
      Array.from(new Set((kgCitations as KGCitation[]).map((citation) => String(citation.year)))).sort(
        (left, right) => Number(right) - Number(left),
      ),
    [],
  );

  const filteredResults = useMemo(
    () =>
      results.filter((result) => {
        if (result.similarityScore < minSimilarity[0]) return false;
        if (outcomeFilter !== allValue && result.outcome !== outcomeFilter) return false;
        if (typeFilter !== allValue && result.sourceType !== typeFilter) return false;
        if (yearFilter !== allValue && String(result.year) !== yearFilter) return false;
        return true;
      }),
    [minSimilarity, outcomeFilter, results, typeFilter, yearFilter],
  );

  async function runSearch() {
    setIsSearching(true);
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
    setResults(searchSimilarity(query));
    setHasSearched(true);
    setIsSearching(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Similarity Analysis</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Search historical CAPA patterns by finding description, root cause, corrective action, outcome, and source type.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Describe a finding to search for similar historical CAPAs"
              />
            </div>
            <Button onClick={runSearch} disabled={isSearching}>
              <BrainCircuit className="mr-2 h-4 w-4" />
              AI Search
            </Button>
          </div>
          {isSearching && <AILoadingSpinner label="Nova is searching historical CAPA similarity..." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,1fr))]">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Min similarity</span>
                <span className="font-medium">{minSimilarity[0]}%</span>
              </div>
              <Slider value={minSimilarity} onValueChange={setMinSimilarity} min={50} max={95} step={1} />
            </div>
            <Select value={outcomeFilter} onValueChange={(value) => setOutcomeFilter(value as OutcomeFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Outcomes</SelectItem>
                <SelectItem value="Effective">Effective</SelectItem>
                <SelectItem value="Recurred">Recurred</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
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
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {!hasSearched && (
          <Card className="xl:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Enter any finding description and run AI Search to compare it with historical CAPA patterns.
            </CardContent>
          </Card>
        )}
        {hasSearched && filteredResults.length === 0 && (
          <Card className="xl:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No similarity results match the current filters.
            </CardContent>
          </Card>
        )}
        {filteredResults.map((result) => (
          <Card key={`${result.capaId}-${result.deviationId}`} className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-base">{result.capaId}</CardTitle>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{result.deviationId}</p>
                </div>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  {result.similarityScore}% similar
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Root Cause</div>
                <p className="mt-1 text-sm leading-6">{result.rootCause}</p>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Corrective Action</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{result.correctiveAction}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={outcomeClassName(result.outcome)}>
                  {result.outcome}
                </Badge>
                <Badge variant="outline">{formatCAPAType(result.sourceType)}</Badge>
                <Badge variant="outline">{result.year}</Badge>
              </div>
              <Button variant="outline" onClick={() => setSelectedResult(result)}>
                Open Historical Detail
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selectedResult)} onOpenChange={(open) => !open && setSelectedResult(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedResult?.capaId}</DialogTitle>
            <DialogDescription>Historical CAPA similarity detail</DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded border p-3">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Source ID</div>
                  <div className="mt-1 font-mono">{selectedResult.deviationId}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Similarity</div>
                  <div className="mt-1">{selectedResult.similarityScore}%</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Type</div>
                  <div className="mt-1">{formatCAPAType(selectedResult.sourceType)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Outcome</div>
                  <div className="mt-1">{selectedResult.outcome}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Root Cause</div>
                <p className="mt-1 leading-6">{selectedResult.rootCause}</p>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Corrective Action</div>
                <p className="mt-1 leading-6">{selectedResult.correctiveAction}</p>
              </div>
              <div className="rounded border bg-muted/30 p-3 text-muted-foreground">
                Nova uses this case as a contextual citation only. The current CAPA still requires user confirmation and audit-ready evidence.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
