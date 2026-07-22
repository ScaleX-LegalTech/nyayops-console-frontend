import { useEffect, useState } from "react";
import { api, type CauseListDocument } from "@/lib/api";

export function CauseListReviewPage() {
  const [documents, setDocuments] = useState<CauseListDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const { documents } = await api.listLowConfidence();
      setDocuments(documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function download(id: string) {
    try {
      const { download_url } = await api.downloadDocument(id);
      window.open(download_url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get download URL");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Cause-List Review (HITL)</h1>
      <p className="text-sm text-slate-500 mb-6">
        Documents tier-1 flagged low-confidence, tier-2 hasn't corroborated.
      </p>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Bench</th>
              <th className="p-3">Date</th>
              <th className="p-3">List Type</th>
              <th className="p-3">Judge(s)</th>
              <th className="p-3">Reasons</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="p-3">
                  {d.court_type} / {d.source_bench_key}
                </td>
                <td className="p-3">{d.cause_list_date}</td>
                <td className="p-3">{d.list_type}</td>
                <td className="p-3 text-slate-500">{d.judge_names}</td>
                <td className="p-3 text-xs text-slate-500">
                  {(d.parse_confidence_reasons ?? []).join(", ")}
                </td>
                <td className="p-3">
                  <button className="text-xs underline" onClick={() => download(d.id)}>
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
