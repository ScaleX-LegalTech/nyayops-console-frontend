import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  offset: number;
  count: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** Prev/Next only, no page-number jump — matches an internal admin tool's needs, not a
 * public product. Pairs with usePaginatedList (lib/pagination.ts). */
export function PaginationBar({ offset, count, hasMore, onPrev, onNext }: PaginationBarProps) {
  const start = count === 0 ? 0 : offset + 1;
  const end = offset + count;
  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-muted-foreground">
      <span>
        {start}-{end}
        {hasMore ? "+" : ""}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={offset === 0} onClick={onPrev}>
          <ChevronLeftIcon /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={onNext}>
          Next <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
