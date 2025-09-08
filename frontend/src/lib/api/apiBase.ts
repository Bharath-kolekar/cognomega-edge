// frontend/src/lib/api/apiBase.ts
//
// Single source of truth for:
// 1) API base URL discovery/override
// 2) Authorization header construction (guest + legacy)
// 3) Tiny helpers you can use across the app
//
// No hard-coding: prefers runtime/config/localStorage, with safe fallbacks.

type PackedToken = { token: string; exp?: number };

// ---- API base resolution ----------------------------------------------------
// Priority (first hit wins):
// 1) localStorage["cm_api_base"]
// 2) window.__COG_API_BASE__ (settable by an inline <script> or CF env injection)
// 3) import.meta.env.VITE_API_BASE
// 4) Same-origin (empty string) — only if your backend is reverse-proxied

declare global {
  interface Window {
    __COG_API_BASE__?: string;
  }
}

const LS_API_BASE = "cm_api_base";

function readApiBase(): string {
  try {
    const ls = localStorage.getItem(LS_API_BASE);
    if (ls && ls.trim()) return ls.trim();
  } catch { /* ignore sandbox */ }

  if (typeof window !== "undefined") {
    const win = window as any;
    const w = (win.__COG_API_BASE__ ?? "").toString().trim();
    if (w) return w;
  }

  // Vite env (build-time)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (import.meta as any)?.env?.VITE_API_BASE;
  if (v && String(v).trim()) return String(v).trim();

  // Final fallback: same-origin (works only if API is reverse-proxied)
  return "";
}

/** Public: current API base (no trailing slash) */
export const apiBase = readApiBase();

/** Optional: allow changing the API base *at runtime* (e.g., debug panel) */
export function setApiBase(next?: string) {
  try {
    if (next && next.trim()) {
      localStorage.setItem(LS_API_BASE, next.trim());
    } else {
      localStorage.removeItem(LS_API_BASE);
    }
  } catch { /* ignore */ }
  // Not re-exporting a live ref; callers should refresh app if they change it.
}

// ---- Token helpers (guest + legacy) ----------------------------------------

const KEY_GUEST = "guest_token";   // our preferred simple mirror
const KEY_JWT   = "jwt";           // legacy
const KEY_COG   = "cog_auth_jwt";  // JSON: { token, exp? }

function readPacked(): PackedToken | null {
  try {
    const raw = localStorage.getItem(KEY_COG);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p && typeof p.token === "string") return { token: p.token, exp: p.exp };
      } catch { /* ignore JSON parse error */ }
    }
  } catch { /* ignore */ }
  return null;
}

/** Read a token from any of our known locations. */
export function readToken(): string | null {
  // JSON-packed (preferred)
  const packed = readPacked();
  if (packed?.token && `${packed.token}`.trim()) return `${packed.token}`.trim();

  // Legacy/string mirrors
  try {
    const jwt = localStorage.getItem(KEY_JWT);
    if (jwt && jwt.trim()) return jwt.trim();
    const guest = localStorage.getItem(KEY_GUEST);
    if (guest && guest.trim()) return guest.trim();
  } catch { /* ignore */ }

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
  } catch { /* ignore */ }
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
    const a = (localStorage.getItem("user_email") || localStorage.getItem("email") || "").trim();
    return a || "guest@cognomega.com";
  } catch {
    return "guest@cognomega.com";
  }
}
