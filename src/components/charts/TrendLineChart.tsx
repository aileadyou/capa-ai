import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendDataPoint } from "@/types";

export function TrendLineChart({ data }: { data: TrendDataPoint[] }) {
  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No trend data available.</div>;
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="deviation" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="audit" stroke="hsl(var(--nova))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="complaint" stroke="hsl(var(--severity-major))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

