const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export type LatinHonor =
  | ""
  | "cum_laude"
  | "magna_cum_laude"
  | "summa_cum_laude"
  | "cumbati"
  | "cumpyansa";

export type Region = "luzon" | "visayas" | "mindanao";
export type UserRole = "admin" | "head_officer";
export type RegionFilterValue = Region | "all";

export interface AuthUser {
  username: string;
  role: UserRole | null;
  region: Region | null;
  regionLabel: string;
}

export interface ManagedUser {
  id: number;
  username: string;
  role: UserRole;
  roleDisplay: string;
  region: Region | null;
  regionLabel: string;
}

export interface ReferenceRecord {
  id: number;
  name: string;
  region: Region;
  created_at?: string;
  updated_at?: string;
  scholarCount?: number;
}

export interface Scholar {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  suffix?: string;
  fullName: string;
  school: string;
  schoolName?: string;
  schoolRefId?: number | null;
  region?: Region;
  regionLabel?: string;
  degreeName: string;
  degree_name?: string;
  degreeRefId?: number | null;
  latinHonor: LatinHonor;
  latin_honor?: LatinHonor;
  latinHonorLabel: string;
  message: string;
  year_graduated?: number | null;
  imageSrc: string;
  thumbnailSrc: string;
  name?: string;
  affiliation?: string;
  quote?: string;
  order?: number;
  created_at?: string;
}

const FIELD_LABELS: Record<string, string> = {
  school: "School",
  school_id: "School",
  degree_name: "Degree Name",
  degree_id: "Degree Name",
  degreeName: "Degree Name",
  first_name: "First Name",
  last_name: "Last Name",
  middle_initial: "Middle Initial",
  suffix: "Suffix",
  latin_honor: "Latin Honor",
  latinHonor: "Latin Honor",
  region: "Region",
  role: "Role",
  password: "Password",
  message: "Message / Quote",
  image: "Graduation Photo",
  year_graduated: "Year Graduated",
};

export function formatApiError(err: unknown): string {
  if (typeof err === "string") {
    try {
      return formatApiError(JSON.parse(err));
    } catch {
      return err;
    }
  }

  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;

    const parts = Object.entries(record).flatMap(([field, msgs]) => {
      const label = FIELD_LABELS[field] ?? field;
      const list = Array.isArray(msgs) ? msgs : [msgs];
      return list.map((m) => `${label}: ${String(m)}`);
    });

    if (parts.length) return parts.join(" ");
  }

  return "Save failed";
}

interface TokenResponse {
  access: string;
  refresh: string;
}

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(apiUrl("/api/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = (await res.json()) as { access: string };
  localStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    token = await refreshAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}

async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      return formatApiError(JSON.parse(text));
    } catch {
      return `${res.status} ${res.statusText || "Request failed"}`;
    }
  }
  return `${res.status} ${res.statusText || "Request failed"}`;
}

export async function login(
  username: string,
  password: string
): Promise<void> {
  const res = await fetch(apiUrl("/api/auth/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (res.status === 429) {
    throw new Error("Too many login attempts. Please wait a minute and try again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? "Invalid username or password"
    );
  }

  const data = (await res.json()) as TokenResponse;
  setTokens(data.access, data.refresh);
}

export async function getMe(): Promise<AuthUser> {
  const res = await authFetch(apiUrl("/api/auth/me/"));
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json() as Promise<AuthUser>;
}

export async function getScholars(params?: {
  region?: RegionFilterValue;
  search?: string;
}): Promise<Scholar[]> {
  const query = new URLSearchParams();
  if (params?.region && params.region !== "all") {
    query.set("region", params.region);
  }
  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }
  const qs = query.toString();
  const res = await fetch(apiUrl(`/api/scholars/${qs ? `?${qs}` : ""}`));
  if (!res.ok) throw new Error("Failed to load scholars");
  return res.json() as Promise<Scholar[]>;
}

export interface PaginatedScholars {
  count: number;
  next: string | null;
  previous: string | null;
  results: Scholar[];
}

export type PageSize = 10 | 20 | 50 | 100;

export type PublicPageSize = 6 | 9 | 10;

export const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

export async function getPublicScholarsPaginated(params: {
  page: number;
  pageSize: PublicPageSize;
  search?: string;
  region?: RegionFilterValue;
}): Promise<PaginatedScholars> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.region && params.region !== "all") {
    query.set("region", params.region);
  }

  const res = await fetch(apiUrl(`/api/scholars/?${query.toString()}`));
  if (!res.ok) throw new Error("Failed to load scholars");
  return res.json() as Promise<PaginatedScholars>;
}

export async function getScholarsPaginated(params: {
  page: number;
  pageSize: PageSize;
  search?: string;
  region?: RegionFilterValue;
}): Promise<PaginatedScholars> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.region && params.region !== "all") {
    query.set("region", params.region);
  }

  const res = await authFetch(apiUrl(`/api/scholars/?${query.toString()}`));
  if (!res.ok) throw new Error("Failed to load scholars");
  return res.json() as Promise<PaginatedScholars>;
}

export async function getScholar(id: number): Promise<Scholar> {
  const res = await fetch(apiUrl(`/api/scholars/${id}/`));
  if (!res.ok) throw new Error("Failed to load scholar");
  return res.json() as Promise<Scholar>;
}

