// frontend/src/lib/api/apiBase.ts
/** apiBase.ts — Cross-origin canonical (production-grade)
 * - Always uses absolute API base (VITE_API_BASE or https://api.cognomega.com)
 * - Deterministic endpoints (no probing, no dev-relative fallbacks)
 * - Credential-less fetch by default (simpler CORS); callers may override
 * - Back-compat globals: window.__apiBase, window.__cogApiBase, window.__apiEndpoints
 */

let _base: string | null = null;
let _eps: ApiEndpoints | null = null;

/* ---------------------------------- Types ---------------------------------- */

export type ApiEndpoints = {
  ready: string;       // /ready (matches Worker)
  guestAuth: string;   // /auth/guest
  credits: string;     // /api/billing/balance
  usage: string;       // /api/billing/usage
};

export type FetchJsonResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | string | null;
  headers: Headers;
};

/* ------------------------------- Base Resolve ------------------------------ */

function readEnvBase(): string {
  // Prefer Vite env (baked at build time)
  try {
    const viteVal =
      (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE)
        ? String((import.meta as any).env.VITE_API_BASE).trim()
        : "";
    if (viteVal) return viteVal;
  } catch {}

  // Node-style read (SSR/build tools) without hard-referencing process in types
  try {
    const g: any = typeof globalThis !== "undefined" ? (globalThis as any) : {};
    const nodeVal = g?.process?.env?.VITE_API_BASE
      ? String(g.process.env.VITE_API_BASE).trim()
      : "";
    if (nodeVal) return nodeVal;
  } catch {}

  return "https://api.cognomega.com";
}

function normalizeBase(u: string): string {
  return (u || "").replace(/\/+$/, "");
}

function resolveBase(): string {
  if (_base) return _base;

  // Manual override for QA (highest precedence)
  try {
    const manual = localStorage.getItem("api_base_override");
    if (manual && manual.trim()) {
      _base = normalizeBase(manual.trim());
      (globalThis as any).__cogApiBase = _base;
      (globalThis as any).__apiBase = _base; // compatibility alias
      return _base;
    }
  } catch {}

  const forced = readEnvBase() || "https://api.cognomega.com";
  _base = normalizeBase(forced);
  (globalThis as any).__cogApiBase = _base;
  (globalThis as any).__apiBase = _base; // compatibility alias
  return _base;
}

/** Keep async signature for callers; resolves synchronously and returns base */
export async function ensureApiBase(): Promise<string> {
  return resolveBase();
}

/** Get the absolute API URL for a path or passthrough if already absolute */
export function apiUrl(path = ""): string {
  const base = resolveBase();
  if (!path) return base || "/";
  if (/^https?:\/\//i.test(path)) return path;
  const right = path.replace(/^\/+/, "");
  return `${base}/${right}`;
}

/* --------------------------- Endpoint definitions -------------------------- */

export async function ensureApiEndpoints(): Promise<ApiEndpoints> {
  if (_eps) return _eps;
  await ensureApiBase();

  const endpoints: ApiEndpoints = {
    ready:     apiUrl("/ready"),
    guestAuth: apiUrl("/auth/guest"),
    credits:   apiUrl("/api/billing/balance"),
    usage:     apiUrl("/api/billing/usage"),
  };

  _eps = endpoints;
  (globalThis as any).__cogApiEndpoints = endpoints;
  (globalThis as any).__apiEndpoints = endpoints; // compatibility alias
  return endpoints;
}

/** Read-only accessor if endpoints were already computed */
export function currentApiEndpoints(): ApiEndpoints | null {
  return _eps;
}

/* ------------------------------ Base Overrides ----------------------------- */

/** Set a manual API base override (persists to localStorage) */
export function setApiBaseOverride(base: string): void {
  const v = normalizeBase(String(base || ""));
  try { localStorage.setItem("api_base_override", v); } catch {}
  _base = v || _base; // update in-memory if non-empty
  if (v) {
    (globalThis as any).__cogApiBase = v;
    (globalThis as any).__apiBase = v;
  }
}

/** Remove manual API base override */
export function clearApiBaseOverride(): void {
  try { localStorage.removeItem("api_base_override"); } catch {}
  _base = null;
  resolveBase(); // recompute from env
}

/** Whether a manual override exists */
export function hasApiBaseOverride(): boolean {
  try {
    const v = localStorage.getItem("api_base_override");
    return !!(v && v.trim());
  } catch { return false; }
}

/* ----------------------------- Fetch convenience --------------------------- */

export async function fetchJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<FetchJsonResult<T>> {
  const url = apiUrl(path);
  const mergedHeaders = new Headers(authHeaders(init.headers || {}));
  // Belt-and-suspenders: strip problematic headers on the wire
  mergedHeaders.delete("X-Requested-With");
  mergedHeaders.delete("x-requested-with");
  mergedHeaders.delete("x-user-email");

  const r = await fetch(url, {
    credentials: init.credentials ?? "omit",
    mode: init.mode ?? "cors",
    ...init,
    headers: mergedHeaders,
  });

  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const isJson = ct.includes("application/json");
  const data = isJson ? await safeJson(r) : await r.text().then((t) => (t || null));

  return { ok: r.ok, status: r.status, data: data as any, headers: r.headers };
}

async function safeJson(r: Response) {
  try { return await r.json(); } catch { return null; }
}

/* ------------------------------ Legacy exports ----------------------------- */

export function apiBase(path: string = ""): string { return apiUrl(path); }
export function currentApiBase(): string { return _base ?? ""; }

/* --------------------------------- Auth utils ------------------------------- */

export function readPackedToken(): { token: string; exp?: number } | null {
  try {
    const raw = localStorage.getItem("cog_auth_jwt");
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j.token === "string") return j;
    }
  } catch {}
  const legacy = getFirstNonEmpty([
    () => localStorage.getItem("jwt"),
    () => localStorage.getItem("guest_token"),
  ]);
  if (legacy) return { token: legacy };
  return null;
}

