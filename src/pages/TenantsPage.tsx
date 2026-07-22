import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Tenant } from "@/lib/api";

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    try {
      const { tenants } = await api.listTenants(includeDeleted);
      setTenants(tenants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeleted]);

  async function withBusy(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Tenants</h1>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Show deleted
        </label>
      </div>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Billing</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="p-3">
                  <Link className="text-blue-600 hover:underline" to={`/tenants/${t.id}/users`}>
                    {t.name}
                  </Link>
                </td>
                <td className="p-3 text-slate-500">{t.slug}</td>
                <td className="p-3">
                  <button
                    className="underline decoration-dotted"
                    onClick={() => {
                      const plan = window.prompt("New plan", t.plan);
                      if (plan) withBusy(t.id, () => api.setPlan(t.id, plan));
                    }}
                  >
                    {t.plan}
                  </button>
                </td>
                <td className="p-3">
                  <select
                    className="text-sm border border-slate-200 rounded px-1 py-0.5"
                    value={t.billing_status}
                    disabled={busyId === t.id}
                    onChange={(e) => withBusy(t.id, () => api.setBillingStatus(t.id, e.target.value))}
                  >
                    <option value="active">active</option>
                    <option value="overdue">overdue</option>
                    <option value="suspended">suspended</option>
                  </select>
                </td>
                <td className="p-3">
                  {t.purged_at ? (
                    <span className="text-slate-400">purged</span>
                  ) : t.deleted_at ? (
                    <span className="text-red-500">deleted</span>
                  ) : t.is_frozen ? (
                    <span className="text-amber-600">frozen ({t.frozen_by})</span>
                  ) : (
                    <span className="text-green-600">active</span>
                  )}
                </td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  {!t.deleted_at && (
                    <button
                      disabled={busyId === t.id}
                      className="text-xs underline"
                      onClick={() => withBusy(t.id, () => api.setFreeze(t.id, !t.is_frozen))}
                    >
                      {t.is_frozen ? "Unfreeze" : "Freeze"}
                    </button>
                  )}
                  {!t.deleted_at && t.is_frozen && (
                    <button
                      disabled={busyId === t.id}
                      className="text-xs underline text-red-600"
                      onClick={() => {
                        const slug = window.prompt(`Type slug "${t.slug}" to delete`);
                        if (slug) withBusy(t.id, () => api.deleteTenant(t.id, slug));
                      }}
                    >
                      Delete
                    </button>
                  )}
                  {t.deleted_at && !t.purged_at && (
                    <>
                      <button
                        disabled={busyId === t.id}
                        className="text-xs underline"
                        onClick={() => withBusy(t.id, () => api.restoreTenant(t.id))}
                      >
                        Restore
                      </button>
                      <button
                        disabled={busyId === t.id}
                        className="text-xs underline text-red-700"
                        onClick={() => {
                          const phrase = window.prompt(
                            `Type "PERMANENTLY DELETE ${t.slug}" to purge — irreversible`,
                          );
                          if (phrase) withBusy(t.id, () => api.purgeTenant(t.id, phrase));
                        }}
                      >
                        Purge
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
