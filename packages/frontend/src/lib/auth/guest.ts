/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/lib/auth/guest.ts
//
// Client-side guest-auth helper used by the app.
// - No hard-coded domains: builds URLs via apiUrl()
// - Prefers /auth/guest POST (Pages Function) with Turnstile header
// - Mirrors token to all legacy keys and broadcasts a storage event
// - Can obtain a Turnstile token either from a global helper or from the widget
//
// Note: This complements (not replaces) the server-side Pages Function
// at /frontend/functions/auth/guest.ts, which verifies the token server-side.

import { apiUrl } from "../api/apiBase";

const KEY_COG = "cog_auth_jwt";  // JSON: { token, exp? }
const KEY_JWT = "jwt";           // legacy mirror
const KEY_GUEST = "guest_token"; // simple mirror most callers read

const EXP_SKEW_SEC = 60;
const nowSec = () => Math.floor(Date.now() / 1000);

// Keep global declarations consistent across the app.
// We intentionally use `any` for `window.turnstile` to match App.tsx
// and avoid duplicate/conflicting type augmentations.
declare global {
  interface Window {
    __cogGetTurnstileToken?: (opts?: { sitekey?: string }) => Promise<string>;
    __cogTurnstileWidgetId?: string;
    turnstile?: any; // keep unified with App.tsx & turnstile.ts
  }
}
function broadcastStorage(key: string, newValue: string) {
  try {
    const ev = new StorageEvent("storage", { key, newValue });
    window.dispatchEvent(ev);
  } catch {
    // Fallback tick
    window.dispatchEvent(new Event("storage"));
  }
}

function readPacked(): { token: string; exp?: number } | null {
  try {
    const raw = localStorage.getItem(KEY_COG);
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j.token === "string" && j.token.trim()) return j;
    }
  } catch {}
  return null;
}

function writeAll(token: string, exp?: number) {
  try {
    const packed = JSON.stringify({ token, exp });
    localStorage.setItem(KEY_COG, packed);
    localStorage.setItem(KEY_JWT, token);
    localStorage.setItem(KEY_GUEST, token);
    // nudge same-tab listeners
    broadcastStorage(KEY_COG, packed);
    broadcastStorage(KEY_JWT, token);
    broadcastStorage(KEY_GUEST, token);
  } catch {}
}

async function getTurnstileToken(): Promise<string> {
  // 1) Preferred: an app-provided async getter (lets UI decide when to render/execute)
  try {
    if (typeof window !== "undefined" && typeof window.__cogGetTurnstileToken === "function") {
      const t = await window.__cogGetTurnstileToken();
      if (t) return String(t);
    }
  } catch {}

  // 2) Fallback: if Turnstile is already rendered on the page, read its response
  try {
    const ts = (typeof window !== "undefined" && window.turnstile) ? window.turnstile : undefined;
    if (ts) {
      // Use a widget id if your app saved one, else try calling without (some builds allow it)
      const id = window.__cogTurnstileWidgetId;
      const t = ts.getResponse?.(id);
      if (t) return String(t);
    }
  } catch {}

  return "";
}

function parseTokenPayload(data: any): { token: string; exp?: number } | null {
  const token =
    (typeof data === "string"
      ? data
      : data?.token || data?.jwt || data?.guest_token || data?.access_token) || null;
  if (!token) return null;

  const expAbs = Number(
    typeof data === "object" ? data?.exp ?? data?.expires_at : undefined
  );
  return { token: String(token), exp: Number.isFinite(expAbs) ? expAbs : undefined };
}

async function tryEndpoint(
  url: string,
  method: "GET" | "POST",
  tsToken: string
): Promise<{ token: string; exp?: number } | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (tsToken) headers["CF-Turnstile-Token"] = tsToken;

  const init: RequestInit = { method, headers };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    init.body = "{}";
  }

  const r = await fetch(url, init);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const data = ct.includes("application/json") ? await r.json() : await r.text();

  if (!r.ok) return null;
  return parseTokenPayload(data);
}

async function fetchGuestToken(): Promise<{ token: string; exp?: number } | null> {
  // Turnstile is mandatory for POST /auth/guest. Obtain it up-front.
  const tsToken = await getTurnstileToken().catch(() => "");

  // Be decisive: hit the Pages Function first; keep minimal fallbacks.
  const candidates: Array<{ path: string; method: "GET" | "POST" }> = [
    { path: "/auth/guest", method: "POST" },        // Pages Function (preferred)
    { path: "/api/auth/guest", method: "POST" },    // legacy Worker
    // keep GETs last; may 405 but harmless if older paths still exist somewhere
    { path: "/auth/guest", method: "GET" },
    { path: "/api/auth/guest", method: "GET" },
    { path: "/api/gen-jwt", method: "GET" },
    { path: "/gen-jwt", method: "GET" },
  ];

  for (const c of candidates) {
    try {
      const url = apiUrl(c.path);
      const got = await tryEndpoint(url, c.method, tsToken);
      if (got?.token) return got;
    } catch {
      /* continue */
    }
  }
  return null;
}

/** Ensure a valid token is present in storage (under all expected keys). */
export async function ensureGuest(force = false): Promise<string | null> {
  try {
    if (!force) {
      const packed = readPacked();
      if (packed?.token) {
        const exp = Number(packed.exp ?? 0);
        if (!exp || exp - EXP_SKEW_SEC > nowSec()) {
          // still valid; re-mirror to keep legacy keys fresh
          writeAll(packed.token, packed.exp);
          return packed.token;
        }
      }
      // Legacy mirrors as soft fallback
      const legacy = (localStorage.getItem(KEY_JWT) || localStorage.getItem(KEY_GUEST) || "").trim();
      if (legacy) {
        writeAll(legacy);
        return legacy;
      }
    }

    const fresh = await fetchGuestToken();
    if (fresh?.token) {
      writeAll(fresh.token, fresh.exp || nowSec() + 3600);
      return fresh.token;
    }
    return null;
  } catch {
    return null;
  }
}

/** Convenience: retry for a short window (for first paint bootstrap). */
export async function ensureGuestWithRetry(maxMs = 8000): Promise<string | null> {
  const start = Date.now();
  let delay = 250;
  while (Date.now() - start < maxMs) {
    const tok = await ensureGuest(false);
    if (tok) return tok;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 1200);
  }
  return ensureGuest(true);
}

export {}; // make this file a module
