import type { Page } from "@/lib/pagination";

const TOKEN_KEY = "console_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Empty locally (vite's dev-server proxy forwards /api/* to :8002, see vite.config.ts) —
// set to the deployed API's origin (e.g. https://console.nyayops.in) on Vercel, since the
// frontend and backend are separate deployments there with no shared-origin proxy.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  }
  return usp.toString();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ username: string; display_name: string }>("/auth/me"),

  health: () => request<Record<string, { status: string; [k: string]: unknown }>>("/health"),
  metricsSeries: (service: string) =>
    request<{ series: string[] }>(`/metrics/series?service=${service}`),
  metricsQuery: (service: string, series: string, window: string) =>
    request(`/metrics/query?service=${service}&series=${series}&window=${window}`),

  listTenants: (params: { includeDeleted?: boolean; limit: number; offset: number }) =>
    request<Page<Tenant>>(
      `/tenants?${qs({ include_deleted: params.includeDeleted, limit: params.limit, offset: params.offset })}`,
    ),
  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  listTenantUsers: (id: string, limit: number, offset: number) =>
    request<Page<TenantUser>>(`/tenants/${id}/users?${qs({ limit, offset })}`),
  setFreeze: (id: string, is_frozen: boolean) =>
    request(`/tenants/${id}/freeze`, { method: "PATCH", body: JSON.stringify({ is_frozen }) }),
  setBillingStatus: (id: string, billing_status: string) =>
    request(`/tenants/${id}/billing-status`, {
      method: "PATCH",
      body: JSON.stringify({ billing_status }),
    }),
  setPlan: (id: string, plan: string) =>
    request(`/tenants/${id}/plan`, { method: "PATCH", body: JSON.stringify({ plan }) }),
  deleteTenant: (id: string, confirm_slug: string) =>
    request(`/tenants/${id}/delete`, { method: "POST", body: JSON.stringify({ confirm_slug }) }),
  restoreTenant: (id: string) => request(`/tenants/${id}/restore`, { method: "POST" }),
  purgeTenant: (id: string, confirm_phrase: string) =>
    request(`/tenants/${id}/purge`, { method: "POST", body: JSON.stringify({ confirm_phrase }) }),
  inviteUser: (id: string, email: string, full_name: string) =>
    request(`/tenants/${id}/users/invite`, {
      method: "POST",
      body: JSON.stringify({ email, full_name }),
    }),
  updateUser: (tenantId: string, userId: string, patch: Record<string, unknown>) =>
    request(`/tenants/${tenantId}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteUser: (tenantId: string, userId: string) =>
    request(`/tenants/${tenantId}/users/${userId}`, { method: "DELETE" }),
  resetUserPassword: (tenantId: string, userId: string) =>
    request(`/tenants/${tenantId}/users/${userId}/reset-password`, { method: "POST" }),

  listDocuments: (params: {
    court_type?: string;
    bench_key?: string;
    list_type?: string;
    cause_list_date?: string;
    parse_status?: string;
    sort_by?: string;
    sort_dir?: string;
    limit: number;
    offset: number;
  }) => request<Page<CauseListDocument>>(`/cause-lists/documents?${qs(params)}`),
  getDocument: (id: string) =>
    request<{ document: CauseListDocument; entries: CauseListEntry[] }>(
      `/cause-lists/documents/${id}`,
    ),
  downloadDocument: (id: string) => request<{ download_url: string }>(`/cause-lists/${id}/download`),
  updateEntry: (
    entryId: string,
    patch: Partial<Pick<CauseListEntry, "case_number" | "item_number" | "list_section" | "is_eliminated">>,
  ) => request(`/cause-lists/entries/${entryId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  listFetchAttempts: (params: {
    court_type?: string;
    source_bench_key?: string;
    cause_list_date?: string;
    sort_by?: string;
    sort_dir?: string;
    limit: number;
    offset: number;
  }) => request<Page<FetchAttempt>>(`/cause-lists/fetch-attempts?${qs(params)}`),
  listJobs: (params: { status?: string; adapter?: string; limit: number; offset: number }) =>
    request<Page<SyncJob>>(
      `/cause-lists/jobs?${qs({ status_filter: params.status, adapter: params.adapter, limit: params.limit, offset: params.offset })}`,
    ),
  listBenchConfigs: (courtType: string | undefined, limit: number, offset: number) =>
    request<Page<BenchConfig>>(
      `/cause-lists/bench-configs?${qs({ court_type: courtType, limit, offset })}`,
    ),
  upsertBenchConfig: (body: Partial<BenchConfig> & { court_type: string; bench_key: string }) =>
    request("/cause-lists/bench-configs", { method: "POST", body: JSON.stringify(body) }),
  deleteBenchConfig: (courtType: string, benchKey: string, courtNameCode: string | null) =>
    request(`/cause-lists/bench-configs?${qs({ court_type: courtType, bench_key: benchKey, court_name_code: courtNameCode ?? undefined })}`, {
      method: "DELETE",
    }),
  listCourtDirectory: () => request<{ items: CourtDirectoryEntry[] }>("/cause-lists/court-directory"),

  listJobSchedules: () => request<{ items: JobSchedule[] }>("/cause-lists/job-schedules"),
  updateJobSchedule: (taskName: string, patch: Partial<JobSchedule>) =>
    request<JobSchedule>(`/cause-lists/job-schedules/${taskName}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  listRegionConfigs: () => request<{ items: RegionConfig[] }>("/cause-lists/region-configs"),
  upsertRegionConfig: (body: { court_type: string; state_code: string; enabled: boolean }) =>
    request<RegionConfig>("/cause-lists/region-configs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  triggerCauseListFetch: (body: {
    court_type: string;
    cause_list_date: string;
    bench_key?: string;
    court_name_code?: string;
  }) => request("/cause-lists/trigger", { method: "POST", body: JSON.stringify(body) }),

  getSettings: () => request<Record<string, unknown>>("/settings"),
  setSetting: (key: string, value: unknown) =>
    request(`/settings/${key}`, { method: "PATCH", body: JSON.stringify(value) }),

  getPlatformSettings: () => request<PlatformSettings>("/platform-settings"),
  setPlatformSettings: (patch: Partial<Pick<PlatformSettings, "virus_scan_enabled" | "otp_email_enabled">>) =>
    request<PlatformSettings>("/platform-settings", { method: "PATCH", body: JSON.stringify(patch) }),
};

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: string;
  data_region: string;
  is_active: boolean;
  is_frozen: boolean;
  frozen_by: string | null;
  billing_status: string;
  deleted_at: string | null;
  deleted_by: string | null;
  purged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  is_org_admin: boolean;
  is_branch_admin: boolean;
  is_active: boolean;
  is_restricted: boolean;
  last_login_at: string | null;
}

export interface CauseListDocument {
  id: string;
  court_type: string;
  source_bench_key: string;
  cause_list_date: string;
  list_type: string;
  list_type_raw: string;
  judge_names: string;
  sitting_time: string | null;
  parse_status: string;
  item_count: number | null;
  fetched_at: string;
}

// CauseListEntry is minimal by CDE's own 2026-07-26 redesign -- party/advocate/case-
// identity fields moved onto the linked Case, not stored on the entry itself.
// linked_case_cnr/linked_case_registration_number are read-only display fields from a
// LEFT JOIN (console_backend/infrastructure/adapters/cde.py), not real entry columns.
export interface CauseListEntry {
  id: string;
  document_id: string;
  item_number: number | null;
  case_number: string;
  page_number: number | null;
  line_index: number | null;
  list_section: string | null;
  is_eliminated: boolean;
  linked_case_id: string | null;
  linked_case_cnr: string | null;
  linked_case_registration_number: string | null;
}

export interface FetchAttempt {
  id: string;
  court_type: string;
  source_bench_key: string;
  cause_list_date: string;
  row_count: number;
  attempted_at: string;
}

export interface CourtDirectoryEntry {
  state_code: string;
  state_name: string | null;
  district_code: string | null;
  district_name: string | null;
  complex_code: string | null;
  complex_name: string | null;
  court_name_code: string;
  court_name: string;
}

export interface BenchConfig {
  id: string;
  court_type: string;
  bench_key: string;
  court_name_code: string | null;
  enabled: boolean;
  fetch_civil: boolean;
  fetch_criminal: boolean;
  enabled_list_types: string[] | null;
}

export interface JobSchedule {
  task_name: string;
  enabled: boolean;
  hours: number[] | null;
  minutes: number[];
  weekdays: number[] | null;
  params: Record<string, unknown>;
  updated_at: string;
}

export interface RegionConfig {
  id: string;
  court_type: string;
  state_code: string;
  enabled: boolean;
}

export interface SyncJob {
  id: string;
  case_id: string;
  adapter: string;
  order_id: string | null;
  status: string;
  attempts: number;
  error_code: string | null;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PlatformSettings {
  virus_scan_enabled: boolean;
  otp_email_enabled: boolean;
  updated_at: string;
}
