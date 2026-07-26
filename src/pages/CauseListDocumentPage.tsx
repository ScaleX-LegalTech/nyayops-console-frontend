import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { api, type CauseListEntry } from "@/lib/api";

// CauseListEntry is minimal by CDE's own 2026-07-26 redesign -- only these four
// fields are the entry's own; party/advocate/case-identity now live on the linked
// Case, shown read-only below (editing the link itself is a separate feature).
interface FormState {
  case_number: string;
  item_number: string;
  list_section: string;
  is_eliminated: boolean;
}

function toForm(entry: CauseListEntry): FormState {
  return {
    case_number: entry.case_number ?? "",
    item_number: entry.item_number?.toString() ?? "",
    list_section: entry.list_section ?? "",
    is_eliminated: entry.is_eliminated,
  };
}

function diff(entry: CauseListEntry, form: FormState): Record<string, unknown> {
  const changed: Record<string, unknown> = {};
  const original = toForm(entry);
  if (form.case_number !== original.case_number) changed.case_number = form.case_number;
  if (form.item_number !== original.item_number) {
    const n = Number(form.item_number);
    if (!Number.isNaN(n)) changed.item_number = n;
  }
  if (form.list_section !== original.list_section) changed.list_section = form.list_section || null;
  if (form.is_eliminated !== original.is_eliminated) changed.is_eliminated = form.is_eliminated;
  return changed;
}

function EntryEditForm({ entry }: { entry: CauseListEntry }) {
  const [form, setForm] = useState<FormState>(() => toForm(entry));
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function save() {
    const patch = diff(entry, form);
    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    try {
      await api.updateEntry(entry.id, patch);
      toast.success(`Entry ${entry.item_number ?? entry.id.slice(0, 8)} saved`);
      await queryClient.invalidateQueries({ queryKey: ["cause-list-document", entry.document_id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Item {entry.item_number ?? "—"}
        </CardTitle>
        <Badge variant={entry.linked_case_id ? "success" : "warning"}>
          {entry.linked_case_id ? "linked" : "unlinked"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Field label="Case number">
          <Input value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} />
        </Field>
        <Field label="Item number">
          <Input
            type="number"
            value={form.item_number}
            onChange={(e) => setForm({ ...form, item_number: e.target.value })}
          />
        </Field>
        <Field label="List section">
          <Input
            value={form.list_section}
            onChange={(e) => setForm({ ...form, list_section: e.target.value })}
            placeholder="e.g. Evidence, Hearing"
          />
        </Field>
        <label className="flex items-center gap-2 pt-1">
          <Checkbox
            checked={form.is_eliminated}
            onCheckedChange={(v) => setForm({ ...form, is_eliminated: !!v })}
          />
          Eliminated from list
        </label>
        {entry.linked_case_id && (
          <p className="text-xs text-muted-foreground">
            Linked case: {entry.linked_case_cnr ?? entry.linked_case_registration_number ?? entry.linked_case_id}
          </p>
        )}
        <Button size="sm" className="mt-2 w-full" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export function CauseListDocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const query = useQuery({
    queryKey: ["cause-list-document", documentId],
    queryFn: () => api.getDocument(documentId!),
    enabled: !!documentId,
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    api
      .downloadDocument(documentId)
      .then((r) => {
        if (!cancelled) setPdfUrl(r.download_url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (query.isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!query.data) return <div className="text-sm text-destructive">Document not found.</div>;

  const { document, entries } = query.data;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <Link to="/cause-lists/review" className="text-sm text-muted-foreground hover:underline">
              ← Back to cause lists
            </Link>
            <h1 className="text-lg font-semibold">
              {document.court_type} / {document.source_bench_key} — {document.cause_list_date}
            </h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">{document.parse_status}</div>
        </div>
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
          {pdfUrl ? (
            <iframe title="Cause list PDF" src={pdfUrl} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading PDF...
            </div>
          )}
        </div>
      </div>
      <div className="w-[28rem] shrink-0 space-y-3 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <EntryEditForm key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
