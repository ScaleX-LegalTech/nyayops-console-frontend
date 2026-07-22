import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const SERVICES = ["backend", "cde"];
const WINDOWS = ["1h", "6h", "24h", "7d"];

export function MonitoringPage() {
  const [service, setService] = useState("backend");
  const [series, setSeries] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [window, setWindowValue] = useState("1h");
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .metricsSeries(service)
      .then((res) => {
        setSeries(res.series);
        setSelectedSeries(res.series[0] ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load series"));
  }, [service]);

  useEffect(() => {
    if (!selectedSeries) return;
    api
      .metricsQuery(service, selectedSeries, window)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to query metrics"));
  }, [service, selectedSeries, window]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Monitoring</h1>
      <div className="flex gap-4 mb-6">
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
        >
          {series.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={window}
          onChange={(e) => setWindowValue(e.target.value)}
        >
          {WINDOWS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <pre className="text-xs bg-white border border-slate-200 rounded-lg p-4 overflow-auto max-h-[70vh]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
