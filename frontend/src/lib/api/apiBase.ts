/** apiBase.ts — Cross-origin canonical (production-grade)
 * - Always uses absolute API base (VITE_API_BASE or https://api.cognomega.com)
 * - Deterministic endpoints (no probing, no dev-relative fallbacks)
 * - Credential-less fetch by default (simpler CORS)
 */

let _base: string | null = null;
let _eps: ApiEndpoints | null = null;

export type ApiEndpoints = {
  ready: string;       // /ready (matches Worker)
  guestAuth: string;   // /auth/guest
  credits: string;     // /api/credits
  usage: string;       // /api/billing/usage
};

/* ---------------------------------- Base URL --------------------------------- */

function readEnvBase(): string {
  try {
    const vite = (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE)
      ? String((import.meta as any).env.VITE_API_BASE).trim()
      : "";
    if (vite) return vite;
  } catch {}
  try {
    const node = (typeof process !== "undefined" && (process as any)?.env?.VITE_API_BASE)
      ? String((process as any).env.VITE_API_BASE).trim()
      : "";
    if (node) return node;
  } catch {}
  return "https://api.cognomega.com";
}

function resolveBase(): string {
  if (_base) return _base;

  // Manual override for QA (highest precedence)
  try {
    const manual = localStorage.getItem("api_base_override");
    if (manual && manual.trim()) {
      _base = manual.trim().replace(/\/+$/, "");
      (globalThis as any).__cogApiBase = _base;
      (globalThis as any).__apiBase = _base; // <- compatibility alias
      return _base;
    }
  } catch {}

  const forced = readEnvBase() || "https://api.cognomega.com";
  _base = forced.replace(/\/+$/, "");
  (globalThis as any).__cogApiBase = _base;
  (globalThis as any).__apiBase = _base; // <- compatibility alias
  return _base;
}

export async function ensureApiBase(): Promise<string> {
  // Keep async signature for callers; resolve synchronously
  return resolveBase();
}

export function apiUrl(path = ""): string {
  const base = resolveBase();
  if (!path) return base || "/";
  if (/^https?:\/\//i.test(path)) return path;
  const right = path.replace(/^\/+/, "");
  return `${base}/${right}`;
}

/* --------------------------- Endpoint definitions ---------------------------- */

export async function ensureApiEndpoints(): Promise<ApiEndpoints> {
  if (_eps) return _eps;
  await ensureApiBase();

  const endpoints: ApiEndpoints = {
    ready:     apiUrl("/ready"),
    guestAuth: apiUrl("/auth/guest"),
    credits:   apiUrl("/api/credits"),
    usage:     apiUrl("/api/billing/usage"),
  };

  _eps = endpoints;
  (globalThis as any).__cogApiEndpoints = endpoints;
  (globalThis as any).__apiEndpoints = endpoints; // <- compatibility alias
  return endpoints;
}

/* ----------------------------- Fetch convenience ---------------------------- */

export async function fetchJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T | string | null; headers: Headers }> {
  const url = apiUrl(path);
  const mergedHeaders = authHeaders(init.headers || {});
  const r = await fetch(url, {
    credentials: "omit",
    mode: "cors",
    ...init,
    headers: mergedHeaders,
  });

  const ct = r.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await r.json()
    : (await r.text() || null);

  return { ok: r.ok, status: r.status, data, headers: r.headers };
}

/* ------------------------------ Legacy exports ------------------------------ */

export function apiBase(path: string = ""): string { return apiUrl(path); }
export function currentApiBase(): string { return _base ?? ""; }

/* --------------------------------- Auth utils -------------------------------- */

export function readPackedToken(): { token: string; exp?: number } | null {
  try {
    const raw = localStorage.getItem("cog_auth_jwt");
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j.token === "string") return j;
    }
  } catch {}
  const legacy = localStorage.getItem("jwt") || localStorage.getItem("guest_token");
  if (legacy && legacy.trim()) return { token: legacy };
  return null;
}

function b64uToUtf8(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s = s + "=".repeat(pad);
  try { return atob(s); } catch { return ""; }
}

export function readUserEmail(): string | null {
  const packed = readPackedToken();
  const tok = packed?.token;
  if (!tok) return null;
  const parts = tok.split(".");
  if (parts.length < 2) return null;
  try {
    const payloadJson = b64uToUtf8(parts[1]);
    const p = JSON.parse(payloadJson);
    const email = p?.email ?? p?.em ?? p?.sub ?? null;
    return typeof email === "string" ? email : null;
  } catch { return null; }
}

export function authHeaders(init: HeadersInit = {}): HeadersInit {
  const h = new Headers(init as any);
  if (!h.has("Accept")) h.set("Accept", "application/json");
  try {
    const packed =
      (typeof (globalThis as any).readPackedToken === "function")
        ? (globalThis as any).readPackedToken()
        : readPackedToken();

    let token: string | undefined =
      (packed && typeof packed.token === "string")
        ? packed.token
        : (localStorage.getItem("jwt") || localStorage.getItem("guest_token") || undefined) as string | undefined;

    token = (token || "").trim();
    if (token && !h.has("Authorization")) h.set("Authorization", `Bearer ${token}`);
  } catch {}
  return Object.fromEntries(h.entries());
}
