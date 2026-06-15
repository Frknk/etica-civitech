import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Slice } from "../../lib/stats";

/* Paleta del proyecto (src/index.css). */
const PINE_600 = "#1b5e43";
const PINE_400 = "#3fa66a";
const PINE_200 = "#a9cbb6";
const AMBER = "#e0a33e";
const CLAY = "#b5532f";
const INK_SOFT = "#3b4a42";
const LINE = "#e3e0d6";

/** Secuencia de color para series categóricas. */
export const SERIES = [PINE_600, AMBER, CLAY, PINE_400, PINE_200];

const axisProps = {
  stroke: INK_SOFT,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  tickLine: false,
};

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <span className="eyebrow">{title}</span>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4 h-56">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: `1px solid ${LINE}`,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
  },
};

/** Barras horizontales — bueno para categorías con etiquetas largas. */
export function BarChartCard({
  title,
  hint,
  data,
  color = PINE_600,
  unit,
}: {
  title: string;
  hint?: string;
  data: Slice[];
  color?: string;
  unit?: string;
}) {
  return (
    <ChartCard title={title} hint={hint}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            {...axisProps}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [`${v}${unit ? ` ${unit}` : ""}`, ""]}
            cursor={{ fill: "rgba(27,94,67,0.06)" }}
          />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Dona — bueno para proporciones (anónimos, evidencia). */
export function DonutChartCard({
  title,
  hint,
  data,
  colors = SERIES,
}: {
  title: string;
  hint?: string;
  data: Slice[];
  colors?: string[];
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <ChartCard title={title} hint={hint}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={d.id} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(v, name) => {
              const n = Number(v);
              return [
                `${n} (${total > 0 ? Math.round((n / total) * 100) : 0}%)`,
                name,
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <Legend data={data} colors={colors} />
    </ChartCard>
  );
}

function Legend({ data, colors }: { data: Slice[]; colors: string[] }) {
  return (
    <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {data.map((d, i) => (
        <li key={d.id} className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          {d.label}
        </li>
      ))}
    </ul>
  );
}

/** Área — tendencia temporal de reportes. */
export function TrendChartCard({
  title,
  hint,
  data,
}: {
  title: string;
  hint?: string;
  data: { day: string; value: number }[];
}) {
  return (
    <ChartCard title={title} hint={hint}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -16, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PINE_400} stopOpacity={0.35} />
              <stop offset="100%" stopColor={PINE_400} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={PINE_600}
            strokeWidth={2}
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
