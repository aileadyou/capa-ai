import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface DataQualityIssue {
  severity: "high" | "medium" | "low";
  category: string;
  column: string;
  description: string;
  suggestion: string;
  affectedRows: number | string;
}

interface DataQualityAnalysis {
  overallQuality: "good" | "fair" | "poor" | "unknown";
  issues: DataQualityIssue[];
  summary: string;
}

interface DataQualityReportProps {
  filename: string;
  analysis: DataQualityAnalysis;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "high":
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    case "medium":
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "low":
      return <Info className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
      return "destructive";
    case "medium":
      return "warning";
    case "low":
      return "secondary";
    default:
      return "secondary";
  }
};

const getQualityBadge = (quality: string) => {
  switch (quality) {
    case "good":
      return <Badge variant="default" className="bg-success text-success-foreground">Good Quality</Badge>;
    case "fair":
      return <Badge variant="default" className="bg-warning text-warning-foreground">Fair Quality</Badge>;
    case "poor":
      return <Badge variant="destructive">Poor Quality</Badge>;
    default:
      return <Badge variant="secondary">Quality Unknown</Badge>;
  }
};

export const DataQualityReport = ({ filename, analysis }: DataQualityReportProps) => {
  const topIssues = analysis.issues.slice(0, 3);
  const remainingCount = analysis.issues.length - 3;

  return (
    <Card className="p-6 space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Quality Analysis</h3>
            <p className="text-sm text-muted-foreground">{filename}</p>
          </div>
        </div>
        {getQualityBadge(analysis.overallQuality)}
      </div>

      {analysis.summary && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{analysis.summary}</AlertDescription>
        </Alert>
      )}

      {analysis.issues.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Top Issues ({topIssues.length} of {analysis.issues.length})
            </h4>
            {remainingCount > 0 && (
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  View All {analysis.issues.length} Issues
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
          {topIssues.map((issue, index) => (
            <Card key={index} className="p-4 space-y-2 border-l-4" style={{
              borderLeftColor: issue.severity === 'high' ? 'hsl(var(--destructive))' : 
                             issue.severity === 'medium' ? 'hsl(var(--warning))' : 
                             'hsl(var(--muted))'
            }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  {getSeverityIcon(issue.severity)}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getSeverityColor(issue.severity) as any} className="capitalize">
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {issue.category.replace(/_/g, ' ')}
                      </Badge>
                      {issue.column && (
                        <span className="text-xs text-muted-foreground">
                          Column: <span className="font-mono font-semibold">{issue.column}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground font-medium">{issue.description}</p>
                    <div className="bg-muted/50 rounded-md p-3 mt-2">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">💡 Suggested Fix:</p>
                      <p className="text-sm text-foreground">{issue.suggestion}</p>
                    </div>
                    {issue.affectedRows !== "unknown" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Affected rows: {issue.affectedRows}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {remainingCount > 0 && (
            <div className="text-center pt-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  + {remainingCount} more {remainingCount === 1 ? 'issue' : 'issues'}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Alert className="bg-success/10 border-success/20">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            No issues detected! Your data appears to be in good quality.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};
