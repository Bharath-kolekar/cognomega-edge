// Cloudflare Pages Function for /auth/guest
// - Accepts GET or POST (so the browser never sees 405)
// - If TURNSTILE_SECRET is set, verifies the Turnstile token from header CF-Turnstile-Token
// - Proxies to upstream guest token issuers (existing fallbacks) and normalizes the result

type TokenResult = { token: string; exp?: number } | null;

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, CF-Turnstile-Token, Authorization",
  };
}

function json(data: any, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...(headers || {}) },
  });
}

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  if (!secret) return true; // allow if not configured
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  try {
    const r = await fetch(VERIFY_URL, { method: "POST", body: form });
    const body = await r.json().catch(() => ({}));
    return !!body?.success;
  } catch {
    return false;
  }
}

async function parseTokenResponse(r: Response): Promise<TokenResult> {
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const data: any = ct.includes("application/json") ? await r.json() : await r.text();

  const token =
    (typeof data === "string" ? data : data?.token || data?.jwt || data?.guest_token || data?.access_token) || null;
  if (!token) return null;

  const exp = typeof data === "object" ? Number(data?.exp ?? data?.expires_at) : undefined;
  return { token: String(token), exp: Number.isFinite(exp) ? Number(exp) : undefined };
}

async function mintGuestFromUpstream(origin: string): Promise<TokenResult> {
  const candidates = [
    `${origin}/auth/guest`,       // in case you later replace this function with an origin handler
    `${origin}/api/auth/guest`,
    `${origin}/api/gen-jwt`,
    `${origin}/gen-jwt`,
  ];

  for (const url of candidates) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) continue;
      const parsed = await parseTokenResponse(r);
      if (parsed?.token) return parsed;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function handler(ctx: EventContext<{ TURNSTILE_SECRET: string }>) {
  const { request, env } = ctx;
  const headers = corsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const tsToken = request.headers.get("CF-Turnstile-Token") || "";
  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(tsToken, env.TURNSTILE_SECRET);
    if (!ok) return json({ error: "turnstile_failed" }, 403, headers);
  }

  const origin = new URL(request.url).origin;
  const minted = await mintGuestFromUpstream(origin);
  if (minted?.token) return json(minted, 200, headers);

  return json({ error: "jwt_unavailable" }, 502, headers);
}

export const onRequestGet: PagesFunction = handler;
export const onRequestPost: PagesFunction = handler;
export const onRequestOptions: PagesFunction = handler;
