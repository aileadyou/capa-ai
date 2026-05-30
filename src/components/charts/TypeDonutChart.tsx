import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CAPAType } from "@/types";
import { formatCAPAType } from "@/utils/formatters";

const colors: Record<CAPAType, string> = {
  deviation: "hsl(var(--primary))",
  audit: "hsl(var(--nova))",
  complaint: "hsl(var(--severity-major))",
};

export function TypeDonutChart({ data }: { data: Array<{ type: CAPAType; count: number }> }) {
  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No type data available.</div>;
  }

  const chartData = data.map((entry) => ({ ...entry, label: formatCAPAType(entry.type) }));

  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={52} outerRadius={82} paddingAngle={3}>
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={colors[entry.type]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col justify-center gap-2">
        {chartData.map((entry) => (
          <div key={entry.type} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[entry.type] }} />
              {entry.label}
            </span>
            <span className="font-semibold">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

