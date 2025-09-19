// frontend/src/main.tsx
// Force safe cross-origin defaults + strip XRW everywhere
{
  const orig = window.fetch;
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const h = new Headers(init.headers || {});
    h.delete("X-Requested-With"); h.delete("x-requested-with");
    const patched: RequestInit = { credentials: "omit", ...init, headers: h };
    return orig(input as any, patched);
  };
}

import "./lib/turnstile";            // side-effect: defines window.__cogGetTurnstileToken
import { getTurnstileToken } from "./lib/turnstile"; // used by callers


import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // ensure global styles (Tailwind or base CSS) are applied

import RouterGate from "./RouterGate";
import { apiUrl, ensureApiBase } from "./lib/api/apiBase";

/** ------------------------------------------------------------------------
 *  Minimal guest-auth bootstrap (waits before first render)
 *  - Persists under: cog_auth_jwt (JSON), jwt (string), guest_token (string)
 *  - Prefers POST /auth/guest (with JSON body)
 *  - Broadcasts a synthetic storage event so same-tab listeners refresh
 *  - Uses apiUrl() for endpoints (after ensureApiBase() discovery)
 *  - Schedules auto-refresh ~60s before expiry (if provided)
 *  ---------------------------------------------------------------------- */

const TOKEN_KEY  = "cog_auth_jwt"; // { token, exp }
const LEGACY_KEY = "jwt";
const GUEST_KEY  = "guest_token";

const AUTH_MAX_WAIT_MS = 8000;      // don't block initial paint forever
const EXP_SKEW_SEC     = 60;        // refresh 60s before expiry
const MIN_EXP_SEC      = 300;       // if expires_in looks too small, clamp to 5m
const DEFAULT_TTL_SEC  = 3600;      // 1h default if server doesn't say

const nowSec = () => Math.floor(Date.now() / 1000);

// refresh timer handle
let refreshTimer: number | null = null;

function clearRefreshTimer() {
  if (refreshTimer != null) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleRefresh(expAbs: number | undefined) {
  clearRefreshTimer();
  if (!expAbs || !Number.isFinite(expAbs)) return;
  const deltaMs = Math.max(5_000, (expAbs - EXP_SKEW_SEC - nowSec()) * 1000);
  refreshTimer = window.setTimeout(() => {
    // Force refresh regardless of current token state
    void ensureGuest(true);
  }, deltaMs) as unknown as number;
}

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
    scheduleRefresh(exp);
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

type GuestResp = { token?: string; jwt?: string; guest_token?: string; access_token?: string; exp?: number; expires_in?: number; expires_at?: number } | string;

function extractToken(resp: GuestResp): { token: string; exp?: number } | null {
  try {
    if (!resp) return null;
    const token =
      typeof resp === "string"
        ? resp
        : resp.token || resp.jwt || resp.guest_token || resp.access_token || "";

    if (!token || typeof token !== "string") return null;

    const now = nowSec();
    const expAbs = typeof resp === "string" ? undefined : Number(resp.exp ?? resp.expires_at);
    const expRel = typeof resp === "string" ? undefined : Number(resp.expires_in);

    let exp: number | undefined = undefined;
    if (Number.isFinite(expAbs) && (expAbs as number) > now) {
      exp = expAbs as number;
    } else if (Number.isFinite(expRel) && (expRel as number) > 0) {
      const ttl = Math.max(MIN_EXP_SEC, expRel as number);
      exp = now + ttl;
    } else {
      exp = now + DEFAULT_TTL_SEC;
    }

    return { token, exp };
  } catch {
    return null;
  }
}

async function tryPostGuest(): Promise<{ token: string; exp?: number } | null> {
  try {
    const r = await fetch(apiUrl("/auth/guest"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: "{}", // harmless body helps some proxies treat this as JSON
      credentials: "omit",
      mode: "cors",
    });
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const j: GuestResp = ct.includes("application/json") ? await r.json() : await r.text();
    const parsed = extractToken(j);
    return parsed;
  } catch {
    return null;
  }
}

async function tryPostGuestV1(): Promise<{ token: string; exp?: number } | null> {
  try {
    const r = await fetch(apiUrl("/api/v1/auth/guest"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: "{}",
      credentials: "omit",
      mode: "cors",
    });
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const j: GuestResp = ct.includes("application/json") ? await r.json() : await r.text();
    const parsed = extractToken(j);
    return parsed;
  } catch {
    return null;
  }
}

async function fetchGuestToken(): Promise<{ token: string; exp?: number } | null> {
  // Prefer POST /auth/guest (modern), then fall back to /api/v1/auth/guest
  const first = await tryPostGuest();
  if (first) return first;

  const second = await tryPostGuestV1();
  if (second) return second;

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
      writeAll(fresh.token, fresh.exp || nowSec() + DEFAULT_TTL_SEC);
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

  // 0) Discover API base (writes to global alias via ensureApiBase)
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

  // Refresh token when tab becomes visible (if near or past skew)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const packed = readPacked();
    const exp = Number(packed?.exp ?? 0);
    if (!packed?.token || (exp && exp - EXP_SKEW_SEC <= nowSec())) {
      void ensureGuest(true);
    }
  });

  createRoot(rootEl).render(
    <React.StrictMode>
      <RouterGate />
    </React.StrictMode>
  );
}

mount();

// Make a helper available to the app & DevTools
declare global {
  interface Window {
    __cogGetTurnstileToken?: () => Promise<string>;
  }
}
window.__cogGetTurnstileToken = () =>
  getTurnstileToken({
    sitekey: (import.meta as any).env.VITE_TURNSTILE_SITE_KEY as string,
  });

  // Preload Turnstile once (idempotent for HMR)
(() => {
  if (document.getElementById('cf-turnstile-preload')) return;
  const s = document.createElement('script');
  s.id = 'cf-turnstile-preload';
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  s.async = s.defer = true;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
})();
