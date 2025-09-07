// frontend/src/lib/billing/credits.ts
import { apiBase, authHeaders } from "../api/apiBase";

export type CreditsInfo =
  | { ok: true; remaining: number }
  | { ok: false; error: string };

function readToken(): string | null {
  try {
    // Preferred: our persisted JSON object
    const saved = localStorage.getItem("cog_auth_jwt");
    if (saved) {
      try {
        const j = JSON.parse(saved);
        if (j?.token && typeof j.token === "string") return j.token;
      } catch {
        /* ignore */
      }
    }
    // Back-compat fallbacks
    const jwt = localStorage.getItem("jwt");
    if (jwt && jwt.trim()) return jwt.trim();
    const guest = localStorage.getItem("guest_token");
    if (guest && guest.trim()) return guest.trim();
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Fetch remaining credits.
 * Tries /api/credits first, then /v1/credits, then /credits (back-compat).
 */
export async function fetchCredits(signal?: AbortSignal): Promise<CreditsInfo> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(authHeaders() as any),
  };
  const tok = readToken();
  if (tok && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${tok}`;
  }
  // Never set Content-Type for GET

  const tryUrls = [
    `${apiBase}/api/credits`,
    `${apiBase}/v1/credits`,
    `${apiBase}/credits`,
  ];

  let lastErr: any = null;

  for (const url of tryUrls) {
    try {
      const r = await fetch(url, { headers, signal });
      const ct = r.headers.get("content-type") || "";
      const isJson = ct.toLowerCase().includes("application/json");
      const data: any = isJson ? await r.json() : await r.text();

      if (r.ok) {
        // Accept common shapes: {remaining}, {credits}, {balance}, or nested {data:{credits}}
        const raw =
          (typeof data === "object" && data !== null
            ? data.remaining ?? data.credits ?? data.balance ?? data?.data?.credits
            : null);

        const n = Number(raw);
        if (!Number.isNaN(n) && n >= 0) {
          return { ok: true, remaining: n };
        }
      } else if (isJson && (data as any)?.error) {
        lastErr = (data as any).error;
      }
    } catch (e) {
      lastErr = e;
    }
  }

  return { ok: false, error: String(lastErr || "Unable to load credits") };
}

/** Back-compat: some components import a plain number-returning function. */
export async function fetchCreditBalance(signal?: AbortSignal): Promise<number> {
  const info = await fetchCredits(signal);
  return info.ok ? info.remaining : 0;
}

/** Small helper to print a friendly label like: "Credits — 23" */
export function formatCreditsLabel(info: CreditsInfo): string {
  if (info.ok) return `Credits — ${info.remaining}`;
  return `Credits — ·`;
}

/** Optional: quick inspector for debugging API responses locally. */
export async function fetchCreditDebug(signal?: AbortSignal): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(authHeaders() as any),
  };
  const tok = readToken();
  if (tok && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${tok}`;
  }
  for (const url of [
    `${apiBase}/api/credits`,
    `${apiBase}/v1/credits`,
    `${apiBase}/credits`,
  ]) {
    try {
      const r = await fetch(url, { headers, signal });
      const ct = r.headers.get("content-type") || "";
      return ct.toLowerCase().includes("application/json")
        ? await r.json()
        : await r.text();
    } catch {
      /* try next */
    }
  }
  return null;
}