export async function createScholar(formData: FormData): Promise<Scholar> {
  const res = await authFetch(apiUrl("/api/scholars/"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json() as Promise<Scholar>;
}

export async function updateScholar(
  id: number,
  formData: FormData
): Promise<Scholar> {
  const res = await authFetch(apiUrl(`/api/scholars/${id}/`), {
    method: "PATCH",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json() as Promise<Scholar>;
}

export async function deleteScholar(id: number): Promise<void> {
  const res = await authFetch(apiUrl(`/api/scholars/${id}/`), {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}

export interface ScholarAnalytics {
  scope: { region: Region | null; regionLabel: string };
  total: number;
  withYearSet: number;
  byRegion: { region: Region; regionLabel: string; count: number }[];
  byYear: { year: number | null; yearLabel: string; count: number }[];
}

export async function getScholarAnalytics(params?: {
  region?: Region;
}): Promise<ScholarAnalytics> {
  const query = new URLSearchParams();
  if (params?.region) query.set("region", params.region);
  const qs = query.toString();
  const res = await authFetch(
    apiUrl(`/api/scholars/analytics/${qs ? `?${qs}` : ""}`)
  );
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ScholarAnalytics>;
}

export async function listSchools(params?: {
  region?: Region;
  search?: string;
}): Promise<ReferenceRecord[]> {
  const query = new URLSearchParams();
  if (params?.region) query.set("region", params.region);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  const qs = query.toString();
  const res = await authFetch(apiUrl(`/api/schools/${qs ? `?${qs}` : ""}`));
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ReferenceRecord[]>;
}

export async function createSchool(data: {
  name: string;
  region: Region;
}): Promise<ReferenceRecord> {
  const res = await authFetch(apiUrl("/api/schools/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ReferenceRecord>;
}

export async function updateSchool(
  id: number,
  data: { name?: string; region?: Region }
): Promise<ReferenceRecord> {
  const res = await authFetch(apiUrl(`/api/schools/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ReferenceRecord>;
}

export async function deleteSchool(id: number): Promise<void> {
  const res = await authFetch(apiUrl(`/api/schools/${id}/`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function listDegrees(params?: {
  region?: Region;
  search?: string;
}): Promise<ReferenceRecord[]> {
  const query = new URLSearchParams();
  if (params?.region) query.set("region", params.region);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  const qs = query.toString();
  const res = await authFetch(apiUrl(`/api/degrees/${qs ? `?${qs}` : ""}`));
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ReferenceRecord[]>;
}

export async function createDegree(data: {
  name: string;
  region: Region;
}): Promise<ReferenceRecord> {
  const res = await authFetch(apiUrl("/api/degrees/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ReferenceRecord>;
}

export async function updateDegree(
  id: number,
  data: { name?: string; region?: Region }
): Promise<ReferenceRecord> {
  const res = await authFetch(apiUrl(`/api/degrees/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<ReferenceRecord>;
}

export async function deleteDegree(id: number): Promise<void> {
  const res = await authFetch(apiUrl(`/api/degrees/${id}/`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export const LATIN_HONOR_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "cum_laude", label: "Cum Laude" },
  { value: "magna_cum_laude", label: "Magna Cum Laude" },
  { value: "summa_cum_laude", label: "Summa Cum Laude" },
  { value: "cumbati", label: "CumBati" },
  { value: "cumpyansa", label: "Cumpyansa" },
];

export function toLatinHonorValue(value: string): LatinHonor {
  return value === "none" ? "" : (value as LatinHonor);
}

export function fromLatinHonorValue(value: LatinHonor): string {
  return value || "none";
}

export const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: "luzon", label: "Luzon" },
  { value: "visayas", label: "Visayas" },
  { value: "mindanao", label: "Mindanao" },
];

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "head_officer", label: "Head Officer" },
];

export async function getUsers(): Promise<ManagedUser[]> {
  const res = await authFetch(apiUrl("/api/users/"));
  if (!res.ok) throw new Error("Failed to load users");
  return res.json() as Promise<ManagedUser[]>;
}

export async function getUser(id: number): Promise<ManagedUser> {
  const res = await authFetch(apiUrl(`/api/users/${id}/`));
  if (!res.ok) throw new Error("Failed to load user");
  return res.json() as Promise<ManagedUser>;
}

export async function createUser(data: {
  username: string;
  password: string;
  role: UserRole;
  region?: Region | "";
}): Promise<ManagedUser> {
  const res = await authFetch(apiUrl("/api/users/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json() as Promise<ManagedUser>;
}

export async function updateUser(
  id: number,
  data: {
    username?: string;
    password?: string;
    role?: UserRole;
    region?: Region | "";
  }
): Promise<ManagedUser> {
  const res = await authFetch(apiUrl(`/api/users/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json() as Promise<ManagedUser>;
}

export async function deleteUser(id: number): Promise<void> {
  const res = await authFetch(apiUrl(`/api/users/${id}/`), {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}

export function isOnlyAdminUser(
  user: ManagedUser,
  allUsers: ManagedUser[]
): boolean {
  return (
    user.role === "admin" &&
    allUsers.filter((u) => u.role === "admin").length <= 1
  );
}

export function getUserDeleteRestriction(
  user: ManagedUser,
  allUsers: ManagedUser[],
  currentUsername?: string
): string | null {
  if (currentUsername && user.username === currentUsername) {
    return "You cannot delete your own account.";
  }
  const adminCount = allUsers.filter((u) => u.role === "admin").length;
  if (user.role === "admin" && adminCount <= 1) {
    return "Cannot delete the only admin account.";
  }
  return null;
}

export function getUserRoleChangeRestriction(
  user: ManagedUser,
  allUsers: ManagedUser[],
  nextRole: UserRole
): string | null {
  if (
    nextRole === "head_officer" &&
    isOnlyAdminUser(user, allUsers)
  ) {
    return "Cannot change the only admin to Head Officer.";
  }
  return null;
}