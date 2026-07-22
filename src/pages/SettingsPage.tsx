import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <pre className="text-xs bg-white border border-slate-200 rounded-lg p-4">
        {JSON.stringify(settings, null, 2)}
      </pre>
      <p className="text-sm text-slate-500 mt-4">
        Free-form key/value config — a new setting never needs a migration. Edit via
        <code className="mx-1 px-1 bg-slate-100 rounded">PATCH /api/settings/&#123;key&#125;</code>
        until a dedicated form is worth building.
      </p>
    </div>
  );
}
