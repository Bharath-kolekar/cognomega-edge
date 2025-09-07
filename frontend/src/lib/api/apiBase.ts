// frontend/src/lib/api/apiBase.ts
const v = (import.meta as any)?.env?.VITE_API_BASE?.trim();
export const apiBase: string = v && v.length > 0 ? v : "https://api.cognomega.com";

const GUEST_TOKEN_KEY = "guest_token";

/** Build headers from the stored guest token (if any). */
export function authHeaders(): Record<string, string> {
  const t = (typeof window !== "undefined" ? localStorage.getItem(GUEST_TOKEN_KEY) : "") || "";
  const h: Record<string, string> = { Accept: "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

/** Ensure we have a guest token; create one if missing. */
export async function ensureGuest(): Promise<string> {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(GUEST_TOKEN_KEY) || "";
  if (t) return t;

  const r = await fetch(`${apiBase}/auth/guest`, { method: "POST", headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`guest auth failed: ${r.status} ${r.statusText}`);
  const j = await r.json();
  t = j?.token || j?.access_token || j?.guest_token || "";
  if (!t) throw new Error("guest auth: missing token in response");
  localStorage.setItem(GUEST_TOKEN_KEY, t);
  return t;
}
