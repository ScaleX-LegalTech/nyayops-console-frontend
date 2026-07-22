import { Link } from "react-router-dom";
import { PaginationBar } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/lib/pagination";

export function CauseListReviewPage() {
  const list = usePaginatedList(
    ["low-confidence"],
    (limit, offset) => api.listLowConfidence(limit, offset),
    25,
  );

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Cause-List Review (HITL)</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Documents tier-1 flagged low-confidence, tier-2 hasn't corroborated. Click a row to review
        and correct individual entries against the source PDF.
      </p>
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
            {list.items.map((d) => (
              <TableRow key={d.id} className="cursor-pointer">
                <TableCell colSpan={6} className="p-0">
                  <Link
                    to={`/cause-lists/review/${d.id}`}
                    className="grid grid-cols-6 gap-2 px-2 py-2 hover:bg-accent"
                  >
                    <span>{d.court_type} / {d.source_bench_key}</span>
                    <span>{d.cause_list_date}</span>
                    <span>{d.list_type}</span>
                    <span className="truncate text-muted-foreground">{d.judge_names}</span>
                    <span>{d.item_count ?? "—"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {(d.parse_confidence_reasons ?? []).join(", ")}
                    </span>
                  </Link>
                </TableCell>
              </TableRow>
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
