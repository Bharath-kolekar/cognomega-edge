/** Frontend API base + helpers.
 * Dev (localhost): use relative "/api" so Vite proxy handles CORS.
 * Prod: use VITE_API_BASE if set, else https://api.cognomega.com.
 */

export function ensureApiBase(): string {
  const envBase = (import.meta as any)?.env?.VITE_API_BASE?.toString().trim();
  if (envBase) return envBase;

  const isBrowser = typeof window !== "undefined";
  const origin = isBrowser ? window.location.origin : "";
  const isLocal =
    /^http:\/\/localhost(:\d+)?$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin);

  return isLocal ? "/api" : "https://api.cognomega.com";
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

export function apiUrl(path: string): string {
  return joinUrl(ensureApiBase(), path);
}

/** Read best-available auth token from localStorage (guest or real). */
export function readAuthToken(): string | null {
  try {
    const keys = ["cog_auth_jwt", "jwt", "guest_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v;
    }
  } catch {}
  return null;
}

/** Optional: read a stored user email if present. */
export function readUserEmail(): string | null {
  try {
    const keys = ["cog_user_email", "user_email", "email"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v;
    }
  } catch {}
  return null;
}

/** Build common JSON headers with optional bearer token. */
export function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export type FetchMode = "json" | "text" | "blob" | "response";
export type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;                // object will be JSON-encoded; FormData passes through
  authToken?: string;        // explicit token if not in localStorage
  token?: string;            // alias for authToken
  parse?: FetchMode;         // default "json"
  signal?: AbortSignal;
  credentials?: RequestCredentials; // defaults to "same-origin"
};

/** fetchJson: path-or-URL + opts → parsed result (default JSON). Throws on non-2xx. */
export async function fetchJson<T = any>(
  pathOrUrl: string,
  opts: FetchOpts = {}
): Promise<T> {
  const raw = String(pathOrUrl || "");
  const isAbs   = /^https?:\/\//i.test(raw);
  const isRoot  = raw.startsWith("/"); // root-relative (already based)
  const url     = isAbs ? raw : isRoot ? raw : apiUrl(raw);
  const method = (opts.method || (opts.body ? "POST" : "GET")).toUpperCase();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.body &&
      typeof opts.body === "object" &&
      !(opts.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(opts.headers || {}),
  };

  const token = opts.authToken || opts.token || readAuthToken() || "";
  if (token) headers.Authorization = `Bearer ${token}`;

  const body =
    opts.body &&
    typeof opts.body === "object" &&
    !(opts.body instanceof FormData)
      ? JSON.stringify(opts.body)
      : opts.body;

  const res = await fetch(url, {
    method,
    headers,
    body,
    signal: opts.signal,
    credentials: opts.credentials ?? "same-origin",
  });

  // 204 No Content → null
  if (res.status === 204) return null as unknown as T;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err: any = new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
    err.status = res.status;
    err.url = url;
    err.body = text;
    throw err;
  }

  switch (opts.parse ?? "json") {
    case "text":     return (await res.text()) as unknown as T;
    case "blob":     return (await res.blob()) as unknown as T;
    case "response": return res as unknown as T;
    default:         return (await res.json()) as T;
  }
}