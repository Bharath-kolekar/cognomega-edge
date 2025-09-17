// @ts-nocheck
/* eslint-env worker */
// Pages Function: verify Turnstile, then call API /auth/guest to mint a JWT.
// No `any` usage to satisfy strict ESLint/TS.

type Env = {
  TURNSTILE_SECRET: string;
  VITE_API_BASE?: string;
};

type Ctx = {
  request: Request;
  env: Env;
};

type Json = Record<string, unknown>;

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  const origin = request.headers.get("Origin");
  const CORS = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, CORS);
  }

  try {
    // Token can arrive via header or form-data field (cf-turnstile-response).
    let token = request.headers.get("CF-Turnstile-Token") ?? "";
    if (!token) {
      try {
        const fd = await request.clone().formData();
        const v = fd.get("cf-turnstile-response");
        if (typeof v === "string") token = v;
      } catch {
        /* not form-data; ignore */
      }
    }
    if (!token) return json({ error: "missing_turnstile" }, 400, CORS);

    // Verify with Cloudflare
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
        }),
      }
    );
    const verify = (await verifyRes.json()) as {
      success?: boolean;
      ["error-codes"]?: string[];
    };
    if (!verify?.success) {
      return json(
        { error: "turnstile_failed", code: verify["error-codes"] ?? null },
        403,
        CORS
      );
    }

    // Proxy to API to mint JWT
    const apiBase = (env.VITE_API_BASE || "https://api.cognomega.com").replace(
      /\/+$/,
      ""
    );
    const upstream = await fetch(`${apiBase}/auth/guest`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}", // API expects POST {}
    });

    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    const body = ct.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      const msg =
        typeof body === "string" ? body : (body as Json)["error"] ?? upstream.statusText;
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
  } catch {
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
    vary: "Origin",
  };
}

function json(obj: Json, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
