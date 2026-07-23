import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ServiceSection } from "@/components/ServiceSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { humanizeSnake } from "@/lib/format";
import { usePaginatedList } from "@/lib/pagination";

type ServiceHealth = { status: string; [k: string]: unknown };

function humanLabel(key: string): string {
  return humanizeSnake(key.replace(/_ok$|_alive$/, ""));
}

function ServiceCard({ health }: { health: ServiceHealth }) {
  const boolEntries = Object.entries(health).filter(
    ([k, v]) => (k.endsWith("_ok") || k.endsWith("_alive")) && typeof v === "boolean",
  );
  const statEntries = Object.entries(health).filter(
    ([k, v]) => (typeof v === "number" || v === null) && (k.includes("depth") || k.includes("failures")),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Dependencies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {boolEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
              <span className="text-muted-foreground">{humanLabel(key)}</span>
              <Badge variant={value ? "success" : "destructive"}>{value ? "up" : "down"}</Badge>
            </div>
          ))}
        </div>
        {statEntries.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {statEntries.map(([key, value]) => (
              <div key={key} className="rounded-md border px-2 py-2 text-center">
                <div className="text-lg font-semibold">{value === null ? "—" : String(value)}</div>
                <div className="text-xs text-muted-foreground">{humanLabel(key)}</div>
              </div>
            ))}
          </div>
        )}
        {typeof health.worker_health_check_raw === "string" && (
          <div className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
            {health.worker_health_check_raw}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JobsTable() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [adapterFilter, setAdapterFilter] = useState<string>("");
  const jobs = usePaginatedList(
    ["jobs", statusFilter, adapterFilter],
    (limit, offset) =>
      api.listJobs({ status: statusFilter || undefined, adapter: adapterFilter || undefined, limit, offset }),
    25,
  );

  return (
    <div className="mt-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent jobs</h3>
      <div className="mb-3 flex gap-2">
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); jobs.reset(); }}>
          <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={adapterFilter || "all"} onValueChange={(v) => { setAdapterFilter(v === "all" ? "" : v); jobs.reset(); }}>
          <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All adapters" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All adapters</SelectItem>
            <SelectItem value="order_download">Order download</SelectItem>
            <SelectItem value="case_sync">Case sync</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Adapter</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.items.map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <Badge variant={j.status === "failed" ? "destructive" : j.status === "complete" ? "success" : "secondary"}>
                    {j.status}
                  </Badge>
                </TableCell>
                <TableCell>{humanizeSnake(j.adapter)}</TableCell>
                <TableCell>{j.attempts}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">{j.last_error ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(j.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">
                  {j.completed_at ? new Date(j.completed_at).toLocaleString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar offset={jobs.offset} count={jobs.items.length} hasMore={jobs.hasMore} onPrev={jobs.prev} onNext={jobs.next} />
      </div>
    </div>
  );
}

export function HealthPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api.health(),
    refetchInterval: 15_000,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const activeService = searchParams.get("service");

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Health</h1>
      <div className="space-y-6">
        {health.data &&
          Object.entries(health.data).map(([service, h], i) => (
            // Open section driven by the sidebar's Main/CDE sub-links (?service=...);
            // falls back to "first section only" otherwise (JobsTable's paginated query
            // only fires once the CDE section is actually open).
            <ServiceSection
              key={service}
              service={service}
              status={h.status}
              open={activeService ? activeService === service : i === 0}
              onOpenChange={(isOpen) => {
                setSearchParams(isOpen ? { service } : {}, { replace: true });
              }}
            >
              <ServiceCard health={h} />
              {service === "cde" && <JobsTable />}
            </ServiceSection>
          ))}
      </div>
    </div>
  );
}
