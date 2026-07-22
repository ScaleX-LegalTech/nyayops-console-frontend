import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { useState } from "react";
import { DatePicker } from "@/components/DatePicker";
import { Button } from "@/components/ui/button";
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
import { benchDisplay, KNOWN_BENCHES } from "@/lib/benches";
import { usePaginatedList } from "@/lib/pagination";

const SORT_OPTIONS = [
  { value: "attempted_at", label: "Attempted at" },
  { value: "cause_list_date", label: "Cause list date" },
  { value: "row_count", label: "Row count" },
];

export function FetchHistoryPage() {
  const [benchKey, setBenchKey] = useState("");
  const [causeListDate, setCauseListDate] = useState("");
  const [sortBy, setSortBy] = useState("attempted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const list = usePaginatedList(
    ["fetch-attempts", benchKey, causeListDate, sortBy, sortDir],
    (limit, offset) =>
      api.listFetchAttempts({
        source_bench_key: benchKey || undefined,
        cause_list_date: causeListDate || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        limit,
        offset,
      }),
    50,
  );

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Cause-List Fetch History</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Every index-call attempt, not just documents that were downloaded — new in console, this had
        no admin route before.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Bench</label>
          <Select value={benchKey || "all"} onValueChange={(v) => { setBenchKey(v === "all" ? "" : v); list.reset(); }}>
            <SelectTrigger size="sm" className="w-48">
              <span className="truncate">{benchKey ? benchDisplay(benchKey).label : "All benches"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All benches</SelectItem>
              {Object.entries(KNOWN_BENCHES).map(([key, b]) => (
                <SelectItem key={key} value={key}>
                  {b.courtGroup} — {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Cause list date</label>
          <DatePicker value={causeListDate} onChange={(v) => { setCauseListDate(v); list.reset(); }} />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Sort by</label>
          <div className="flex gap-1">
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); list.reset(); }}>
              <SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSortDir(sortDir === "asc" ? "desc" : "asc"); list.reset(); }}
              aria-label="Toggle sort direction"
            >
              {sortDir === "asc" ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      {list.error && (
        <p className="mb-4 text-sm text-destructive">{list.error.message}</p>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bench</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Row Count</TableHead>
              <TableHead>Attempted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((a) => {
              const bench = benchDisplay(a.source_bench_key);
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    {bench.label}
                    <span className="block text-xs text-muted-foreground">{bench.courtGroup}</span>
                  </TableCell>
                  <TableCell>{a.cause_list_date}</TableCell>
                  <TableCell>{a.row_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(a.attempted_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
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
