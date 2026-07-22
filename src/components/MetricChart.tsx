import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

// Curated, mutually-distinguishable line colors instead of an hsl() rotation (which
// produces muddy/similar tones on charts with many series) — same palette approach as
// the old platform-admin-dashboard's MonitoringPage.tsx.
const LINE_COLORS = [
  "#2563EB",
  "#F59E0B",
  "#16A34A",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
  "#EA580C",
  "#4F46E5",
];

interface PrometheusMatrixResult {
  resultType: string;
  result: { metric: Record<string, string>; values: [number, string][] }[];
}

function toChartData(data: PrometheusMatrixResult | undefined) {
  if (!data || data.result.length === 0) return [];
  const byTime = new Map<number, Record<string, number | string>>();
  for (const series of data.result) {
    const label = Object.values(series.metric).join("/") || "value";
    for (const [ts, value] of series.values) {
      const row = byTime.get(ts) ?? { time: new Date(ts * 1000).toLocaleTimeString() };
      row[label] = Number(value);
      byTime.set(ts, row);
    }
  }
  return Array.from(byTime.values());
}

// Recharts' default <Legend> wraps onto as many lines as it needs, which for a
// many-path series eats vertical space the chart should get — render a single-line,
// horizontally-scrollable strip instead.
function CompactLegend(props: { payload?: { value: string; color: string }[] }) {
  const items = props.payload ?? [];
  if (items.length === 0) return null;
  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-thin whitespace-nowrap px-1 pb-1 text-[11px]"
      style={{ scrollbarWidth: "thin" }}
    >
      {items.map((entry) => (
        <span key={entry.value} className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
          <span className="inline-block h-[2px] w-3 shrink-0 rounded" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

interface MetricChartProps {
  title: string;
  service: string;
  series: string;
  window: string;
  tall?: boolean;
}

export function MetricChart({ title, service, series, window, tall }: MetricChartProps) {
  const query = useQuery({
    queryKey: ["metrics", service, series, window],
    queryFn: () =>
      api.metricsQuery(service, series, window) as Promise<PrometheusMatrixResult>,
    refetchInterval: 30_000,
  });

  const chartData = toChartData(query.data);
  const labels = chartData.length > 0 ? Object.keys(chartData[0]).filter((k) => k !== "time") : [];

  return (
    <Card className={tall ? "h-[26rem] p-4" : "h-72 p-4"}>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {query.isLoading ? "Loading..." : "No data yet"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              wrapperClassName="!bg-popover !text-popover-foreground !border-border"
            />
            <Legend content={<CompactLegend />} height={20} />
            {labels.map((label, i) => (
              <Line
                key={label}
                type="monotone"
                dataKey={label}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
