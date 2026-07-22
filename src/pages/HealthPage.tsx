import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type HealthResult = Record<string, { status: string; [k: string]: unknown }>;

export function HealthPage() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const result = await api.health();
        if (!cancelled) setHealth(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load health");
      }
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Health</h1>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        {health &&
          Object.entries(health).map(([service, result]) => (
            <div key={service} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{service}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    result.status === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.status}
                </span>
              </div>
              <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
      </div>
    </div>
  );
}
