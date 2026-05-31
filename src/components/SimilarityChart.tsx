import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

interface SimilarCase {
  id: string;
  similarity: number;
  year: string;
}

interface SimilarityChartProps {
  cases: SimilarCase[];
  onCaseClick?: (caseId: string) => void;
}

export const SimilarityChart = ({ cases, onCaseClick }: SimilarityChartProps) => {
  const data = cases.map((c) => ({
    name: c.id,
    value: c.similarity,
    year: c.year,
  }));

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "4px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}%`, "Similarity"]}
          />
          <Bar
            dataKey="value"
            radius={[0, 2, 2, 0]}
            cursor={onCaseClick ? "pointer" : "default"}
            onClick={(data) => onCaseClick?.(data.name)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.value >= 85
                    ? "hsl(var(--tw-success))"
                    : entry.value >= 70
                    ? "hsl(var(--tw-warning))"
                    : "hsl(var(--primary))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
