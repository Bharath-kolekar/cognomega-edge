// frontend/src/lib/api/apiBase.ts
//
// Single source of truth for:
// 1) API base URL discovery/override
// 2) Authorization header construction (guest + legacy)
// 3) Small helpers used across the app
//
// No hard-coding of domains: prefers runtime config + localStorage,
// with safe fallbacks and optional runtime auto-discovery.

type PackedToken = { token: string; exp?: number };

// ---- API base resolution ----------------------------------------------------
// Priority (first hit wins):
// 1) localStorage["cm_api_base"]
// 2) window.__COG_API_BASE__ (settable by inline <script> or CF env injection)
// 3) import.meta.env.VITE_API_BASE
// 4) Same-origin (empty string) — only if your backend is reverse-proxied

declare global {
  interface Window {
    __COG_API_BASE__?: string;
  }
}

const LS_API_BASE = "cm_api_base";

function _readApiBaseOnce(): string {
  // 1) Local override (runtime)
  try {
    const ls = localStorage.getItem(LS_API_BASE);
    if (ls && ls.trim()) return ls.trim();
  } catch {
    /* ignore sandbox */
  }

  // 2) Window-global injected at runtime (e.g., CF/Wrangler env)
  if (typeof window !== "undefined") {
    const w = (window as any).__COG_API_BASE__;
    if (w && String(w).trim()) return String(w).trim();
  }

  // 3) Vite env (build-time)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (import.meta as any)?.env?.VITE_API_BASE;
  if (v && String(v).trim()) return String(v).trim();

  // 4) Final fallback: same-origin (works only if API is reverse-proxied)
  return "";
}

/** Public (boot-time) snapshot of the API base (no trailing slash). */
export const apiBase = _readApiBaseOnce();

/** Read the current API base dynamically (reflects changes after setApiBase/auto-discover). */
export function currentApiBase(): string {
  return _readApiBaseOnce();
}

/** Optional: allow changing the API base *at runtime* (e.g., debug panel) */
export function setApiBase(next?: string) {
  try {
    if (next && next.trim()) {
      localStorage.setItem(LS_API_BASE, next.trim().replace(/\/+$/, ""));
    } else {
      localStorage.removeItem(LS_API_BASE);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Build a fully-qualified API URL for a given path.
 * - Absolute URLs pass through unchanged.
 * - Always re-reads the base so updates take effect immediately.
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path; // absolute passthrough
  const base = currentApiBase();
  if (!base) {
    // same-origin (reverse-proxy scenario) — return a clean leading-slash path
    return `/${String(path || "").replace(/^\/+/, "")}`;
  }
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/**
 * Try to auto-discover the API base at runtime without hard-coding domains.
 * We probe common reverse-proxy prefixes and health endpoints.
 * If a JSON health responds, we persist the discovered base.
 */
export async function ensureApiBase(): Promise<string> {
  let base = currentApiBase();
  if (base) return base;

  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const prefixes = ["", "/api", "/v1"]; // safe, path-only (no domains)
  const endpoints = ["/ready", "/api/ready", "/health", "/healthz"];

  for (const p of prefixes) {
    const candidate = p ? origin + p : origin;
    for (const ep of endpoints) {
      try {
        const r = await fetch(candidate.replace(/\/+$/, "") + ep, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        if (r.ok && ct.includes("application/json")) {
          setApiBase(candidate);
          return candidate;
        }
      } catch {
        /* try next */
      }
    }
  }

  // Nothing found — leave as-is (same-origin empty string).
  return currentApiBase();
}

// ---- Token helpers (guest + legacy) ----------------------------------------

const KEY_GUEST = "guest_token"; // our preferred simple mirror
const KEY_JWT = "jwt";           // legacy
const KEY_COG = "cog_auth_jwt";  // JSON: { token, exp? }

function readPacked(): PackedToken | null {
  try {
    const raw = localStorage.getItem(KEY_COG);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p && typeof p.token === "string") return { token: p.token, exp: p.exp };
      } catch {
        /* ignore JSON parse error */
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Read a token from any of our known locations. */
export function readToken(): string | null {
  const packed = readPacked();
  if (packed?.token && `${packed.token}`.trim()) return `${packed.token}`.trim();

  // Legacy/string mirrors
  try {
    const jwt = localStorage.getItem(KEY_JWT);
    if (jwt && jwt.trim()) return jwt.trim();
    const guest = localStorage.getItem(KEY_GUEST);
    if (guest && guest.trim()) return guest.trim();
  } catch {
    /* ignore */
  }

  return null;
}

/** Persist a token everywhere we look (to avoid races across pages). */
export function writeTokenEverywhere(token: string, exp?: number) {
  try {
    const packed = JSON.stringify({ token, exp });
    localStorage.setItem(KEY_COG, packed);
    localStorage.setItem(KEY_JWT, token);
    localStorage.setItem(KEY_GUEST, token);

    // Nudge same-tab listeners (UsageFeed, etc.)
    try {
      const ev = new StorageEvent("storage", { key: KEY_COG, newValue: packed });
      window.dispatchEvent(ev);
    } catch {
      window.dispatchEvent(new Event("storage"));
    }
  } catch {
    /* ignore */
  }
}

// ---- Headers ---------------------------------------------------------------

/**
 * Build headers for API calls.
 * - Always sets Accept: application/json
 * - Adds Authorization: Bearer <token> when available
 * - Never sets Content-Type here; let callers set it (and skip for multipart)
 */
export function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  const tok = readToken();
  if (tok) h["Authorization"] = `Bearer ${tok}`;
  return h;
}

/**
 * Build JSON request options safely.
 * Use for typical POST/PUT/PATCH with a JSON body.
 */
export function jsonRequest(body: unknown): RequestInit {
  const h = authHeaders();
  return {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  };
}

// ---- Small utilities --------------------------------------------------------

/** Best-effort email used by analytics/usage. */
export function readUserEmail(): string {
  try {
    const a =
      (localStorage.getItem("user_email") || localStorage.getItem("email") || "").trim();
    return a || "guest@cognomega.com";
  } catch {
    return "guest@cognomega.com";
  }
}
