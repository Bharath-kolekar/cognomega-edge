/** apiBase.ts — Stable API base + endpoints + auth helpers (production-grade)
 * - DEV (Vite): relative paths so proxy handles /api
 * - PROD (Pages/app.cognomega.com): hard-target https://api.cognomega.com
 * - Deterministic endpoints (no noisy probing)
 * - Credential-less fetch by default to simplify CORS
 */

let _base: string | null = null;
let _eps: ApiEndpoints | null = null;

export type ApiEndpoints = {
  ready: string;       // /ready (matches Worker)
  guestAuth: string;   // /auth/guest
  credits: string;     // /api/credits
  usage: string;       // /api/billing/usage
  // Present for legacy typing, but intentionally not used:
  genJwt?: string;
};

/* ---------------------------------- Base URL --------------------------------- */

export function apiUrl(path = ""): string {
  const base = _base ?? "";
  if (!path) return base || "/";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const left = (base || "").replace(/\/+$/, "");
  const right = path.replace(/^\/+/, "");
  return left ? `${left}/${right}` : `/${right}`;
}

export async function ensureApiBase(): Promise<string> {
  if (_base !== null) return _base;

  // Manual override for QA:
  try {
    const manual = localStorage.getItem("api_base_override");
    if (manual && manual.trim()) {
      _base = manual.trim();
      (window as any).__cogApiBase = _base;
      return _base;
    }
  } catch {}

  const host = (globalThis?.location?.hostname || "").toLowerCase();
  const isDev = (import.meta as any).env?.DEV === true;

  // DEV (vite dev server) → use relative so server.proxy handles it.
  // PROD (Pages or any non-local host) → use the API origin.
  if (isDev || host === "localhost" || host === "127.0.0.1") {
    _base = "";
  } else if (host.endsWith("cognomega.com") && !host.startsWith("api.")) {
    _base = "https://api.cognomega.com";
  } else if (host.endsWith("pages.dev")) {
    _base = "https://api.cognomega.com";
  } else {
    _base = "https://api.cognomega.com"; // safe default for production-like hosts
  }

  (window as any).__cogApiBase = _base;
  return _base;
}

/* --------------------------- Endpoint definitions ---------------------------- */

export async function ensureApiEndpoints(): Promise<ApiEndpoints> {
  if (_eps) return _eps;
  await ensureApiBase();

  // Pin to canonical Worker routes (no runtime probing/fallback spam)
  const endpoints: ApiEndpoints = {
    ready:     apiUrl("/ready"),               // FIX: matches Worker
    guestAuth: apiUrl("/auth/guest"),
    credits:   apiUrl("/api/credits"),
    usage:     apiUrl("/api/billing/usage"),
    genJwt:    undefined, // legacy only
  };

  _eps = endpoints;
  (window as any).__cogApiEndpoints = endpoints;
  return endpoints;
}

/* ----------------------------- Fetch convenience ---------------------------- */

export async function fetchJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T | string | null; headers: Headers }> {
  const url = apiUrl(path);

  // Merge headers with authHeaders (adds Accept + Authorization if present)
  const mergedHeaders = authHeaders(init.headers || {});
  const r = await fetch(url, {
    // Default to credential-less requests. Your Worker sets ACAO/ACAC correctly,
    // but we don’t need cookies for guest JWT mint / credits / usage.
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

// Back-compat alias used by older imports
export function apiBase(path: string = ""): string { return apiUrl(path); }

// Introspect current base (empty string in dev)
export function currentApiBase(): string { return _base ?? ""; }

/* --------------------------------- Auth utils -------------------------------- */

/** Read the stored token object: { token, exp? } */
export function readPackedToken(): { token: string; exp?: number } | null {
  try {
    const raw = localStorage.getItem("cog_auth_jwt");
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j.token === "string") return j;
    }
  } catch {}

  // legacy keys
  const legacy = localStorage.getItem("jwt") || localStorage.getItem("guest_token");
  if (legacy && legacy.trim()) return { token: legacy };
  return null;
}

function b64uToUtf8(s: string): string {
  // base64url -> base64
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  // pad to multiple of 4
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s = s + "=".repeat(pad);
  try { return atob(s); } catch { return ""; }
}

/** Best-effort read of a user identifier (email/sub) from the JWT payload. */
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

/** Build Authorization + Accept headers from stored JWT (guest or user). */
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
  } catch {
    // ignore
  }

  return Object.fromEntries(h.entries());
}
