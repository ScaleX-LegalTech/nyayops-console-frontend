import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type TenantUser } from "@/lib/api";

export function TenantUsersPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  async function refresh() {
    if (!tenantId) return;
    try {
      const { users } = await api.listTenantUsers(tenantId);
      setUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function act(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Tenant Users</h1>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!tenantId) return;
          act(() => api.inviteUser(tenantId, inviteEmail, inviteName)).then(() => {
            setInviteEmail("");
            setInviteName("");
          });
        }}
      >
        <input
          placeholder="Email"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <input
          placeholder="Full name"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={inviteName}
          onChange={(e) => setInviteName(e.target.value)}
        />
        <button className="rounded bg-slate-900 text-white px-3 py-2 text-sm">Invite</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3">{u.full_name}</td>
                <td className="p-3 text-slate-500">{u.email}</td>
                <td className="p-3">
                  {u.is_org_admin ? "Org Admin" : u.is_branch_admin ? "Branch Admin" : "Member"}
                </td>
                <td className="p-3">
                  {u.is_active ? (
                    <span className="text-green-600">active</span>
                  ) : (
                    <span className="text-slate-400">inactive</span>
                  )}
                </td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <button
                    className="text-xs underline"
                    onClick={() =>
                      tenantId && act(() => api.updateUser(tenantId, u.id, { is_active: !u.is_active }))
                    }
                  >
                    {u.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="text-xs underline"
                    onClick={() => tenantId && act(() => api.resetUserPassword(tenantId, u.id))}
                  >
                    Reset password
                  </button>
                  <button
                    className="text-xs underline text-red-600"
                    onClick={() => {
                      if (tenantId && window.confirm(`Delete ${u.email}?`))
                        act(() => api.deleteUser(tenantId, u.id));
                    }}
                  >
                    Delete
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
