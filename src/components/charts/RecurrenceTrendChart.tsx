import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { RecurrenceTrendPoint } from "@/types";

export function RecurrenceTrendChart({ data }: { data: RecurrenceTrendPoint[] }) {
  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No recurrence data available.</div>;
  }

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="newFindings"
            name="New Findings"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="recurred"
            name="Recurred"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={{ r: 3 }}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
