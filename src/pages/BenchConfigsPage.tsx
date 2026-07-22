import { Fragment, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type BenchConfig } from "@/lib/api";
import { benchDisplay } from "@/lib/benches";
import { usePaginatedList } from "@/lib/pagination";

function groupByCourt(items: BenchConfig[]) {
  const groups = new Map<string, BenchConfig[]>();
  for (const c of items) {
    const group = benchDisplay(c.bench_key).courtGroup;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(c);
  }
  return groups;
}

const emptyForm = {
  court_type: "",
  bench_key: "",
  court_name_code: "",
  enabled: true,
  fetch_civil: true,
  fetch_criminal: true,
};

export function BenchConfigsPage() {
  const list = usePaginatedList(
    ["bench-configs"],
    (limit, offset) => api.listBenchConfigs(undefined, limit, offset),
    100,
  );
  const [form, setForm] = useState(emptyForm);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const grouped = useMemo(() => groupByCourt(list.items), [list.items]);

  async function toggle(c: BenchConfig, field: "enabled" | "fetch_civil" | "fetch_criminal") {
    const key = `${c.court_type}:${c.bench_key}`;
    setBusyKey(key);
    try {
      await api.upsertBenchConfig({ ...c, [field]: !c[field] });
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitNew(e: FormEvent) {
    e.preventDefault();
    try {
      await api.upsertBenchConfig({
        ...form,
        court_name_code: form.court_name_code || null,
      });
      toast.success("Bench config saved");
      setForm(emptyForm);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Bench Configs</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Add / update a config</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={submitNew}>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Court type</label>
              <Input
                required
                value={form.court_type}
                onChange={(e) => setForm({ ...form, court_type: e.target.value })}
                placeholder="high_court"
                className="w-36"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bench key</label>
              <Input
                required
                value={form.bench_key}
                onChange={(e) => setForm({ ...form, bench_key: e.target.value })}
                placeholder="bombay_mumbai"
                className="w-40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Court name code</label>
              <Input
                value={form.court_name_code}
                onChange={(e) => setForm({ ...form, court_name_code: e.target.value })}
                placeholder="(district only)"
                className="w-40"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: !!v })}
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.fetch_civil}
                onCheckedChange={(v) => setForm({ ...form, fetch_civil: !!v })}
              />
              Civil
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.fetch_criminal}
                onCheckedChange={(v) => setForm({ ...form, fetch_criminal: !!v })}
              />
              Criminal
            </label>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bench</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Civil</TableHead>
              <TableHead>Criminal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(grouped.entries()).map(([courtGroup, configs]) => (
              <Fragment key={courtGroup}>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={5} className="py-1.5 text-xs font-semibold text-muted-foreground">
                    {courtGroup}
                  </TableCell>
                </TableRow>
                {configs.map((c) => {
                  const key = `${c.court_type}:${c.bench_key}`;
                  const busy = busyKey === key;
                  const bench = benchDisplay(c.bench_key);
                  return (
                    <TableRow key={key}>
                      <TableCell>{bench.label}</TableCell>
                      <TableCell className="text-muted-foreground">{c.court_type}</TableCell>
                      <TableCell>
                        <Checkbox checked={c.enabled} disabled={busy} onCheckedChange={() => toggle(c, "enabled")} />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={c.fetch_civil}
                          disabled={busy}
                          onCheckedChange={() => toggle(c, "fetch_civil")}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={c.fetch_criminal}
                          disabled={busy}
                          onCheckedChange={() => toggle(c, "fetch_criminal")}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <PaginationBar
          offset={list.offset}
          count={list.items.length}
          hasMore={list.hasMore}
          onPrev={list.prev}
          onNext={list.next}
        />
      </div>
    </div>
  );
}
