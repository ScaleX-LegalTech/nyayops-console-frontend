import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/lib/pagination";

export function TenantUsersPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const list = usePaginatedList(
    ["tenant-users", tenantId],
    (limit, offset) => api.listTenantUsers(tenantId!, limit, offset),
    25,
  );

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
      <h1 className="mb-6 text-xl font-semibold">Tenant Users</h1>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!tenantId) return;
          act(() => api.inviteUser(tenantId, inviteEmail, inviteName), "Invited").then(() => {
            setInviteEmail("");
            setInviteName("");
          });
        }}
      >
        <Input placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-56" />
        <Input placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="w-56" />
        <Button type="submit">Invite</Button>
      </form>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{u.is_org_admin ? "Org Admin" : u.is_branch_admin ? "Branch Admin" : "Member"}</TableCell>
                <TableCell className="space-x-1">
                  {!u.is_active && <Badge variant="secondary">inactive</Badge>}
                  {u.is_restricted && <Badge variant="warning">read-only</Badge>}
                  {u.is_active && !u.is_restricted && <Badge variant="success">active</Badge>}
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      tenantId &&
                      act(
                        () => api.updateUser(tenantId, u.id, { is_active: !u.is_active }),
                        u.is_active ? "Deactivated" : "Activated",
                      )
                    }
                  >
                    {u.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      tenantId &&
                      act(
                        () => api.updateUser(tenantId, u.id, { is_restricted: !u.is_restricted }),
                        u.is_restricted ? "Unfrozen" : "Frozen (read-only)",
                      )
                    }
                  >
                    {u.is_restricted ? "Unfreeze" : "Freeze"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => tenantId && act(() => api.resetUserPassword(tenantId, u.id), "Password reset")}
                  >
                    Reset password
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (tenantId && window.confirm(`Delete ${u.email}?`))
                        act(() => api.deleteUser(tenantId, u.id), "Deleted");
                    }}
                  >
                    Delete
                  </Button>
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
