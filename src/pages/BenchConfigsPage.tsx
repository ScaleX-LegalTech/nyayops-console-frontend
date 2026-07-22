import { useEffect, useState } from "react";
import { api, type BenchConfig } from "@/lib/api";

export function BenchConfigsPage() {
  const [configs, setConfigs] = useState<BenchConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function refresh() {
    try {
      const { configs } = await api.listBenchConfigs();
      setConfigs(configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bench configs");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggle(c: BenchConfig, field: "enabled" | "fetch_civil" | "fetch_criminal") {
    const key = `${c.court_type}:${c.bench_key}`;
    setBusyKey(key);
    setError(null);
    try {
      await api.upsertBenchConfig({ ...c, [field]: !c[field] });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Bench Configs</h1>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Bench</th>
              <th className="p-3">Court</th>
              <th className="p-3">Enabled</th>
              <th className="p-3">Civil</th>
              <th className="p-3">Criminal</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => {
              const key = `${c.court_type}:${c.bench_key}`;
              const busy = busyKey === key;
              return (
                <tr key={key} className="border-t border-slate-100">
                  <td className="p-3">{c.bench_key}</td>
                  <td className="p-3 text-slate-500">{c.court_type}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={c.enabled}
                      disabled={busy}
                      onChange={() => toggle(c, "enabled")}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={c.fetch_civil}
                      disabled={busy}
                      onChange={() => toggle(c, "fetch_civil")}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={c.fetch_criminal}
                      disabled={busy}
                      onChange={() => toggle(c, "fetch_criminal")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
