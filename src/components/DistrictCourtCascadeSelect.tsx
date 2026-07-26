import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type CourtDirectoryEntry } from "@/lib/api";

export function useCourtDirectory() {
  const [entries, setEntries] = useState<CourtDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .listCourtDirectory()
      .then((r) => setEntries(r.items))
      .finally(() => setLoading(false));
  }, []);
  return { entries, loading };
}

interface DistrictCourtCascadeSelectProps {
  entries: CourtDirectoryEntry[];
  stateCode: string;
  districtCode: string;
  complexCode: string;
  courtNameCode: string;
  onChange: (next: { stateCode: string; districtCode: string; complexCode: string; courtNameCode: string }) => void;
}

/** Empty until court_directory_sync's discovery sweep has actually populated
 * CourtDirectoryEntry -- confirmed empty in local/prod as of 2026-07-27, so these
 * dropdowns will show no options until that succeeds. Not a bug in this component. */
export function DistrictCourtCascadeSelect({
  entries,
  stateCode,
  districtCode,
  complexCode,
  courtNameCode,
  onChange,
}: DistrictCourtCascadeSelectProps) {
  const states = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) if (!seen.has(e.state_code)) seen.set(e.state_code, e.state_name ?? e.state_code);
    return Array.from(seen.entries());
  }, [entries]);

  const districts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      if (e.state_code !== stateCode || !e.district_code) continue;
      if (!seen.has(e.district_code)) seen.set(e.district_code, e.district_name ?? e.district_code);
    }
    return Array.from(seen.entries());
  }, [entries, stateCode]);

  const complexes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      if (e.state_code !== stateCode || e.district_code !== districtCode || !e.complex_code) continue;
      if (!seen.has(e.complex_code)) seen.set(e.complex_code, e.complex_name ?? e.complex_code);
    }
    return Array.from(seen.entries());
  }, [entries, stateCode, districtCode]);

  const courts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      if (e.state_code !== stateCode || e.district_code !== districtCode || e.complex_code !== complexCode) continue;
      if (!seen.has(e.court_name_code)) seen.set(e.court_name_code, e.court_name);
    }
    return Array.from(seen.entries());
  }, [entries, stateCode, districtCode, complexCode]);

  return (
    <>
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">State</label>
        <Select
          value={stateCode || undefined}
          onValueChange={(v) => onChange({ stateCode: v, districtCode: "", complexCode: "", courtNameCode: "" })}
        >
          <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Select state" /></SelectTrigger>
          <SelectContent>
            {states.map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">District</label>
        <Select
          value={districtCode || undefined}
          disabled={!stateCode}
          onValueChange={(v) => onChange({ stateCode, districtCode: v, complexCode: "", courtNameCode: "" })}
        >
          <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Select district" /></SelectTrigger>
          <SelectContent>
            {districts.map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">Court complex</label>
        <Select
          value={complexCode || undefined}
          disabled={!districtCode}
          onValueChange={(v) => onChange({ stateCode, districtCode, complexCode: v, courtNameCode: "" })}
        >
          <SelectTrigger size="sm" className="w-44"><SelectValue placeholder="Select complex" /></SelectTrigger>
          <SelectContent>
            {complexes.map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">Court name</label>
        <Select
          value={courtNameCode || undefined}
          disabled={!complexCode}
          onValueChange={(v) => onChange({ stateCode, districtCode, complexCode, courtNameCode: v })}
        >
          <SelectTrigger size="sm" className="w-44"><SelectValue placeholder="Select court" /></SelectTrigger>
          <SelectContent>
            {courts.map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
