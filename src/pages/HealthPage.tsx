import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import { usePaginatedList } from "@/lib/pagination";

type ServiceHealth = { status: string; [k: string]: unknown };

function humanLabel(key: string): string {
  return key
    .replace(/_ok$|_alive$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ServiceCard({ name, health }: { name: string; health: ServiceHealth }) {
  const boolEntries = Object.entries(health).filter(
    ([k, v]) => (k.endsWith("_ok") || k.endsWith("_alive")) && typeof v === "boolean",
  );
  const statEntries = Object.entries(health).filter(
    ([k, v]) => (typeof v === "number" || v === null) && (k.includes("depth") || k.includes("failures")),
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base capitalize">{name}</CardTitle>
        <Badge variant={health.status === "ok" ? "success" : "destructive"}>{health.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
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

export function HealthPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api.health(),
    refetchInterval: 15_000,
  });

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [adapterFilter, setAdapterFilter] = useState<string>("");
  const jobs = usePaginatedList(
    ["jobs", statusFilter, adapterFilter],
    (limit, offset) => api.listJobs({ status: statusFilter || undefined, adapter: adapterFilter || undefined, limit, offset }),
    25,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-6 text-xl font-semibold">Health</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {health.data &&
            Object.entries(health.data).map(([service, h]) => (
              <ServiceCard key={service} name={service} health={h} />
            ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">CDE recent jobs</h2>
        <div className="mb-3 flex gap-2">
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); jobs.reset(); }}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="queued">queued</SelectItem>
              <SelectItem value="running">running</SelectItem>
              <SelectItem value="completed">completed</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={adapterFilter || "all"} onValueChange={(v) => { setAdapterFilter(v === "all" ? "" : v); jobs.reset(); }}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All adapters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All adapters</SelectItem>
              <SelectItem value="order_download">order_download</SelectItem>
              <SelectItem value="case_sync">case_sync</SelectItem>
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
                    <Badge variant={j.status === "failed" ? "destructive" : j.status === "completed" ? "success" : "secondary"}>
                      {j.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{j.adapter}</TableCell>
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
          <PaginationBar
            offset={jobs.offset}
            count={jobs.items.length}
            hasMore={jobs.hasMore}
            onPrev={jobs.prev}
            onNext={jobs.next}
          />
        </div>
      </div>
    </div>
  );
}
