// frontend/src/lib/api/apiBase.ts
const v = (import.meta as any)?.env?.VITE_API_BASE?.trim();

// Default to your API worker
export const apiBase: string = v && v.length > 0 ? v : "https://api.cognomega.com";

// Read guest token placed by /auth/guest flow
export function authHeaders(): Record<string, string> {
  const t = (typeof window !== "undefined" ? localStorage.getItem("guest_token") : "") || "";
  const h: Record<string, string> = { Accept: "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}
