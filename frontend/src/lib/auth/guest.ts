// frontend/src/lib/auth/guest.ts
//
// Client-side guest-auth helper used by the app.
// - No hard-coded domains: builds URLs via apiUrl()
// - Tries multiple endpoints & methods to avoid 405s
// - Mirrors token to all legacy keys and broadcasts a storage event
// - Optionally forwards a Turnstile token if your app exposes one
//
// Note: This complements (not replaces) a server-side Pages Function
// at /functions/auth/guest.ts, which can verify the token server-side.

import { apiUrl } from "../api/apiBase";

const KEY_COG = "cog_auth_jwt";  // JSON: { token, exp? }
const KEY_JWT = "jwt";           // legacy mirror
const KEY_GUEST = "guest_token"; // simple mirror most callers read

const EXP_SKEW_SEC = 60;
const nowSec = () => Math.floor(Date.now() / 1000);

// If your app (e.g., App.tsx) exposes a function to fetch a Turnstile token,
// we’ll call it. This avoids duplicating widget logic here.
declare global {
  interface Window {
    __cogGetTurnstileToken?: () => Promise<string>;
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
  try {
    if (typeof window !== "undefined" && typeof window.__cogGetTurnstileToken === "function") {
      const t = await window.__cogGetTurnstileToken();
      return (t && String(t)) || "";
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
  // Prefer the modern endpoints; include legacy fallbacks.
  const candidates: Array<{ path: string; method: "GET" | "POST" }> = [
    { path: "/auth/guest", method: "GET" },
    { path: "/auth/guest", method: "POST" },
    { path: "/api/auth/guest", method: "GET" },
    { path: "/api/auth/guest", method: "POST" },
    { path: "/api/gen-jwt", method: "GET" },
    { path: "/gen-jwt", method: "GET" },
  ];

  // Optional Turnstile token
  const tsToken = await getTurnstileToken().catch(() => "");

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
