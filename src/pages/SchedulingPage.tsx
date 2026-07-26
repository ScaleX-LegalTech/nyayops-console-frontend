import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type JobSchedule, type RegionConfig } from "@/lib/api";

function useJobSchedules() {
  const [items, setItems] = useState<JobSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  async function refetch() {
    setLoading(true);
    try {
      const { items } = await api.listJobSchedules();
      setItems(items);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refetch();
  }, []);
  return { items, loading, refetch };
}

function useRegionConfigs() {
  const [items, setItems] = useState<RegionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  async function refetch() {
    setLoading(true);
    try {
      const { items } = await api.listRegionConfigs();
      setItems(items);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refetch();
  }, []);
  return { items, loading, refetch };
}

function JobSchedulesCard() {
  const schedules = useJobSchedules();
  const [busyTask, setBusyTask] = useState<string | null>(null);

  async function toggle(schedule: JobSchedule) {
    setBusyTask(schedule.task_name);
    try {
      await api.updateJobSchedule(schedule.task_name, { enabled: !schedule.enabled });
      await schedules.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyTask(null);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Job Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Minutes</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.items.map((s) => (
              <TableRow key={s.task_name}>
                <TableCell className="font-mono text-sm">{s.task_name}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={s.enabled}
                    disabled={busyTask === s.task_name}
                    onCheckedChange={() => toggle(s)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.hours ? s.hours.join(", ") : "every hour"}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.minutes.join(", ")}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(s.updated_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RegionConfigsCard() {
  const configs = useRegionConfigs();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [form, setForm] = useState({ court_type: "", state_code: "" });

  async function toggle(c: RegionConfig) {
    const key = `${c.court_type}:${c.state_code}`;
    setBusyKey(key);
    try {
      await api.upsertRegionConfig({ ...c, enabled: !c.enabled });
      await configs.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitNew(e: FormEvent) {
    e.preventDefault();
    try {
      await api.upsertRegionConfig({ ...form, enabled: false });
      toast.success("Region disabled");
      setForm({ court_type: "", state_code: "" });
      await configs.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Region Configs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Opt-out model — no row for a state means it's enabled. Add a row here only to
          disable one.
        </p>
        <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={submitNew}>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Court type</label>
            <Input
              required
              value={form.court_type}
              onChange={(e) => setForm({ ...form, court_type: e.target.value })}
              placeholder="district_court"
              className="w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">State code</label>
            <Input
              required
              value={form.state_code}
              onChange={(e) => setForm({ ...form, state_code: e.target.value })}
              placeholder="e.g. 1 (Maharashtra)"
              className="w-40"
            />
          </div>
          <Button type="submit" variant="destructive">
            Disable region
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Court type</TableHead>
              <TableHead>State code</TableHead>
              <TableHead>Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.items.map((c) => {
              const key = `${c.court_type}:${c.state_code}`;
              return (
                <TableRow key={key}>
                  <TableCell>{c.court_type}</TableCell>
                  <TableCell>{c.state_code}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={c.enabled}
                      disabled={busyKey === key}
                      onCheckedChange={() => toggle(c)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TriggerCard() {
  const [form, setForm] = useState({
    court_type: "high_court",
    cause_list_date: "",
    bench_key: "",
    court_name_code: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.triggerCauseListFetch({
        court_type: form.court_type,
        cause_list_date: form.cause_list_date,
        bench_key: form.court_type === "high_court" ? form.bench_key : undefined,
        court_name_code: form.court_type === "district_court" ? form.court_name_code : undefined,
      });
      toast.success("Fetch enqueued");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Trigger failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual Refresh</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Bypasses schedule/region gating entirely — enqueues one bench/court's fetch
          immediately.
        </p>
        <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Court type</label>
            <select
              className="h-9 w-40 rounded-md border bg-background px-3 text-sm"
              value={form.court_type}
              onChange={(e) => setForm({ ...form, court_type: e.target.value })}
            >
              <option value="high_court">high_court</option>
              <option value="district_court">district_court</option>
            </select>
          </div>
          {form.court_type === "high_court" ? (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bench key</label>
              <Input
                required
                value={form.bench_key}
                onChange={(e) => setForm({ ...form, bench_key: e.target.value })}
                placeholder="bombay_mumbai"
                className="w-44"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Court name code</label>
              <Input
                required
                value={form.court_name_code}
                onChange={(e) => setForm({ ...form, court_name_code: e.target.value })}
                className="w-44"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Cause-list date</label>
            <Input
              required
              type="date"
              value={form.cause_list_date}
              onChange={(e) => setForm({ ...form, cause_list_date: e.target.value })}
              className="w-40"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Enqueuing…" : "Refresh now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SchedulingPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Scheduling</h1>
      <JobSchedulesCard />
      <RegionConfigsCard />
      <TriggerCard />
    </div>
  );
}
