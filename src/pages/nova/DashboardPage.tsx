import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  getDashboardStats,
  getDepartmentHeatmap,
  getFindingTrend,
  getRootCauseTrends,
  getTypeBreakdown,
} from "@/services/dashboardService";

// ── Types ─────────────────────────────────────────────────────────────────────

type RangeOption = "This Month" | "Last 3 Months" | "Year to Date" | "Last 12 Months";

// ── Palette constants for SVG/chart attributes ───────────────────────────────
const CLR_ACCENT = "var(--accent)";
const CLR_SUCCESS = "var(--success)";
const CLR_FG3 = "var(--fg-3)";
const CLR_FG4 = "var(--fg-4)";
const CLR_FG1 = "var(--fg-1)";
const CLR_BG4 = "var(--bg-4)";
const CLR_LINE1 = "var(--line-1)";

// ── Date range selector ───────────────────────────────────────────────────────

function DateRangeSelector({
  value,
  onChange,
}: {
  value: RangeOption;
  onChange: (v: RangeOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: RangeOption[] = ["This Month", "Last 3 Months", "Year to Date", "Last 12 Months"];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 12px",
          background: "var(--bg-3)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-sm)",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--fg-2)",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {value}
        <ChevronDown size={13} style={{ color: "var(--fg-3)" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 20,
            background: "var(--bg-3)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-md)",
            padding: "4px",
            minWidth: "160px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 10px",
                borderRadius: "var(--r-sm)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                color: opt === value ? "var(--accent)" : "var(--fg-2)",
                background: opt === value ? "var(--accent-soft)" : "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: opt === value ? 600 : 400,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  eyebrow,
  metric,
  caption,
  to,
  gradientBorder = false,
}: {
  eyebrow: string;
  metric: string | number;
  caption: string;
  to: string;
  gradientBorder?: boolean;
}) {
  return (
    <Link
      to={to}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          position: "relative",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-lg)",
          padding: "20px 20px 20px 24px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line-3)";
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line-2)";
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)";
        }}
      >
        {/* Gradient left border */}
        {gradientBorder && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "3px",
              background: "var(--grad-brand)",
              borderRadius: "var(--r-lg) 0 0 var(--r-lg)",
            }}
          />
        )}

        {/* Eyebrow */}
        <p
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            margin: "0 0 8px",
          }}
        >
          {eyebrow}
        </p>

        {/* Metric */}
        <p
          style={{
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: "var(--font-mono)",
            color: gradientBorder ? "transparent" : "var(--fg-1)",
            background: gradientBorder ? "var(--grad-brand)" : undefined,
            WebkitBackgroundClip: gradientBorder ? "text" : undefined,
            backgroundClip: gradientBorder ? "text" : undefined,
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          {metric}
        </p>

        {/* Caption */}
        <p
          style={{
            fontSize: "12px",
            color: "var(--fg-3)",
            margin: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          {caption}
        </p>
      </div>
    </Link>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({
  eyebrow,
  title,
  subtitle,
  children,
  style: extraStyle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        ...extraStyle,
      }}
    >
      <div>
        {eyebrow && (
          <p
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 4px",
            }}
          >
            {eyebrow}
          </p>
        )}
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--fg-1)",
            margin: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--fg-3)",
              margin: "3px 0 0",
              fontFamily: "var(--font-sans)",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Finding trend SVG area chart ──────────────────────────────────────────────

