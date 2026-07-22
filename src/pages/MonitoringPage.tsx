import { useState } from "react";
import { MetricChart } from "@/components/MetricChart";
import { ServiceSection } from "@/components/ServiceSection";
import { Button } from "@/components/ui/button";

const SERIES: Record<string, { key: string; label: string }[]> = {
  backend: [
    { key: "http_latency_p95", label: "API HTTP latency p95, by path" },
    { key: "db_query_latency_p95", label: "DB query latency p95" },
    { key: "celery_task_duration_p95", label: "Celery task duration p95, by task" },
    { key: "celery_failure_rate", label: "Celery task failure rate, by task" },
  ],
  cde: [
    { key: "job_age_p95", label: "Job age p95 (queue wait + fetch), by adapter" },
    { key: "adapter_fetch_latency_p95", label: "Adapter fetch latency p95 (portal round-trip)" },
    { key: "http_latency_p95", label: "API HTTP latency p95, by path" },
    { key: "parser_success_rate", label: "Parser success rate, by adapter" },
    { key: "captcha_success_rate", label: "Captcha success rate, by adapter" },
  ],
};

const WINDOWS = ["1h", "6h", "24h", "7d"] as const;

export function MonitoringPage() {
  const [window, setWindow] = useState<(typeof WINDOWS)[number]>("6h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Monitoring</h1>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <Button key={w} size="sm" variant={w === window ? "default" : "outline"} onClick={() => setWindow(w)}>
              {w}
            </Button>
          ))}
        </div>
      </div>

      {Object.entries(SERIES).map(([service, seriesList], i) => (
        // Only the first section's charts mount by default - keeps the initial load to
        // one service's worth of simultaneous chart queries instead of firing all 9 at
        // once (confirmed live: 9 concurrent /metrics/query calls on mount was a real
        // source of the reported lag).
        <ServiceSection key={service} service={service} defaultOpen={i === 0}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {seriesList.map((s) => (
              <MetricChart key={s.key} title={s.label} service={service} series={s.key} window={window} />
            ))}
          </div>
        </ServiceSection>
      ))}
    </div>
  );
}
