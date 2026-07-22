import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface Page<T> {
  items: T[];
  has_more: boolean;
}

/** Offset/limit pagination against the workspace's {items, has_more} convention
 * (mirrors apps/dashboard's UserPageResponse/AuditLogPageResponse shape) — Prev/Next
 * only, no page-number jump. */
export function usePaginatedList<T>(
  key: unknown[],
  fetcher: (limit: number, offset: number) => Promise<Page<T>>,
  limit = 25,
) {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: [...key, limit, offset],
    queryFn: () => fetcher(limit, offset),
    placeholderData: keepPreviousData,
  });

  return {
    items: query.data?.items ?? [],
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    offset,
    limit,
    next: () => setOffset((o) => o + limit),
    prev: () => setOffset((o) => Math.max(0, o - limit)),
    reset: () => setOffset(0),
    refetch: query.refetch,
  };
}
