/** Mirrors CDE's adapters/high_court/bench.py:KNOWN_BENCHES — duplicated here rather than
 * imported (workspace invariant: no cross-project imports; console has no shared code
 * with CDE). Purely presentational reference data, not business logic — update this list
 * if CDE's registry grows. */
export const KNOWN_BENCHES: Record<string, { courtGroup: string; label: string }> = {
  bombay_mumbai: { courtGroup: "Bombay High Court", label: "Appellate Side, Bombay" },
  bombay_2: { courtGroup: "Bombay High Court", label: "Original Side, Bombay" },
  bombay_aurangabad: { courtGroup: "Bombay High Court", label: "Bench at Aurangabad" },
  bombay_nagpur: { courtGroup: "Bombay High Court", label: "Bench at Nagpur" },
  bombay_goa: { courtGroup: "Bombay High Court", label: "High Court of Bombay at Goa" },
  bombay_torts: { courtGroup: "Bombay High Court", label: "Special Court (Torts) Bombay" },
  bombay_kolhapur: { courtGroup: "Bombay High Court", label: "Bench at Kolhapur" },
  calcutta_main: { courtGroup: "Calcutta High Court", label: "Calcutta High Court" },
  madras_main: { courtGroup: "Madras High Court", label: "Madras High Court" },
  karnataka_main: { courtGroup: "Karnataka High Court", label: "Karnataka High Court" },
  allahabad_main: { courtGroup: "Allahabad High Court", label: "Allahabad High Court" },
};

export function benchDisplay(benchKey: string): { courtGroup: string; label: string } {
  return KNOWN_BENCHES[benchKey] ?? { courtGroup: benchKey, label: benchKey };
}

export function benchGroups(): string[] {
  return Array.from(new Set(Object.values(KNOWN_BENCHES).map((b) => b.courtGroup)));
}
