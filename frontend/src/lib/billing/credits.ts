import { ensureApiBase, ensureApiEndpoints, fetchJson } from "../api/apiBase";

export type CreditsInfo = {
  balance?: number;
  used?: number;
  currency?: string;
  plan?: string;
  requiresAuth?: boolean;
  unsupported?: boolean;
  raw?: unknown;
};

export async function fetchCredits(): Promise<CreditsInfo> {
  await ensureApiBase();
  const ep = await ensureApiEndpoints();

  // If the API doesn't expose a credits route, don't spam 404s.
  if (!ep.credits) return { unsupported: true };

  const r = await fetchJson<any>(ep.credits, { method: "GET" });

  if (r.ok) {
    const d = r.data ?? {};
    return {
      balance: d.balance ?? d.credits ?? d.available ?? undefined,
      used: d.used ?? d.spent ?? undefined,
      currency: d.currency ?? d.curr ?? undefined,
      plan: d.plan ?? d.tier ?? undefined,
      raw: d,
    };
  }

  if (r.status === 401 || r.status === 403) {
    return { requiresAuth: true };
  }

  // Other status (including 404) → return shape without throwing
  return { raw: r.data };
}

// Return numeric balance or null
export async function fetchCreditBalance(): Promise<number | null> {
  const info = await fetchCredits();
  return typeof info.balance === "number" ? info.balance : null;
}

// Restore named export used by CreditPill.tsx
export function formatCreditsLabel(input: CreditsInfo | number | null | undefined): string {
  if (input == null) return "—";
  if (typeof input === "number") return String(input);

  const info = input as CreditsInfo;
  if (info.requiresAuth) return "Sign in";
  if (info.unsupported)  return "—";

  if (typeof info.balance === "number") {
    const v = info.balance;
    if (info.currency && typeof info.currency === "string") return `${v} ${info.currency}`;
    return `${v}`;
  }
  return "—";
}
