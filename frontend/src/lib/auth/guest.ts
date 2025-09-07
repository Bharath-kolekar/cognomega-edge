// frontend/src/lib/auth/guest.ts
import { apiBase } from "../api/apiBase";

const TOKEN_KEY = "cog_auth_jwt"; // { token, exp }
const LEGACY_KEY = "jwt";         // legacy places read this
const GUEST_KEY  = "guest_token"; // current authHeaders() reads this

const nowSec = () => Math.floor(Date.now() / 1000);

function readPacked(): { token: string; exp?: number } | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j.token === "string") return j;
    }
  } catch {}
  return null;
}

function writeAll(token: string, exp?: number) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, exp }));
    localStorage.setItem(LEGACY_KEY, token);
    localStorage.setItem(GUEST_KEY, token);
  } catch {}
}

async function fetchGuestToken(): Promise<{ token: string; exp?: number } | null> {
  const candidates = [
    `${apiBase}/auth/guest`,
    `${apiBase}/api/gen-jwt`,
    `${apiBase}/gen-jwt`,
  ];
  for (const url of candidates) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") || "";
      const data: any = ct.includes("application/json") ? await r.json() : await r.text();
      const token =
        (typeof data === "string" ? data : data?.token || data?.jwt || data?.access_token) || null;
      const exp = typeof data === "object" ? Number(data?.exp) : undefined;
      if (token) return { token, exp };
    } catch {}
  }
  return null;
}

/** Ensure there’s a fresh token in localStorage (under all expected keys). */
export async function ensureGuest(force = false): Promise<string | null> {
  try {
    if (!force) {
      const packed = readPacked();
      if (packed?.token) {
        const exp = Number(packed.exp ?? 0);
        if (!exp || exp - 60 > nowSec()) {
          // still valid
          writeAll(packed.token, packed.exp);
          return packed.token;
        }
      }
      // also accept legacy values if present
      const legacy = localStorage.getItem(LEGACY_KEY) || localStorage.getItem(GUEST_KEY);
      if (legacy && legacy.trim()) {
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