function FindingTrendChart() {
  const raw = getFindingTrend();
  const totals = raw.map((d) => d.deviation + d.audit + d.complaint);
  const n = totals.length;
  const maxVal = Math.max(...totals);

  const W = 600;
  const H = 160;
  const PAD = { top: 16, right: 12, bottom: 32, left: 28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (n - 1)) * cW;
  const toY = (v: number) => PAD.top + cH - (v / maxVal) * cH;

  const linePts = totals.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPts = `${linePts} L${toX(n - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;

  const yTicks = [0, Math.round(maxVal * 0.5), maxVal];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", overflow: "visible" }}
      aria-label="Finding trend area chart"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: CLR_ACCENT, stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: CLR_ACCENT, stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={toY(tick)}
            y2={toY(tick)}
            style={{ stroke: CLR_LINE1 }}
            strokeWidth="1"
          />
          <text x={PAD.left - 6} y={toY(tick) + 4} textAnchor="end" fontSize="9" style={{ fill: CLR_FG4 }}>
            {tick}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPts} style={{ fill: "url(#trendFill)" }} />

      {/* Line */}
      <path
        d={linePts}
        fill="none"
        style={{ stroke: CLR_ACCENT }}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {totals.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3" style={{ fill: CLR_ACCENT }} />
      ))}

      {/* X-axis labels — every other month */}
      {raw.map((d, i) => {
        if (i % 2 !== 0) return null;
        return (
          <text
            key={i}
            x={toX(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            style={{ fill: CLR_FG4 }}
          >
            {d.label.slice(0, 3)} {d.label.slice(-2)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Breakdown by type — SVG donut ─────────────────────────────────────────────

function TypeDonutChart() {
  const data = getTypeBreakdown();
  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 76;
  const cy = 76;
  const r = 54;
  const sw = 20;
  const circumference = 2 * Math.PI * r;
  const segColors = [CLR_ACCENT, CLR_SUCCESS, CLR_FG3];

  const typeLabels: Record<string, string> = {
    deviation: "Deviation",
    audit: "Audit finding",
    complaint: "Complaint",
  };

  let cumAngle = -90;
  const segments = data.map((d, i) => {
    const pct = d.count / total;
    const arcLen = pct * circumference - 3; // 3px gap
    const rot = cumAngle;
    cumAngle += pct * 360;
    return { ...d, arcLen, rot, color: segColors[i] ?? CLR_FG3 };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
      {/* SVG donut */}
      <svg
        viewBox="0 0 152 152"
        style={{ width: "140px", height: "140px", flexShrink: 0 }}
        aria-label="Breakdown by type donut chart"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={CLR_BG4}
          strokeWidth={sw}
        />
        {segments.map((seg) => (
          <circle
            key={seg.type}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={sw}
            strokeDasharray={`${seg.arcLen.toFixed(2)} ${circumference.toFixed(2)}`}
            transform={`rotate(${seg.rot} ${cx} ${cy})`}
          />
        ))}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill={CLR_FG1}
          fontFamily="'IBM Plex Mono', monospace"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fontSize="9"
          fill={CLR_FG4}
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.08em"
        >
          TOTAL
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {segments.map((seg) => (
          <div key={seg.type} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "var(--fg-2)",
                fontFamily: "var(--font-sans)",
                flex: 1,
              }}
            >
              {typeLabels[seg.type] ?? seg.type}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: "var(--fg-1)",
              }}
            >
              {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root cause horizontal bar chart ──────────────────────────────────────────

function RootCauseBarChart() {
  const data = getRootCauseTrends();
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {data.map((item) => {
        const pct = (item.count / maxCount) * 100;
        const recurringPct = item.count > 0 ? (item.recurringCount / item.count) * 100 : 0;

        return (
          <div key={item.category}>
            {/* Label row */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {item.category}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {item.recurringCount > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--warning)",
                      background: "var(--warning-soft)",
                      padding: "1px 6px",
                      borderRadius: "var(--r-full)",
                    }}
                  >
                    {item.recurringCount} recurring
                  </span>
                )}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-1)",
                  }}
                >
                  {item.count}
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div
              style={{
                height: "8px",
                background: "var(--bg-4)",
                borderRadius: "4px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Main bar — grad-brand */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--grad-brand)",
                  borderRadius: "4px",
                  transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
              {/* Recurring overlay — semi-transparent warning */}
              {item.recurringCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: `${pct - recurringPct * (pct / 100)}%`,
                    top: 0,
                    height: "100%",
                    width: `${recurringPct * (pct / 100)}%`,
                    background: "color-mix(in srgb, var(--warning) 45%, transparent)",
                    borderRadius: "0 4px 4px 0",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "4px",
          paddingTop: "12px",
          borderTop: "1px solid var(--line-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "6px",
              borderRadius: "3px",
              background: "var(--grad-brand)",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
            Total occurrences
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "6px",
              borderRadius: "3px",
              background: "color-mix(in srgb, var(--warning) 45%, transparent)",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
            Recurring (same root cause pattern)
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Dept completion heatmap ───────────────────────────────────────────────────

function DeptHeatmap() {
  const data = getDepartmentHeatmap();

  function trackColor(rate: number) {
    if (rate >= 80) return CLR_SUCCESS;
    if (rate >= 65) return "var(--warning)";
    return "var(--danger)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {data.map((dept) => (
        <div key={dept.department}>
          {/* Row header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "7px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--fg-2)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {dept.department}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {dept.overdueCapas > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--danger)",
                    background: "var(--danger-soft)",
                    padding: "1px 6px",
                    borderRadius: "var(--r-full)",
                  }}
                >
                  {dept.overdueCapas} overdue
                </span>
              )}
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {dept.openCapas} open
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: trackColor(dept.completionRate),
                  minWidth: "38px",
                  textAlign: "right",
                }}
              >
                {dept.completionRate}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: "6px",
              background: "var(--bg-4)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${dept.completionRate}%`,
                background: trackColor(dept.completionRate),
                borderRadius: "3px",
                transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </div>
      ))}

      {/* Scale legend */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          marginTop: "4px",
          paddingTop: "12px",
          borderTop: "1px solid var(--line-1)",
          flexWrap: "wrap",
        }}
      >
        {[
          { color: CLR_SUCCESS, label: "≥ 80% on track" },
          { color: "var(--warning)", label: "65–79% at risk" },
          { color: "var(--danger)", label: "< 65% needs attention" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const stats = getDashboardStats();
  const [range, setRange] = useState<RangeOption>("This Month");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Page header row ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 4px",
            }}
          >
            Analytics
          </p>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: 0,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--fg-3)",
              margin: "4px 0 0",
              fontFamily: "var(--font-sans)",
            }}
          >
            QA performance overview for {range.toLowerCase()}.
          </p>
        </div>

        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── ROW 1 — KPI cards ────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
        }}
      >
        <KpiCard
          eyebrow="Findings MTD"
          metric={stats.totalFindingsMTD}
          caption="Deviations, audits, complaints"
          to="/findings"
        />
        <KpiCard
          eyebrow="Open CAPAs"
          metric={stats.openCapas}
          caption="Across all active statuses"
          to="/capa"
        />
        <KpiCard
          eyebrow="Overdue CAPAs"
          metric={stats.overdueCapas}
          caption="Past target closure date"
          to="/capa"
          gradientBorder
        />
        <KpiCard
          eyebrow="Effectiveness rate"
          metric={`${stats.effectivenessRate}%`}
          caption="Verified CAPA effectiveness"
          to="/capa"
        />
      </div>

      {/* ── ROW 2 — Finding trend + Type donut ───────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "14px",
        }}
      >
        <Card
          eyebrow="Trend"
          title="Finding trend"
          subtitle="Total findings per month — last 12 months"
        >
          <FindingTrendChart />
        </Card>

        <Card
          eyebrow="Breakdown"
          title="Breakdown by type"
          subtitle="Distribution of open findings by source"
        >
          <TypeDonutChart />
        </Card>
      </div>

      {/* ── ROW 3 — Root cause bar + Dept heatmap ────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "14px",
        }}
      >
        <Card
          eyebrow="Root cause"
          title="Top root cause categories"
          subtitle="Occurrences this period — orange band indicates recurring pattern"
        >
          <RootCauseBarChart />
        </Card>

        <Card
          eyebrow="Departments"
          title="Completion heatmap"
          subtitle="CAPA closure rate by department"
        >
          <DeptHeatmap />
        </Card>
      </div>

    </div>
  );
}
