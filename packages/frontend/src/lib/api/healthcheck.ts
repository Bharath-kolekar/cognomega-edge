/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/lib/api/healthcheck.ts
import { apiUrl } from "@/lib/api/apiBase";

export type HealthResult = { ok: boolean; status: number; data: any };

async function getJson(u: string): Promise<HealthResult> {
  try {
    const r = await fetch(u, {
      method: "GET",
      credentials: "omit",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const data = ct.includes("application/json")
      ? await r.json().catch(() => null)
      : await r.text().catch(() => null);
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export async function apiReady(): Promise<HealthResult> {
  // Prefer the canonical worker route
  return getJson(apiUrl("/ready"));
}

export async function apiHealthz(): Promise<HealthResult> {
  // Try /healthz first; fall back to /api/v1/healthz alias
  const first = await getJson(apiUrl("/healthz"));
  if (first.status === 404) return getJson(apiUrl("/api/v1/healthz"));
  return first;
}