function b64uToUtf8(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s = s + "=".repeat(pad);
  try { return atob(s); } catch { return ""; }
}

function decodeJwtPayload(tok: string): Record<string, any> | null {
  const parts = tok.split(".");
  if (parts.length < 2) return null;
  try {
    const payloadJson = b64uToUtf8(parts[1]);
    return JSON.parse(payloadJson);
  } catch { return null; }
}

/** Resolve best-guess user email.
 * Priority:
 * 1) Explicit localStorage keys: user_email, cog_user_email, email
 * 2) JWT payload fields: email, em, sub (if looks like an email)
 */
export function readUserEmail(): string | null {
  const direct = getFirstNonEmpty([
    () => localStorage.getItem("user_email"),
    () => localStorage.getItem("cog_user_email"),
    () => localStorage.getItem("email"),
  ]);
  if (direct) return direct;

  const packed = readPackedToken();
  const tok = packed?.token;
  if (!tok) return null;

  const p = decodeJwtPayload(tok);
  const candidate = (p?.email ?? p?.em ?? p?.sub ?? null) as string | null;
  if (candidate && typeof candidate === "string") {
    if (candidate.includes("@")) return candidate;
  }
  return null;
}

/** Merge provided headers with auth defaults (Accept + Authorization)
 * Returns a POJO (not a Headers object) for wide compatibility.
 * NOTE: We intentionally DO NOT send X-Requested-With or custom identity headers.
 */
export function authHeaders(init: HeadersInit = {}): HeadersInit {
  const h = new Headers(init as any);

  // Never send noisy/custom headers that trigger preflights
  h.delete("X-Requested-With");
  h.delete("x-requested-with");
  h.delete("x-user-email");

  if (!h.has("Accept")) h.set("Accept", "application/json");

  try {
    const packed =
      (typeof (globalThis as any).readPackedToken === "function")
        ? (globalThis as any).readPackedToken()
        : readPackedToken();

    let token: string | undefined =
      (packed && typeof packed.token === "string")
        ? packed.token
        : getFirstNonEmpty([
            () => localStorage.getItem("jwt"),
            () => localStorage.getItem("guest_token"),
          ]) || undefined;

    token = (token || "").trim();
    if (token && !h.has("Authorization")) h.set("Authorization", `Bearer ${token}`);
  } catch {}

  return Object.fromEntries(h.entries());
}

/* --------------------------------- Helpers --------------------------------- */

function getFirstNonEmpty(getters: Array<() => string | null | undefined>): string | null {
  for (const g of getters) {
    try {
      const v = g();
      if (v && typeof v === "string" && v.trim()) return v.trim();
    } catch {}
  }
  return null;
}
