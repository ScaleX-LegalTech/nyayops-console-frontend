import { useEffect, useState } from "react";
import { api, type FetchAttempt } from "@/lib/api";

export function FetchHistoryPage() {
  const [attempts, setAttempts] = useState<FetchAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listFetchAttempts()
      .then((res) => setAttempts(res.attempts))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Cause-List Fetch History</h1>
      <p className="text-sm text-slate-500 mb-6">
        Every index-call attempt, not just documents that were downloaded — new in console,
        this had no admin route before.
      </p>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Bench</th>
              <th className="p-3">Date</th>
              <th className="p-3">Row Count</th>
              <th className="p-3">Attempted At</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="p-3">
                  {a.court_type} / {a.source_bench_key}
                </td>
                <td className="p-3">{a.cause_list_date}</td>
                <td className="p-3">{a.row_count}</td>
                <td className="p-3 text-slate-500">{new Date(a.attempted_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
