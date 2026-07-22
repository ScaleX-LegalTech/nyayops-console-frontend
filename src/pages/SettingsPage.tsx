import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["platform-settings"], queryFn: () => api.getPlatformSettings() });

  async function update(patch: { virus_scan_enabled?: boolean; otp_email_enabled?: boolean }) {
    try {
      await api.setPlatformSettings(patch);
      toast.success("Settings updated");
      await queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  const settings = query.data;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Virus scanning</CardTitle>
          <CardDescription>
            When off, new document uploads skip ClamAV and are marked "skipped" instead of scanned.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {settings?.virus_scan_enabled ? "Scanning uploads" : "Uploads are not being scanned"}
          </span>
          <Switch
            checked={settings?.virus_scan_enabled ?? false}
            onCheckedChange={(checked) => update({ virus_scan_enabled: checked })}
            disabled={query.isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">OTP emails</CardTitle>
          <CardDescription>
            When off, login OTP codes are not emailed and the OTP step is skipped entirely at
            login (email-verification recovery is also disabled while off).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {settings?.otp_email_enabled ? "OTP emails on" : "OTP emails off — login bypasses OTP"}
          </span>
          <Switch
            checked={settings?.otp_email_enabled ?? false}
            onCheckedChange={(checked) => update({ otp_email_enabled: checked })}
            disabled={query.isLoading}
          />
        </CardContent>
      </Card>

      {settings?.updated_at && (
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
