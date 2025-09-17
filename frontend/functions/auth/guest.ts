// frontend/functions/auth/guest.ts
// Pages Function: verify Turnstile, then proxy to API /auth/guest to mint the JWT.

type Json = Record<string, unknown>;

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("Origin")) });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const origin = request.headers.get("Origin");
  const CORS = corsHeaders(origin);

  try {
    // Accept either header or form-body token (compat with Turnstile widget)
    let token = request.headers.get("CF-Turnstile-Token") ?? "";
    if (!token) {
      try {
        const fd = await request.clone().formData();
        token = String(fd.get("cf-turnstile-response") ?? "");
      } catch {
        /* ignore – not form-data */
      }
    }
    if (!token) return json({ error: "missing_turnstile" }, 400, CORS);

    // Verify Turnstile
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET, // server-side secret (Pages project)
        response: token,
      }),
    });
    const verify = await verifyRes.json() as Json & { success?: boolean; ["error-codes"]?: string[] };
    if (!verify?.success) {
      return json({ error: "turnstile_failed", code: verify["error-codes"] ?? null }, 403, CORS);
    }

    // Forward to API to mint the guest JWT
    const apiBase = (env.VITE_API_BASE || "https://api.cognomega.com").replace(/\/+$/, "");
    const upstream = await fetch(`${apiBase}/auth/guest`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: "{}", // API expects POST {}
    });

    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    const body = ct.includes("application/json") ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      const msg = typeof body === "string" ? body : (body as any)?.error || `Upstream ${upstream.status}`;
      return json({ error: String(msg) }, upstream.status, CORS);
    }

    return new Response(
      ct.includes("application/json") ? JSON.stringify(body) : String(body),
      {
        status: 200,
        headers: {
          ...CORS,
          "content-type": ct.includes("application/json")
            ? "application/json; charset=utf-8"
            : "text/plain; charset=utf-8",
        },
      }
    );
  } catch (err) {
    return json({ error: "server_error" }, 500, CORS);
  }
};

function corsHeaders(origin: string | null) {
  const allow =
    origin && /^https?:\/\/(localhost(:\d+)?|app\.cognomega\.com)$/i.test(origin)
      ? origin
      : "https://app.cognomega.com";
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "CF-Turnstile-Token, Content-Type, Accept",
    "vary": "Origin",
  };
}

function json(obj: Json, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
