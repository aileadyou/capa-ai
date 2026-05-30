import type { DepartmentHeatmapEntry } from "@/types";

export function DeptHeatmap({ data }: { data: DepartmentHeatmapEntry[] }) {
  if (data.length === 0) {
    return <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">No department data available.</div>;
  }

  return (
    <div className="grid gap-2">
      {data.map((entry) => (
        <div key={entry.department} className="grid grid-cols-[140px_1fr_80px] items-center gap-3 text-sm">
          <div className="truncate font-medium">{entry.department}</div>
          <div className="h-7 overflow-hidden rounded bg-muted">
            <div
              className="flex h-full items-center justify-end bg-primary/80 pr-2 text-xs font-medium text-primary-foreground"
              style={{ width: `${entry.completionRate}%` }}
            >
              {entry.completionRate}%
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {entry.openCapas} open · {entry.overdueCapas} overdue
          </div>
        </div>
      ))}
    </div>
  );
}

