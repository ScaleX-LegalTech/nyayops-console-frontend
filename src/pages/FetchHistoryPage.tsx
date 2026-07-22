import { PaginationBar } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/lib/pagination";

export function FetchHistoryPage() {
  const list = usePaginatedList(
    ["fetch-attempts"],
    (limit, offset) => api.listFetchAttempts({ limit, offset }),
    50,
  );

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Cause-List Fetch History</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every index-call attempt, not just documents that were downloaded — new in console, this had
        no admin route before.
      </p>
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
            {list.items.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  {a.court_type} / {a.source_bench_key}
                </TableCell>
                <TableCell>{a.cause_list_date}</TableCell>
                <TableCell>{a.row_count}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(a.attempted_at).toLocaleString()}
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
