import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { benchDisplay, KNOWN_BENCHES } from "@/lib/benches";
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
import { humanizeSnake } from "@/lib/format";
import { usePaginatedList } from "@/lib/pagination";

const LIST_TYPES = ["daily_main", "daily_supplementary", "daily_chamber_main"];
const PARSE_STATUSES = ["pending", "parsed", "parse_failed", "duplicate_skipped"];
const SORT_OPTIONS = [
  { value: "fetched_at", label: "Fetched date" },
  { value: "cause_list_date", label: "Cause list date" },
  { value: "item_count", label: "Items" },
];

export function CauseListReviewPage() {
  // Draft vs applied split, same reasoning as FetchHistoryPage: only "Apply filters"
  // triggers a refetch, not every keystroke/selection.
  const [draftBenchKey, setDraftBenchKey] = useState("");
  const [draftListType, setDraftListType] = useState("");
  const [draftParseStatus, setDraftParseStatus] = useState("");
  const [draftCauseListDate, setDraftCauseListDate] = useState("");
  const [benchKey, setBenchKey] = useState("");
  const [listType, setListType] = useState("");
  const [parseStatus, setParseStatus] = useState("");
  const [causeListDate, setCauseListDate] = useState("");
  const [sortBy, setSortBy] = useState("fetched_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtersDirty =
    draftBenchKey !== benchKey ||
    draftListType !== listType ||
    draftParseStatus !== parseStatus ||
    draftCauseListDate !== causeListDate;

  const list = usePaginatedList(
    ["cause-list-documents", benchKey, listType, parseStatus, causeListDate, sortBy, sortDir],
    (limit, offset) =>
      api.listDocuments({
        bench_key: benchKey || undefined,
        list_type: listType || undefined,
        parse_status: parseStatus || undefined,
        cause_list_date: causeListDate || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        limit,
        offset,
      }),
    25,
  );

  function applyFilters() {
    setBenchKey(draftBenchKey);
    setListType(draftListType);
    setParseStatus(draftParseStatus);
    setCauseListDate(draftCauseListDate);
    list.reset();
  }

  function clearFilters() {
    setDraftBenchKey("");
    setDraftListType("");
    setDraftParseStatus("");
    setDraftCauseListDate("");
    setBenchKey("");
    setListType("");
    setParseStatus("");
    setCauseListDate("");
    list.reset();
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Cause Lists</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Every cause-list document on the platform. Click a row to view and edit its entries.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Bench</label>
          <Select value={draftBenchKey || "all"} onValueChange={(v) => setDraftBenchKey(v === "all" ? "" : v)}>
            <SelectTrigger size="sm" className="w-48">
              <span className="truncate">{draftBenchKey ? benchDisplay(draftBenchKey).label : "All benches"}</span>
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
          <label className="mb-1 block text-xs text-muted-foreground">List type</label>
          <Select value={draftListType || "all"} onValueChange={(v) => setDraftListType(v === "all" ? "" : v)}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All list types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All list types</SelectItem>
              {LIST_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{humanizeSnake(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Parse status</label>
          <Select value={draftParseStatus || "all"} onValueChange={(v) => setDraftParseStatus(v === "all" ? "" : v)}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Any status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {PARSE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{humanizeSnake(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Cause list date</label>
          <DatePicker value={draftCauseListDate} onChange={setDraftCauseListDate} />
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
        <div className="flex gap-2">
          <Button size="sm" disabled={!filtersDirty} onClick={applyFilters}>
            Apply filters
          </Button>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
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
              <TableHead>List Type</TableHead>
              <TableHead>Judge(s)</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Parse Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((d) => {
              const bench = benchDisplay(d.source_bench_key);
              return (
                <TableRow key={d.id} className="cursor-pointer">
                  <TableCell colSpan={6} className="p-0">
                    <Link
                      to={`/cause-lists/review/${d.id}`}
                      className="grid grid-cols-6 gap-2 px-2 py-2 hover:bg-accent"
                    >
                      <span>
                        {bench.label}
                        <span className="block text-xs text-muted-foreground">{bench.courtGroup}</span>
                      </span>
                      <span>{d.cause_list_date}</span>
                      <span>{humanizeSnake(d.list_type)}</span>
                      <span className="truncate text-muted-foreground">{d.judge_names}</span>
                      <span>{d.item_count ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{humanizeSnake(d.parse_status)}</span>
                    </Link>
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
