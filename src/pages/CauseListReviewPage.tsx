import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
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
import { api, type CauseListDocument } from "@/lib/api";
import { humanizeReason, humanizeSnake } from "@/lib/format";
import { usePaginatedList } from "@/lib/pagination";

const LIST_TYPES = ["daily_main", "daily_supplementary", "daily_chamber_main"];
const SORT_OPTIONS = [
  { value: "fetched_at", label: "Fetched date" },
  { value: "cause_list_date", label: "Cause list date" },
  { value: "item_count", label: "Items" },
];

function groupByReason(items: CauseListDocument[]) {
  const groups = new Map<string, CauseListDocument[]>();
  for (const doc of items) {
    const reasons = doc.parse_confidence_reasons ?? [];
    const type = reasons.length > 0 ? humanizeReason(reasons[0]).type : "other";
    const label = reasons.length > 0 ? humanizeSnake(type) : "Other";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(doc);
  }
  return groups;
}

export function CauseListReviewPage() {
  const [benchKey, setBenchKey] = useState("");
  const [listType, setListType] = useState("");
  const [causeListDate, setCauseListDate] = useState("");
  const [sortBy, setSortBy] = useState("fetched_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [groupByReasonEnabled, setGroupByReasonEnabled] = useState(false);

  const list = usePaginatedList(
    ["low-confidence", benchKey, listType, causeListDate, sortBy, sortDir],
    (limit, offset) =>
      api.listLowConfidence({
        bench_key: benchKey || undefined,
        list_type: listType || undefined,
        cause_list_date: causeListDate || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        limit,
        offset,
      }),
    25,
  );

  const grouped = useMemo(
    () => (groupByReasonEnabled ? groupByReason(list.items) : null),
    [groupByReasonEnabled, list.items],
  );

  function resetAndFetch() {
    list.reset();
  }

  function row(d: CauseListDocument) {
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
            <span className="truncate text-xs text-muted-foreground">
              {(d.parse_confidence_reasons ?? []).map((r) => humanizeReason(r).label).join(", ") || "—"}
            </span>
          </Link>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Cause-List Review (HITL)</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Documents tier-1 flagged low-confidence, tier-2 hasn't corroborated. Click a row to review
        and correct individual entries against the source PDF.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Bench</label>
          <Select value={benchKey || "all"} onValueChange={(v) => { setBenchKey(v === "all" ? "" : v); resetAndFetch(); }}>
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
          <label className="mb-1 block text-xs text-muted-foreground">List type</label>
          <Select value={listType || "all"} onValueChange={(v) => { setListType(v === "all" ? "" : v); resetAndFetch(); }}>
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
          <label className="mb-1 block text-xs text-muted-foreground">Cause list date</label>
          <DatePicker value={causeListDate} onChange={(v) => { setCauseListDate(v); resetAndFetch(); }} />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Sort by</label>
          <div className="flex gap-1">
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); resetAndFetch(); }}>
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
              onClick={() => { setSortDir(sortDir === "asc" ? "desc" : "asc"); resetAndFetch(); }}
              aria-label="Toggle sort direction"
            >
              {sortDir === "asc" ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
            </Button>
          </div>
        </div>
        <Button
          variant={groupByReasonEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setGroupByReasonEnabled((v) => !v)}
        >
          Group by reason
        </Button>
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
              <TableHead>Reasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped
              ? Array.from(grouped.entries()).map(([groupLabel, docs]) => (
                  <Fragment key={`group-${groupLabel}`}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={6} className="py-1.5 text-xs font-semibold text-muted-foreground">
                        {groupLabel} ({docs.length})
                      </TableCell>
                    </TableRow>
                    {docs.map((d) => row(d))}
                  </Fragment>
                ))
              : list.items.map((d) => row(d))}
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
