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
      } catch { /* ignore */ }
    }
    // Back-compat fallbacks
    const jwt = localStorage.getItem("jwt");
    if (jwt && jwt.trim()) return jwt.trim();
    const guest = localStorage.getItem("guest_token");
    if (guest && guest.trim()) return guest.trim();
  } catch { /* ignore */ }
  return null;
}

/**
 * Fetch remaining credits.
 * Tries /api/credits first, then /credits (back-compat).
 */
export async function fetchCredits(signal?: AbortSignal): Promise<CreditsInfo> {
  const headers: Record<string,string> = {
    Accept: "application/json",
    ...(authHeaders() as any),
  };
  const tok = readToken();
  if (tok && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${tok}`;
  }
  // Never set Content-Type for GET

  const tryUrls = [`${apiBase}/api/credits`, `${apiBase}/credits`];
  let lastErr: any = null;

  for (const url of tryUrls) {
    try {
      const r = await fetch(url, { headers, signal });
      const ct = r.headers.get("content-type") || "";
      const isJson = ct.toLowerCase().includes("application/json");
      const data: any = isJson ? await r.json() : await r.text();

      if (r.ok) {
        // Accept either {remaining} or {credits}
        const n =
          data?.remaining ?? data?.credits ?? data?.balance ?? null;
        if (n !== null && !Number.isNaN(Number(n))) {
          return { ok: true, remaining: Number(n) };
        }
      } else if (isJson && data?.error) {
        lastErr = data.error;
      }
    } catch (e) {
      lastErr = e;
    }
  }

  return { ok: false, error: String(lastErr || "Unable to load credits") };
}

/** Small helper to print a friendly label like: "Credits — 23" */
export function formatCreditsLabel(info: CreditsInfo): string {
  if (info.ok) return `Credits — ${info.remaining}`;
  return `Credits — ·`;
}
