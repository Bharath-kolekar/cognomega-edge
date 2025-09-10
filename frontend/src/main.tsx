// frontend/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";

import RouterGate from "./RouterGate";
import { apiUrl, ensureApiBase } from "./lib/api/apiBase";

/** ------------------------------------------------------------------------
 *  Minimal guest-auth bootstrap (waits before first render)
 *  - Persists under: cog_auth_jwt (JSON), jwt (string), guest_token (string)
 *  - Prefers POST /auth/guest, falls back to /api/gen-jwt, /gen-jwt
 *  - Broadcasts a synthetic storage event so same-tab listeners refresh
 *  - Uses apiUrl() for endpoints (after ensureApiBase() discovery)
 *  ---------------------------------------------------------------------- */

const TOKEN_KEY  = "cog_auth_jwt"; // { token, exp }
const LEGACY_KEY = "jwt";
const GUEST_KEY  = "guest_token";

const AUTH_MAX_WAIT_MS = 8000;      // don't block initial paint forever
const EXP_SKEW_SEC     = 60;        // refresh 60s before expiry

const nowSec = () => Math.floor(Date.now() / 1000);

function broadcastStorage(key: string, newValue: string) {
  try {
    // Same-tab listeners don't get native StorageEvent; synthesize one.
    const ev = new StorageEvent("storage", { key, newValue });
    window.dispatchEvent(ev);
  } catch {
    // Fallback "storage" tick if the above is blocked
    window.dispatchEvent(new Event("storage"));
  }
}

function writeAll(token: string, exp?: number) {
  try {
    const packed = JSON.stringify({ token, exp });
    localStorage.setItem(TOKEN_KEY, packed);
    localStorage.setItem(LEGACY_KEY, token);
    localStorage.setItem(GUEST_KEY, token);
    // Nudge any listeners (UsageFeed, CreditPill, pages) to refresh headers/UI
    broadcastStorage(TOKEN_KEY, packed);
    broadcastStorage(LEGACY_KEY, token);
    broadcastStorage(GUEST_KEY, token);
  } catch {
    /* ignore */
  }
}

function readPacked(): { token: string; exp?: number } | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j.token === "string") return j;
    }
  } catch { /* ignore */ }
  const legacy = localStorage.getItem(LEGACY_KEY) || localStorage.getItem(GUEST_KEY);
  if (legacy && legacy.trim()) return { token: legacy };
  return null;
}

async function tryPostGuest(): Promise<{ token: string; exp?: number } | null> {
  try {
    const r = await fetch(apiUrl("/auth/guest"), {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    const j: any = ct.includes("application/json") ? await r.json() : await r.text();
    const token =
      (typeof j === "string" ? j : j?.token || j?.jwt || j?.access_token) || null;
    const exp =
      typeof j === "object"
        ? Number(j?.exp ?? (j?.expires_in ? nowSec() + Number(j.expires_in) : undefined))
        : undefined;
    return token ? { token, exp } : null;
  } catch {
    return null;
  }
}

async function tryGetFallback(path: string): Promise<{ token: string; exp?: number } | null> {
  try {
    const r = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    const j: any = ct.includes("application/json") ? await r.json() : await r.text();
    const token =
      (typeof j === "string" ? j : j?.token || j?.jwt || j?.access_token) || null;
    const exp = typeof j === "object" ? Number(j?.exp) : undefined;
    return token ? { token, exp } : null;
  } catch {
    return null;
  }
}

async function fetchGuestToken(): Promise<{ token: string; exp?: number } | null> {
  // Prefer POST /auth/guest (modern), then fall back to legacy generators
  const first = await tryPostGuest();
  if (first) return first;

  const fallbacks: string[] = [];
  for (const p of fallbacks) {
    const got = await tryGetFallback(p);
    if (got) return got;
  }
  return null;
}

async function ensureGuest(force = false): Promise<string | null> {
  try {
    if (!force) {
      const packed = readPacked();
      if (packed?.token) {
        const exp = Number(packed.exp ?? 0);
        if (!exp || exp - EXP_SKEW_SEC > nowSec()) {
          // Re-write to make sure all keys exist (helps older pages)
          writeAll(packed.token, packed.exp);
          return packed.token;
        }
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

async function ensureGuestWithRetry(maxMs = AUTH_MAX_WAIT_MS): Promise<string | null> {
  const start = Date.now();
  let wait = 250;
  while (Date.now() - start < maxMs) {
    const tok = await ensureGuest(false);
    if (tok) return tok;
    await new Promise((r) => setTimeout(r, wait));
    wait = Math.min(wait * 2, 1200);
  }
  // Last forced attempt before giving up
  return await ensureGuest(true);
}

/** ---------------------------------------------------------------------- */

async function mount() {
  // Optional: minimal fallback text before we render the app
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Missing #root element");
  rootEl.textContent = "Initializing…";

  // 0) Discover API base (writes to localStorage if needed)
  try {
    await ensureApiBase();
  } catch {
    // still proceed; components can surface API connectivity issues
  }

  // Expose a ready promise for any modules that choose to await it
  (window as any).__cogAuthReady = ensureGuestWithRetry();

  try {
    await (window as any).__cogAuthReady;
  } catch {
    // even if auth failed, proceed to render; components can handle unauth state
  }

  createRoot(rootEl).render(
    <React.StrictMode>
      <RouterGate />
    </React.StrictMode>
  );
}

mount();

