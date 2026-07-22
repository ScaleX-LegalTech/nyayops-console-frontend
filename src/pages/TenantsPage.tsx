import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type Tenant } from "@/lib/api";
import { usePaginatedList } from "@/lib/pagination";

type TabValue = "active" | "deleted" | "purged";

export function TenantsPage() {
  const [tab, setTab] = useState<TabValue>("active");
  const list = usePaginatedList(
    ["tenants", tab],
    (limit, offset) => api.listTenants({ includeDeleted: tab !== "active", limit, offset }),
    25,
  );

  const visible = list.items.filter((t) => {
    if (tab === "active") return !t.deleted_at;
    if (tab === "deleted") return !!t.deleted_at && !t.purged_at;
    return !!t.purged_at;
  });

  async function act(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      toast.success(successMessage);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenants</h1>
        <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); list.reset(); }}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
            <TabsTrigger value="purged">Purged</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link className="text-primary hover:underline" to={`/tenants/${t.id}/users`}>
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                <TableCell>
                  <button
                    className="underline decoration-dotted"
                    onClick={() => {
                      const plan = window.prompt("New plan", t.plan);
                      if (plan) act(() => api.setPlan(t.id, plan), `Plan set to ${plan}`);
                    }}
                  >
                    {t.plan}
                  </button>
                </TableCell>
                <TableCell>
                  <Select
                    value={t.billing_status}
                    onValueChange={(v) => act(() => api.setBillingStatus(t.id, v), "Billing status updated")}
                  >
                    <SelectTrigger size="sm" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="overdue">overdue</SelectItem>
                      <SelectItem value="suspended">suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <StatusBadge tenant={t} />
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  {!t.deleted_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(() => api.setFreeze(t.id, !t.is_frozen), t.is_frozen ? "Unfrozen" : "Frozen")}
                    >
                      {t.is_frozen ? "Unfreeze" : "Freeze"}
                    </Button>
                  )}
                  {!t.deleted_at && t.is_frozen && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const slug = window.prompt(`Type slug "${t.slug}" to delete`);
                        if (slug) act(() => api.deleteTenant(t.id, slug), "Tenant deleted");
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  {t.deleted_at && !t.purged_at && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act(() => api.restoreTenant(t.id), "Restored")}>
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const phrase = window.prompt(`Type "PERMANENTLY DELETE ${t.slug}" to purge — irreversible`);
                          if (phrase) act(() => api.purgeTenant(t.id, phrase), "Purged");
                        }}
                      >
                        Purge
                      </Button>
                    </>
                  )}
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

function StatusBadge({ tenant }: { tenant: Tenant }) {
  if (tenant.purged_at) return <Badge variant="secondary">purged</Badge>;
  if (tenant.deleted_at) return <Badge variant="destructive">deleted</Badge>;
  if (tenant.is_frozen) return <Badge variant="warning">frozen ({tenant.frozen_by})</Badge>;
  return <Badge variant="success">active</Badge>;
}
