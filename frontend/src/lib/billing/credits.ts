import { apiUrl, ensureApiBase, ensureApiEndpoints, fetchJson } from "../api/apiBase";

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
  await ensureApiBase();
  const ep = await ensureApiEndpoints();

  // Try discovered endpoint first; then known fallbacks (deduped)
  const candidatePaths = [ep.credits, "/api/v1/credits", "/api/credits", "/credits"]
    .filter(Boolean) as string[];

  const candidates = Array.from(new Set(candidatePaths)).map((p) =>
    // If ensureApiEndpoints already gave a full URL, use it as-is
    /^https?:\/\//i.test(p) ? p : apiUrl(p)
  );

  let saw404 = false;

  for (const url of candidates) {
    const r = await fetchJson<any>(url, { method: "GET" });

    if (r.ok) {
      const d = r.data ?? {};
      return {
        balance: pickBalance(d),
        used:
          (typeof d?.used === "number" ? d.used : undefined) ??
          (typeof d?.spent === "number" ? d.spent : undefined),
        currency: d?.currency ?? d?.curr ?? undefined,
        plan: d?.plan ?? d?.tier ?? undefined,
        raw: d,
      };
    }

    // Authorization issue ? tell caller to sign in
    if (r.status === 401 || r.status === 403) {
      return { requiresAuth: true };
    }

    // Keep trying next candidate if this one simply isn’t there
    if (r.status === 404) {
      saw404 = true;
      continue;
    }

    // Any other failure: return the raw data but don’t explode the UI
    return { raw: r.data };
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
