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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`/api${path}`, {
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

  listTenants: (includeDeleted = false) =>
    request<{ tenants: Tenant[] }>(`/tenants?include_deleted=${includeDeleted}`),
  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  listTenantUsers: (id: string) => request<{ users: TenantUser[] }>(`/tenants/${id}/users`),
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

  listLowConfidence: () =>
    request<{ documents: CauseListDocument[] }>("/cause-lists/low-confidence"),
  downloadDocument: (id: string) => request<{ download_url: string }>(`/cause-lists/${id}/download`),
  correctEntry: (entryId: string, corrected_fields: Record<string, unknown>) =>
    request(`/cause-lists/entries/${entryId}/correct`, {
      method: "POST",
      body: JSON.stringify({ corrected_fields }),
    }),
  listFetchAttempts: (params: { court_type?: string; source_bench_key?: string } = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ attempts: FetchAttempt[] }>(`/cause-lists/fetch-attempts?${qs}`);
  },
  listBenchConfigs: (courtType?: string) =>
    request<{ configs: BenchConfig[] }>(
      `/cause-lists/bench-configs${courtType ? `?court_type=${courtType}` : ""}`,
    ),
  upsertBenchConfig: (body: Partial<BenchConfig> & { court_type: string; bench_key: string }) =>
    request("/cause-lists/bench-configs", { method: "POST", body: JSON.stringify(body) }),

  getSettings: () => request<Record<string, unknown>>("/settings"),
  setSetting: (key: string, value: unknown) =>
    request(`/settings/${key}`, { method: "PATCH", body: JSON.stringify(value) }),
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
  judge_names: string;
  parse_status: string;
  parse_confidence: string | null;
  parse_confidence_reasons: string[] | null;
  tier2_confidence: string | null;
  item_count: number | null;
  fetched_at: string;
}

export interface FetchAttempt {
  id: string;
  court_type: string;
  source_bench_key: string;
  cause_list_date: string;
  row_count: number;
  attempted_at: string;
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
