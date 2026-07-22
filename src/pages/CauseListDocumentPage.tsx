import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type CauseListEntry } from "@/lib/api";

const LINK_TYPES = ["none", "with", "in"] as const;

interface FormState {
  case_number_raw: string;
  case_category: string;
  remark_text: string;
  court_number: string;
  party_names_raw: string;
  advocates_raw: string;
  linked_case_number: string;
  link_type: (typeof LINK_TYPES)[number];
  is_companion: boolean;
  cnr_on_list: string;
}

function toForm(entry: CauseListEntry): FormState {
  return {
    case_number_raw: entry.case_number_raw ?? "",
    case_category: entry.case_category ?? "",
    remark_text: entry.remark_text ?? "",
    court_number: entry.court_number ?? "",
    party_names_raw: entry.party_names_raw ?? "",
    advocates_raw: (entry.advocates_raw ?? []).join("\n"),
    linked_case_number: entry.linked_case_number ?? "",
    link_type: (entry.link_type as (typeof LINK_TYPES)[number]) ?? "none",
    is_companion: entry.is_companion,
    cnr_on_list: entry.cnr_on_list ?? "",
  };
}

function diff(entry: CauseListEntry, form: FormState): Record<string, unknown> {
  const changed: Record<string, unknown> = {};
  const original = toForm(entry);
  if (form.case_number_raw !== original.case_number_raw) changed.case_number_raw = form.case_number_raw;
  if (form.case_category !== original.case_category) changed.case_category = form.case_category || null;
  // Field name must match the model column (remark_text) exactly - correct_entry's
  // setattr(entry, field_name, value) writes whatever key is given verbatim, no
  // remapping. The old dashboard sent "remark" (the serializer's read-side key) here,
  // which silently no-ops - confirmed live while testing this page.
  if (form.remark_text !== original.remark_text) changed.remark_text = form.remark_text || null;
  if (form.court_number !== original.court_number) changed.court_number = form.court_number || null;
  if (form.party_names_raw !== original.party_names_raw)
    changed.party_names_raw = form.party_names_raw || null;
  if (form.advocates_raw !== original.advocates_raw)
    changed.advocates_raw = form.advocates_raw
      ? form.advocates_raw.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
  if (form.linked_case_number !== original.linked_case_number)
    changed.linked_case_number = form.linked_case_number || null;
  if (form.link_type !== original.link_type)
    changed.link_type = form.link_type === "none" ? null : form.link_type;
  if (form.is_companion !== original.is_companion) changed.is_companion = form.is_companion;
  if (form.cnr_on_list !== original.cnr_on_list) changed.cnr_on_list = form.cnr_on_list || null;
  return changed;
}

function EntryCorrectionForm({ entry }: { entry: CauseListEntry }) {
  const [form, setForm] = useState<FormState>(() => toForm(entry));
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function save() {
    const corrected_fields = diff(entry, form);
    if (Object.keys(corrected_fields).length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    try {
      await api.correctEntry(entry.id, corrected_fields);
      toast.success(`Entry ${entry.item_number} saved`);
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
          Item {entry.item_number}
          {entry.companion_ordinal > 0 && <span className="text-muted-foreground"> (companion {entry.companion_ordinal})</span>}
        </CardTitle>
        <Badge variant={entry.match_method === "unmatched" ? "warning" : "success"}>{entry.match_method}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Field label="Case number">
          <Input value={form.case_number_raw} onChange={(e) => setForm({ ...form, case_number_raw: e.target.value })} />
        </Field>
        <Field label="Case category">
          <Input value={form.case_category} onChange={(e) => setForm({ ...form, case_category: e.target.value })} />
        </Field>
        <Field label="Remark">
          <Input value={form.remark_text} onChange={(e) => setForm({ ...form, remark_text: e.target.value })} />
        </Field>
        <Field label="Court number">
          <Input value={form.court_number} onChange={(e) => setForm({ ...form, court_number: e.target.value })} />
        </Field>
        <Field label="Party names">
          <Input value={form.party_names_raw} onChange={(e) => setForm({ ...form, party_names_raw: e.target.value })} />
        </Field>
        <Field label="Advocates (one per line)">
          <textarea
            className="w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
            rows={2}
            value={form.advocates_raw}
            onChange={(e) => setForm({ ...form, advocates_raw: e.target.value })}
          />
        </Field>
        <Field label="Linked case number">
          <Input
            value={form.linked_case_number}
            onChange={(e) => setForm({ ...form, linked_case_number: e.target.value })}
          />
        </Field>
        <Field label="Link type">
          <Select value={form.link_type} onValueChange={(v) => setForm({ ...form, link_type: v as FormState["link_type"] })}>
            <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LINK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="CNR on list">
          <Input value={form.cnr_on_list} onChange={(e) => setForm({ ...form, cnr_on_list: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 pt-1">
          <Checkbox checked={form.is_companion} onCheckedChange={(v) => setForm({ ...form, is_companion: !!v })} />
          Is companion
        </label>
        {entry.source_reference_code && (
          <p className="text-xs text-muted-foreground">Source reference: {entry.source_reference_code}</p>
        )}
        <Button size="sm" className="mt-2 w-full" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save correction"}
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
              ← Back to review queue
            </Link>
            <h1 className="text-lg font-semibold">
              {document.court_type} / {document.source_bench_key} — {document.cause_list_date}
            </h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {(document.parse_confidence_reasons ?? []).join(", ")}
          </div>
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
          <EntryCorrectionForm key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
