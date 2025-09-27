import { apiUrl, ensureApiEndpoints, fetchJson } from "../api/apiBase";

export type CreditsInfo = {
  balance?: number;
  used?: number;
  currency?: string;
  plan?: string;
  requiresAuth?: boolean;
  unsupported?: boolean;
  raw?: unknown;
};

function pickBalance(d: any): number | undefined {
  // Accept multiple shapes: balance_credits (Worker), balance/credits/available (generic)
  return (
    (typeof d?.balance_credits === "number" ? d.balance_credits : undefined) ??
    (typeof d?.balance === "number" ? d.balance : undefined) ??
    (typeof d?.credits === "number" ? d.credits : undefined) ??
    (typeof d?.available === "number" ? d.available : undefined)
  );
}

export async function fetchCredits(): Promise<CreditsInfo> {
  const ep = ensureApiEndpoints();

  // Canonical first; then common fallbacks. De-dup for safety.
  const candidatePaths = Array.from(
    new Set([
      ep.balance,                    // canonical
      "/api/v1/billing/balance",     // v1 fallback
      "/api/billing/balance",        // legacy
      "/balance",
      "/credits",
    ])
  ).map((p) => (/^https?:\/\//i.test(p) ? p : apiUrl(p)));

  let saw404 = false;

  for (const url of candidatePaths) {
    try {
      // fetchJson returns parsed JSON or throws with .status on non-2xx
      const payload = await fetchJson<any>(url, { method: "GET" });
      const d = payload?.data ?? payload ?? {};

      return {
        balance: pickBalance(d),
        used:
          (typeof d?.used === "number" ? d.used : undefined) ??
          (typeof d?.spent === "number" ? d.spent : undefined),
        currency: d?.currency ?? d?.curr ?? undefined,
        plan: d?.plan ?? d?.tier ?? undefined,
        raw: d,
      };
    } catch (e: any) {
      const status = Number(e?.status || 0);
      if (status === 401 || status === 403) {
        return { requiresAuth: true };
      }
      if (status === 404) {
        saw404 = true;
        continue; // try next candidate
      }
      // Any other failure: return the server body (if any) for diagnostics
      return { raw: e?.body ?? null };
    }
  }

  // No working endpoint found
  return saw404 ? { unsupported: true } : { raw: undefined };
}

// Return numeric balance or null
export async function fetchCreditBalance(): Promise<number | null> {
  const info = await fetchCredits();
  return typeof info.balance === "number" ? info.balance : null;
}

// Keep label logic identical, just benefits from the broader parsing above
export function formatCreditsLabel(input: CreditsInfo | number | null | undefined): string {
  if (input == null) return "—";
  if (typeof input === "number") return String(input);

  const info = input as CreditsInfo;
  if (info.requiresAuth) return "Sign in";
  if (info.unsupported) return "—";

  if (typeof info.balance === "number") {
    const v = info.balance;
    if (info.currency && typeof info.currency === "string") return `${v} ${info.currency}`;
    return `${v}`;
  }
  return "—";
}
