import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  getDepartmentHeatmap,
  getFindingTrend,
  getRecurrenceTrend,
  getRootCauseTrends,
  getTypeBreakdown,
} from "@/services/dashboardService";
import { useDashboard, useFindings } from "@/hooks/api";
import { usePersonaStore } from "@/store";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type RangeOption = "This Month" | "Last 3 Months" | "Year to Date" | "Last 12 Months";

// ── Palette constants for SVG/chart attributes ───────────────────────────────
const CLR_PRIMARY = "hsl(var(--primary))";
const CLR_SUCCESS = "hsl(var(--tw-success))";
const CLR_WARNING = "hsl(var(--tw-warning))";
const CLR_DANGER = "hsl(var(--destructive))";
const CLR_FOREGROUND = "hsl(var(--foreground))";
const CLR_FOREGROUND_TERTIARY = "hsl(var(--foreground-tertiary))";
const CLR_FOREGROUND_FAINT = "hsl(var(--foreground-faint))";
const CLR_FIELD = "hsl(var(--field))";
const CLR_BORDER_SUBTLE = "hsl(var(--border-subtle))";

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
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3 py-[7px] font-sans text-xs font-medium text-foreground-secondary"
      >
        {value}
        <ChevronDown size={13} className="text-foreground-tertiary" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-40 rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-1 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "block w-full cursor-pointer rounded-[var(--r-sm)] border-0 px-2.5 py-[7px] text-left font-sans text-xs",
                opt === value
                  ? "bg-[var(--accent-soft)] font-semibold text-primary"
                  : "bg-transparent font-normal text-foreground-secondary",
              )}
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
      className="block no-underline"
    >
      <div
        className="relative cursor-pointer overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card py-5 pl-6 pr-5 shadow-sm transition-[border-color,background,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-3)] hover:bg-card hover:shadow-md"
      >
        {/* Gradient left border */}
        {gradientBorder && (
          <div
            className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[var(--r-lg)] bg-[image:var(--grad-brand)]"
          />
        )}

        {/* Eyebrow */}
        <p
          className="mb-2 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"
        >
          {eyebrow}
        </p>

        {/* Metric */}
        <p
          className={cn(
            "mb-2 mt-0 font-sans text-[40px] font-bold leading-none tracking-[-0.02em]",
            gradientBorder
              ? "bg-[image:var(--grad-brand)] bg-clip-text text-transparent"
              : "text-foreground",
          )}
        >
          {metric}
        </p>

        {/* Caption */}
        <p
          className="m-0 font-sans text-xs text-foreground-tertiary"
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
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-[22px] py-5 shadow-sm"
    >
      <div>
        {eyebrow && (
          <p
            className="mb-1 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"
          >
            {eyebrow}
          </p>
        )}
        <p
          className="m-0 font-sans text-base font-semibold text-foreground"
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="mt-[3px] font-sans text-xs text-foreground-tertiary"
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
      className="h-auto w-full overflow-visible"
      aria-label="Finding trend area chart"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CLR_PRIMARY} stopOpacity="0.28" />
          <stop offset="100%" stopColor={CLR_PRIMARY} stopOpacity="0" />
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
            stroke={CLR_BORDER_SUBTLE}
            strokeWidth="1"
          />
          <text x={PAD.left - 6} y={toY(tick) + 4} textAnchor="end" fontSize="9" fill={CLR_FOREGROUND_FAINT}>
            {tick}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPts} fill="url(#trendFill)" />

      {/* Line */}
      <path
        d={linePts}
        fill="none"
        stroke={CLR_PRIMARY}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {totals.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={CLR_PRIMARY} />
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
            fill={CLR_FOREGROUND_FAINT}
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
  const segColors = [CLR_PRIMARY, CLR_SUCCESS, CLR_FOREGROUND_TERTIARY];

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
    return { ...d, arcLen, rot, color: segColors[i] ?? CLR_FOREGROUND_TERTIARY };
  });

  return (
    <div className="flex items-center gap-7">
      {/* SVG donut */}
      <svg
        viewBox="0 0 152 152"
        className="h-[140px] w-[140px] shrink-0"
        aria-label="Breakdown by type donut chart"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={CLR_FIELD}
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
          fill={CLR_FOREGROUND}
          fontFamily="inherit"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fontSize="9"
          fill={CLR_FOREGROUND_FAINT}
          fontFamily="inherit"
          letterSpacing="0.08em"
        >
          TOTAL
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-1 flex-col gap-3">
        {segments.map((seg) => (
          <div key={seg.type} className="flex items-center gap-2.5">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                background: seg.color,
              }}
            />
            <span className="flex-1 font-sans text-xs text-foreground-secondary">
              {typeLabels[seg.type] ?? seg.type}
            </span>
            <span className="font-sans text-[13px] font-semibold text-foreground">
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
    <div className="flex flex-col gap-3.5">
      {data.map((item) => {
        const pct = (item.count / maxCount) * 100;
        const recurringPct = item.count > 0 ? (item.recurringCount / item.count) * 100 : 0;

        return (
          <div key={item.category}>
            {/* Label row */}
            <div
              className="mb-1.5 flex items-baseline justify-between"
            >
              <span className="font-sans text-xs font-medium text-foreground-secondary">
                {item.category}
              </span>
              <div
                className="flex items-center gap-2"
              >
                {item.recurringCount > 0 && (
                  <span className="rounded-[var(--r-full)] bg-[var(--warning-soft)] px-1.5 py-px font-sans text-[10px] text-warning">
                    {item.recurringCount} recurring
                  </span>
                )}
                <span className="font-sans text-xs font-bold text-foreground">
                  {item.count}
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div
              className="relative h-2 overflow-hidden rounded bg-field"
            >
              {/* Main bar — grad-brand */}
              <div
                className="absolute left-0 top-0 h-full rounded bg-[image:var(--grad-brand)] transition-[width] duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                }}
              />
              {/* Recurring overlay — semi-transparent warning */}
              {item.recurringCount > 0 && (
                <div
                  className="absolute top-0 h-full rounded-r bg-[color-mix(in_srgb,hsl(var(--tw-warning))_45%,transparent)]"
                  style={{
                    left: `${pct - recurringPct * (pct / 100)}%`,
                    width: `${recurringPct * (pct / 100)}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div
        className="mt-1 flex gap-4 border-t border-border-subtle pt-3"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-5 rounded-[3px] bg-[image:var(--grad-brand)]" />
          <span className="font-sans text-[11px] text-foreground-tertiary">
            Total occurrences
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-5 rounded-[3px] bg-[color-mix(in_srgb,hsl(var(--tw-warning))_45%,transparent)]" />
          <span className="font-sans text-[11px] text-foreground-tertiary">
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
    if (rate >= 65) return CLR_WARNING;
    return CLR_DANGER;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((dept) => (
        <div key={dept.department}>
          {/* Row header */}
          <div
            className="mb-[7px] flex items-center justify-between"
          >
            <span className="font-sans text-[13px] font-medium text-foreground-secondary">
              {dept.department}
            </span>
            <div className="flex items-center gap-2.5">
              {dept.overdueCapas > 0 && (
                <span className="rounded-[var(--r-full)] bg-[var(--danger-soft)] px-1.5 py-px font-sans text-[10px] text-destructive">
                  {dept.overdueCapas} overdue
                </span>
              )}
              <span className="font-sans text-[10px] text-foreground-tertiary">
                {dept.openCapas} open
              </span>
              <span
                className="min-w-[38px] text-right font-sans text-[13px] font-bold"
                style={{
                  color: trackColor(dept.completionRate),
                }}
              >
                {dept.completionRate}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="h-1.5 overflow-hidden rounded-[3px] bg-field"
          >
            <div
              className="h-full rounded-[3px] transition-[width] duration-500 ease-out"
              style={{
                width: `${dept.completionRate}%`,
                background: trackColor(dept.completionRate),
              }}
            />
          </div>
        </div>
      ))}

      {/* Scale legend */}
      <div
        className="mt-1 flex flex-wrap gap-3.5 border-t border-border-subtle pt-3"
      >
        {[
          { color: CLR_SUCCESS, label: "≥ 80% on track" },
          { color: CLR_WARNING, label: "65–79% at risk" },
          { color: CLR_DANGER, label: "< 65% needs attention" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-[5px]">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                background: item.color,
              }}
            />
            <span className="font-sans text-[11px] text-foreground-tertiary">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recurrence trend (line chart) — for SME / expert view ────────────────────

function RecurrenceTrendChart() {
  const raw = getRecurrenceTrend();
  const n = raw.length;
  const maxNew = Math.max(...raw.map((d) => d.newFindings));

  const W = 600;
  const H = 140;
  const PAD = { top: 16, right: 12, bottom: 32, left: 28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const toX = (i: number) => PAD.left + (i / (n - 1)) * cW;
  const toY = (v: number) => PAD.top + cH - (v / maxNew) * cH;

  const newPts = raw.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.newFindings).toFixed(1)}`).join(" ");
  const recurPts = raw.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.recurred).toFixed(1)}`).join(" ");
  const areaNew = `${newPts} L${toX(n - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;

  return (
    <div className="flex flex-col gap-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-label="Recurrence trend chart">
        <defs>
          <linearGradient id="recurFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CLR_PRIMARY} stopOpacity="0.18" />
            <stop offset="100%" stopColor={CLR_PRIMARY} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaNew} fill="url(#recurFill)" />
        <path d={newPts} fill="none" stroke={CLR_PRIMARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={recurPts} fill="none" stroke={CLR_WARNING} strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
        {raw.map((d, i) => i % 2 === 0 && (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill={CLR_FOREGROUND_FAINT}>
            {d.label.slice(0, 3)} {d.label.slice(-2)}
          </text>
        ))}
      </svg>
      <div className="flex gap-4 border-t border-border-subtle pt-3">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-5 rounded-[3px]" style={{ background: CLR_PRIMARY }} />
          <span className="font-sans text-[11px] text-foreground-tertiary">Total findings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[1px] w-5 border-t-2 border-dashed" style={{ borderColor: CLR_WARNING }} />
          <span className="font-sans text-[11px] text-foreground-tertiary">Recurrences</span>
        </div>
      </div>
    </div>
  );
}

// ── Latest findings list — for QA officer / operator views ───────────────────

function LatestFindingsList({ limit = 4 }: { limit?: number }) {
  const { data: allFindings = [] } = useFindings();
  const findings = [...allFindings]
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, limit);
  const severityColor: Record<string, string> = {
    Minor: CLR_PRIMARY,
    Major: CLR_WARNING,
    Critical: CLR_DANGER,
  };
  return (
    <div className="flex flex-col divide-y divide-border/50">
      {findings.map((f) => (
        <Link key={f.id} to={`/findings/${f.id}`} className="flex items-center gap-3 py-2.5 no-underline hover:opacity-80">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: severityColor[f.severity] ?? CLR_FOREGROUND_TERTIARY }}
          />
          <span className="flex-1 truncate font-sans text-[13px] text-foreground-secondary">{f.shortDescription}</span>
          <span className="shrink-0 font-sans text-[11px] text-foreground-faint">{f.severity}</span>
        </Link>
      ))}
    </div>
  );
}

// ── My department summary — for operator view ─────────────────────────────────

function MyDeptSummary({ department }: { department: string }) {
  const all = getDepartmentHeatmap();
  const dept = all.find((d) => department.includes(d.department)) ?? all[0];

  function color(rate: number) {
    if (rate >= 80) return CLR_SUCCESS;
    if (rate >= 65) return CLR_WARNING;
    return CLR_DANGER;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm font-medium text-foreground-secondary">{dept.department}</span>
        <span className="font-sans text-2xl font-bold" style={{ color: color(dept.completionRate) }}>
          {dept.completionRate}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-field">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${dept.completionRate}%`, background: color(dept.completionRate) }}
        />
      </div>
      <div className="flex gap-4 text-xs text-foreground-tertiary">
        <span>{dept.openCapas} open CAPA{dept.openCapas !== 1 ? "s" : ""}</span>
        {dept.overdueCapas > 0 && (
          <span className="text-destructive">{dept.overdueCapas} overdue</span>
        )}
      </div>
    </div>
  );
}

// ── Role → dashboard mode mapping ─────────────────────────────────────────────

type DashboardMode = "executive" | "qa_officer" | "dept_head" | "operator" | "expert";

const ROLE_CONFIG: Record<string, { mode: DashboardMode; title: string; subtitle: (range: string) => string }> = {
  head_of_qa: {
    mode: "executive",
    title: "Dashboard",
    subtitle: (r) => `QA performance overview for ${r}.`,
  },
  qa_deviation: {
    mode: "qa_officer",
    title: "QA Operations",
    subtitle: (r) => `Findings and CAPA status across all types for ${r}.`,
  },
  head_of_dept: {
    mode: "dept_head",
    title: "Department Overview",
    subtitle: (r) => `Closure rate and open items for your departments — ${r}.`,
  },
  initiator: {
    mode: "operator",
    title: "My Activity",
    subtitle: () => "Your open actions and department CAPA status.",
  },
  sme: {
    mode: "expert",
    title: "Quality Insights",
    subtitle: (r) => `Root cause patterns and recurrence trends for ${r}.`,
  },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: stats } = useDashboard();
  const [range, setRange] = useState<RangeOption>("This Month");
  const persona = usePersonaStore((s) => s.activePersona());
  const { mode, title, subtitle } = ROLE_CONFIG[persona.id] ?? ROLE_CONFIG.head_of_qa;

  const twoCol = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-3.5";
  const kpiGrid = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5";

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 font-sans text-4xl font-bold tracking-[-0.02em] text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 font-sans text-sm text-foreground-secondary">
            {subtitle(range.toLowerCase())}
          </p>
        </div>
        {mode !== "operator" && <DateRangeSelector value={range} onChange={setRange} />}
      </div>

      {/* ── EXECUTIVE (Head of QA) — full strategic view ──────────────── */}
      {mode === "executive" && (
        <>
          <div className={kpiGrid}>
            <KpiCard eyebrow="Findings MTD" metric={stats?.totalFindingsMTD ?? "—"} caption="Deviations, audits, complaints" to="/findings" />
            <KpiCard eyebrow="Open CAPAs" metric={stats?.openCapas ?? "—"} caption="Across all active statuses" to="/capa/list" />
            <KpiCard eyebrow="Overdue CAPAs" metric={stats?.overdueCapas ?? "—"} caption="Past target closure date" to="/capa/list" gradientBorder />
            <KpiCard eyebrow="Effectiveness rate" metric={stats ? `${stats.effectivenessRate}%` : "—"} caption="Verified CAPA effectiveness" to="/capa/list" />
          </div>
          <div className={twoCol}>
            <Card eyebrow="Trend" title="Finding trend" subtitle="Total findings per month — last 12 months">
              <FindingTrendChart />
            </Card>
            <Card eyebrow="Breakdown" title="Breakdown by type" subtitle="Distribution of open findings by source">
              <TypeDonutChart />
            </Card>
          </div>
          <div className={twoCol}>
            <Card eyebrow="Root cause" title="Top root cause categories" subtitle="Occurrences this period — orange band indicates recurring pattern">
              <RootCauseBarChart />
            </Card>
            <Card eyebrow="Departments" title="Completion heatmap" subtitle="CAPA closure rate by department">
              <DeptHeatmap />
            </Card>
          </div>
        </>
      )}

      {/* ── QA OFFICER — operational quality view ────────────────────── */}
      {mode === "qa_officer" && (
        <>
          <div className={kpiGrid}>
            <KpiCard eyebrow="Findings MTD" metric={stats?.totalFindingsMTD ?? "—"} caption="Deviations, audits, complaints" to="/findings" />
            <KpiCard eyebrow="Open CAPAs" metric={stats?.openCapas ?? "—"} caption="Requiring review or action" to="/capa/list" />
            <KpiCard eyebrow="Overdue CAPAs" metric={stats?.overdueCapas ?? "—"} caption="Past target closure date" to="/capa/list" gradientBorder />
            <KpiCard eyebrow="Effectiveness rate" metric={stats ? `${stats.effectivenessRate}%` : "—"} caption="Verified CAPA effectiveness" to="/capa/list" />
          </div>
          <div className={twoCol}>
            <Card eyebrow="Trend" title="Finding trend" subtitle="Total findings per month — last 12 months">
              <FindingTrendChart />
            </Card>
            <Card eyebrow="Breakdown" title="Breakdown by type" subtitle="Distribution of open findings by source">
              <TypeDonutChart />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            <Card eyebrow="Root cause" title="Top root cause categories" subtitle="Occurrences this period — orange band indicates recurring pattern">
              <RootCauseBarChart />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            <Card eyebrow="Recent" title="Latest findings" subtitle="Most recently reported across all sources">
              <LatestFindingsList limit={5} />
            </Card>
          </div>
        </>
      )}

      {/* ── DEPT HEAD — department-centric view ──────────────────────── */}
      {mode === "dept_head" && (
        <>
          <div className={kpiGrid}>
            <KpiCard eyebrow="Open CAPAs" metric={stats?.openCapas ?? "—"} caption="Across your departments" to="/capa/list" />
            <KpiCard eyebrow="Overdue CAPAs" metric={stats?.overdueCapas ?? "—"} caption="Past target closure date" to="/capa/list" gradientBorder />
            <KpiCard eyebrow="Effectiveness rate" metric={stats ? `${stats.effectivenessRate}%` : "—"} caption="Verified CAPA effectiveness" to="/capa/list" />
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            <Card eyebrow="Departments" title="Completion heatmap" subtitle="CAPA closure rate by department — your responsibility areas highlighted">
              <DeptHeatmap />
            </Card>
          </div>
          <div className={twoCol}>
            <Card eyebrow="Trend" title="Finding trend" subtitle="Total findings per month — last 12 months">
              <FindingTrendChart />
            </Card>
            <Card eyebrow="Root cause" title="Top root cause categories" subtitle="Occurrences this period">
              <RootCauseBarChart />
            </Card>
          </div>
        </>
      )}

      {/* ── OPERATOR — personal activity view ────────────────────────── */}
      {mode === "operator" && (
        <>
          <div className={cn(kpiGrid, "max-w-lg")}>
            <KpiCard eyebrow="Open CAPAs" metric={2} caption="Assigned to you" to="/capa/list" />
            <KpiCard eyebrow="Due this week" metric={1} caption="Upcoming deadlines" to="/" />
          </div>
          <div className={twoCol}>
            <Card eyebrow="Department" title="Fill-Finish completion" subtitle="CAPA closure status for your department">
              <MyDeptSummary department={persona.department} />
            </Card>
            <Card eyebrow="Recent" title="Latest findings" subtitle="Most recently reported in your area">
              <LatestFindingsList limit={4} />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            <Card eyebrow="Overview" title="Finding trend" subtitle="Total findings per month — last 12 months">
              <FindingTrendChart />
            </Card>
          </div>
        </>
      )}

      {/* ── EXPERT (SME) — root cause & recurrence focus ─────────────── */}
      {mode === "expert" && (
        <>
          <div className={cn(kpiGrid, "max-w-lg")}>
            <KpiCard eyebrow="Findings MTD" metric={stats?.totalFindingsMTD ?? "—"} caption="Across all types" to="/findings" />
            <KpiCard eyebrow="Effectiveness rate" metric={stats ? `${stats.effectivenessRate}%` : "—"} caption="Verified CAPA effectiveness" to="/capa/list" />
          </div>
          <div className={twoCol}>
            <Card eyebrow="Root cause" title="Top root cause categories" subtitle="Occurrences this period — orange band indicates recurring pattern">
              <RootCauseBarChart />
            </Card>
            <Card eyebrow="Breakdown" title="Breakdown by type" subtitle="Distribution of open findings by source">
              <TypeDonutChart />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            <Card eyebrow="Recurrence" title="Recurrence trend" subtitle="New findings vs recurrences per month — last 12 months">
              <RecurrenceTrendChart />
            </Card>
          </div>
        </>
      )}

    </div>
  );
}
