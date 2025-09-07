import { apiBase } from "../api/apiBase";

export async function fetchCreditBalance(): Promise<number|null> {
  try {
    const res = await fetch(`${apiBase}/healthz`, {
      method: "GET",
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    // Read balance from header if exposed by the edge/backend
    const hdr = res.headers.get("X-Credits-Balance");
    if (hdr !== null) {
      const n = Number(hdr);
      if (Number.isFinite(n)) return n;
    }
    // No header? Gracefully return null (pill shows "â€”")
    return null;
  } catch {
    return null;
  }
}