import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RootCauseTrendEntry } from "@/types";

export function RootCauseBarChart({ data }: { data: RootCauseTrendEntry[] }) {
  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No root cause data available.</div>;
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          <Bar dataKey="recurringCount" fill="hsl(var(--severity-major))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

