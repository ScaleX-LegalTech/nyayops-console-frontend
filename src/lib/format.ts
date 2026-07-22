export function humanizeSnake(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Parses the confidence scorer's reason strings (application/cause_list/parsers's
 * ConfidenceResult.reasons in CDE) into a readable label + a short type key for grouping.
 * Known shapes: "zero_items", "parse_status=X", "low_match_rate=0.750",
 * "item_count_anomaly=(4 vs avg 26.0)". */
export function humanizeReason(reason: string): { type: string; label: string } {
  const [key, value] = reason.split(/=(.*)/s);
  switch (key) {
    case "zero_items":
      return { type: key, label: "Zero items parsed" };
    case "parse_status":
      return { type: key, label: `Parse status: ${value}` };
    case "low_match_rate": {
      const pct = (Number(value) * 100).toFixed(1);
      return { type: key, label: `Low match rate: ${pct}%` };
    }
    case "item_count_anomaly": {
      const inner = value?.replace(/^\(|\)$/g, "") ?? "";
      return { type: key, label: `Item count anomaly: ${inner}` };
    }
    default:
      return { type: key ?? reason, label: humanizeSnake(reason) };
  }
}

export function humanizeReasons(reasons: string[] | null | undefined): string {
  if (!reasons || reasons.length === 0) return "—";
  return reasons.map((r) => humanizeReason(r).label).join(", ");
}
