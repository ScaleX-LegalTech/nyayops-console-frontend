import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/DatePicker";
import { DistrictCourtCascadeSelect, useCourtDirectory } from "@/components/DistrictCourtCascadeSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type JobSchedule } from "@/lib/api";
import { KNOWN_BENCHES } from "@/lib/benches";

// One-line summary of what each dynamic job actually does -- sourced from each job's
// own docstring in extraction/cause_list/jobs/*.py (CDE repo), condensed for the ops
// console rather than copied verbatim.
const TASK_DESCRIPTIONS: Record<string, string> = {
  case_type_sync: "Refreshes each High Court bench's case-type dropdown options.",
  cause_list_fetch_sweep:
    "Fetches T+1..T+7 cause lists for every enabled High Court bench; re-checks a bench until its list stops changing.",
  cause_list_retention_purge: "Deletes cause-list documents/entries outside the retention window.",
  cause_list_t1_recheck: "Extra same-day recheck of just T+1/T+2 High Court lists, catching late changes.",
  cnr_discovery_sweep: "Resolves unmatched cause-list rows into real cases via live CNR search.",
  court_directory_sync: "Walks the District Court portal's state/district/complex/court-name hierarchy.",
  district_cause_list_fetch_sweep: "Fetches T+1..T+7 cause lists for every enrolled District Court.",
  retro_link_sweep: "Retroactively links previously-unmatched cause-list entries to cases added since.",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const COURT_TYPES = ["high_court", "district_court"] as const;

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

function HourMinuteEditor({
  schedule,
  onSaved,
}: {
  schedule: JobSchedule;
  onSaved: () => Promise<void>;
}) {
  const [everyHour, setEveryHour] = useState(schedule.hours === null);
  const [hours, setHours] = useState<Set<number>>(new Set(schedule.hours ?? []));
  const [minutes, setMinutes] = useState<Set<number>>(new Set(schedule.minutes));
  const [saving, setSaving] = useState(false);

  function toggle(set: Set<number>, setSet: (s: Set<number>) => void, n: number) {
    const next = new Set(set);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setSet(next);
  }

  async function save() {
    if (!everyHour && hours.size === 0) {
      toast.error("Pick at least one hour, or choose \"every hour\"");
      return;
    }
    if (minutes.size === 0) {
      toast.error("Pick at least one minute");
      return;
    }
    setSaving(true);
    try {
      await api.updateJobSchedule(schedule.task_name, {
        hours: everyHour ? null : Array.from(hours).sort((a, b) => a - b),
        minutes: Array.from(minutes).sort((a, b) => a - b),
      });
      await onSaved();
      toast.success("Schedule updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-left hover:underline">
          {schedule.hours ? schedule.hours.join(", ") : "every hour"} @ {schedule.minutes.join(", ")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="start">
        <div>
          <label className="mb-1 flex items-center gap-2 text-xs font-medium">
            <Checkbox checked={everyHour} onCheckedChange={(v) => setEveryHour(!!v)} />
            Every hour
          </label>
          {!everyHour && (
            <div className="grid grid-cols-6 gap-1">
              {HOURS.map((h) => (
                <label key={h} className="flex items-center gap-1 text-xs">
                  <Checkbox checked={hours.has(h)} onCheckedChange={() => toggle(hours, setHours, h)} />
                  {h}
                </label>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium">Minutes</p>
          <div className="flex gap-3">
            {MINUTES.map((m) => (
              <label key={m} className="flex items-center gap-1 text-xs">
                <Checkbox checked={minutes.has(m)} onCheckedChange={() => toggle(minutes, setMinutes, m)} />
                {m}
              </label>
            ))}
          </div>
        </div>
        <Button size="sm" className="w-full" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </PopoverContent>
    </Popover>
  );
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
              <TableHead>Schedule</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.items.map((s) => (
              <TableRow key={s.task_name}>
                <TableCell>
                  <span className="font-mono text-sm">{s.task_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {TASK_DESCRIPTIONS[s.task_name] ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={s.enabled}
                    disabled={busyTask === s.task_name}
                    onCheckedChange={() => toggle(s)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <HourMinuteEditor schedule={s} onSaved={schedules.refetch} />
                </TableCell>
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

function TriggerCard() {
  const { entries: courtDirectory } = useCourtDirectory();
  const [courtType, setCourtType] = useState<(typeof COURT_TYPES)[number]>("high_court");
  const [causeListDate, setCauseListDate] = useState("");
  const [benchKey, setBenchKey] = useState("");
  const [district, setDistrict] = useState({ stateCode: "", districtCode: "", complexCode: "", courtNameCode: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!causeListDate) {
      toast.error("Pick a cause-list date");
      return;
    }
    if (courtType === "high_court" && !benchKey) {
      toast.error("Pick a bench");
      return;
    }
    if (courtType === "district_court" && !district.courtNameCode) {
      toast.error("Pick a court");
      return;
    }
    setBusy(true);
    try {
      await api.triggerCauseListFetch({
        court_type: courtType,
        cause_list_date: causeListDate,
        bench_key: courtType === "high_court" ? benchKey : undefined,
        court_name_code: courtType === "district_court" ? district.courtNameCode : undefined,
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
            <Select value={courtType} onValueChange={(v) => setCourtType(v as (typeof COURT_TYPES)[number])}>
              <SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COURT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {courtType === "high_court" ? (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bench</label>
              <Select value={benchKey || undefined} onValueChange={setBenchKey}>
                <SelectTrigger size="sm" className="w-56"><SelectValue placeholder="Select bench" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KNOWN_BENCHES).map(([key, b]) => (
                    <SelectItem key={key} value={key}>{b.courtGroup} — {b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <DistrictCourtCascadeSelect entries={courtDirectory} {...district} onChange={setDistrict} />
          )}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Cause-list date</label>
            <DatePicker value={causeListDate} onChange={setCauseListDate} />
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
      <TriggerCard />
    </div>
  );
}
