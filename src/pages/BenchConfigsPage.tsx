import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DistrictCourtCascadeSelect, useCourtDirectory } from "@/components/DistrictCourtCascadeSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationBar } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type BenchConfig, type RegionConfig } from "@/lib/api";
import { benchDisplay, KNOWN_BENCHES } from "@/lib/benches";
import { usePaginatedList } from "@/lib/pagination";

const COURT_TYPES = ["high_court", "district_court"] as const;

function groupByCourt(items: BenchConfig[]) {
  const groups = new Map<string, BenchConfig[]>();
  for (const c of items) {
    const group = c.court_type === "high_court" ? benchDisplay(c.bench_key).courtGroup : "District Court";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(c);
  }
  return groups;
}

const emptyForm = {
  court_type: "high_court" as (typeof COURT_TYPES)[number],
  bench_key: "",
  court_name_code: "",
  enabled: true,
  fetch_civil: true,
  fetch_criminal: true,
};

function BenchConfigsCard() {
  const list = usePaginatedList(
    ["bench-configs"],
    (limit, offset) => api.listBenchConfigs(undefined, limit, offset),
    100,
  );
  const { entries: courtDirectory } = useCourtDirectory();
  const [form, setForm] = useState(emptyForm);
  const [district, setDistrict] = useState({ stateCode: "", districtCode: "", complexCode: "", courtNameCode: "" });
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
    const isDistrict = form.court_type === "district_court";
    if (isDistrict && !district.courtNameCode) {
      toast.error("Pick a court");
      return;
    }
    try {
      await api.upsertBenchConfig({
        ...form,
        bench_key: isDistrict ? district.courtNameCode : form.bench_key,
        court_name_code: isDistrict ? district.courtNameCode : null,
      });
      toast.success("Bench config saved");
      setForm(emptyForm);
      setDistrict({ stateCode: "", districtCode: "", complexCode: "", courtNameCode: "" });
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Add / update a config</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-wrap items-end gap-3" onSubmit={submitNew}>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Court type</label>
            <Select
              value={form.court_type}
              onValueChange={(v) => setForm({ ...form, court_type: v as (typeof COURT_TYPES)[number] })}
            >
              <SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COURT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.court_type === "high_court" ? (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bench</label>
              <Select value={form.bench_key || undefined} onValueChange={(v) => setForm({ ...form, bench_key: v })}>
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
        {list.error && <p className="mt-2 text-sm text-destructive">{list.error.message}</p>}
      </CardContent>

      <div className="rounded-lg border-t bg-card">
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
                  const label = c.court_type === "high_court" ? benchDisplay(c.bench_key).label : c.bench_key;
                  return (
                    <TableRow key={key}>
                      <TableCell>{label}</TableCell>
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
    </Card>
  );
}

function useRegionConfigs() {
  const [items, setItems] = useState<RegionConfig[]>([]);
  async function refetch() {
    try {
      const { items } = await api.listRegionConfigs();
      setItems(items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load region configs");
    }
  }
  useEffect(() => {
    void refetch();
  }, []);
  return { items, refetch };
}

function RegionConfigsCard() {
  const configs = useRegionConfigs();
  const { entries: courtDirectory } = useCourtDirectory();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [courtType, setCourtType] = useState<(typeof COURT_TYPES)[number]>("district_court");
  const [stateCode, setStateCode] = useState("");

  const states = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of courtDirectory) if (!seen.has(e.state_code)) seen.set(e.state_code, e.state_name ?? e.state_code);
    return Array.from(seen.entries());
  }, [courtDirectory]);

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
    if (!stateCode) {
      toast.error("Pick a state");
      return;
    }
    try {
      await api.upsertRegionConfig({ court_type: courtType, state_code: stateCode, enabled: false });
      toast.success("Region disabled");
      setStateCode("");
      await configs.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Region Configs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Opt-out model — no row for a state means it's enabled. Add a row here only to
          disable one. State list comes from discovered District Court data — empty until
          court_directory_sync has run.
        </p>
        <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={submitNew}>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Court type</label>
            <Select value={courtType} onValueChange={(v) => setCourtType(v as (typeof COURT_TYPES)[number])}>
              <SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COURT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">State</label>
            <Select value={stateCode || undefined} onValueChange={setStateCode}>
              <SelectTrigger size="sm" className="w-48"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {states.map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
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

export function BenchConfigsPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Court Config</h1>
      <BenchConfigsCard />
      <RegionConfigsCard />
    </div>
  );
}
