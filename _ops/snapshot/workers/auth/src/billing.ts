export interface BillingEnv {
  KV_BILLING: KVNamespace;
  ADMIN_KEY?: string;
  CORS_ALLOWLIST?: string;
  CREDITS_RATE_PER_1K?: string;
}

const USAGE_ALIASES = new Set<string>([
  "/api/billing/usage",
  "/billing/usage",
  "/api/usage",
  "/usage",
  "/api/v1/usage",
]);

const CREDITS_ALIASES = new Set<string>([
  "/api/credits",
  "/credits",
  "/api/v1/credits",
]);

function parseAllowlist(env: BillingEnv): string[] {
  const raw = (env.CORS_ALLOWLIST || "").trim();
  if (!raw) {
    return [
      "https://app.cognomega.com",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function cors(origin: string | null, env: BillingEnv): Record<string, string> {
  const allow = parseAllowlist(env);
  const ok = origin && allow.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Admin-Key, X-User-Email",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

function jres(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function text(body: string, status = 200, headers: HeadersInit = {}) {
  return new Response(body, { status, headers });
}

async function readJson<T>(req: Request): Promise<T | Record<string, never>> {
  try {
    return (await req.json()) as T;
  } catch {
    return {};
  }
}

function getEmail(req: Request, url: URL): string {
  return (
    req.headers.get("x-user-email")?.trim() ||
    url.searchParams.get("email")?.trim() ||
    "guest@local"
  );
}

function rate(env: BillingEnv): number {
  const s = env.CREDITS_RATE_PER_1K;
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getBalance(env: BillingEnv, email: string): Promise<number> {
  const key = `balance::${email}`;
  const cur = await env.KV_BILLING.get(key, "text");
  return Number(cur ?? "0");
}

async function setBalance(
  env: BillingEnv,
  email: string,
  value: number
): Promise<number> {
  const key = `balance::${email}`;
  await env.KV_BILLING.put(key, String(value));
  return value;
}

async function incBalance(
  env: BillingEnv,
  email: string,
  delta: number
): Promise<number> {
  const cur = await getBalance(env, email);
  const next = cur + delta;
  await setBalance(env, email, next);
  return next;
}

async function recordUsage(
  env: BillingEnv,
  email: string,
  rec: any
): Promise<{ key: string }> {
  const date = todayISO();
  const id = crypto.randomUUID();
  const key = `usage::${email}::${date}::${id}`;
  await env.KV_BILLING.put(key, JSON.stringify(rec));

  // Aggregate running totals
  const aggKey = `usage:agg::${email}`;
  const agg =
    ((await env.KV_BILLING.get(aggKey, "json")) as any) ||
    ({ total_count: 0, tokens_in: 0, tokens_out: 0, credits_used: 0 } as const);

  const next = {
    total_count: (agg.total_count || 0) + 1,
    tokens_in: (agg.tokens_in || 0) + (typeof rec.tokens_in === "number" ? rec.tokens_in : 0),
    tokens_out: (agg.tokens_out || 0) + (typeof rec.tokens_out === "number" ? rec.tokens_out : 0),
    credits_used: (agg.credits_used || 0) + (typeof rec.credits_used === "number" ? rec.credits_used : 0),
  };
  await env.KV_BILLING.put(aggKey, JSON.stringify(next));

  return { key };
}

async function getUsage(
  env: BillingEnv,
  email: string,
  detail: boolean
): Promise<any> {
  const agg =
    ((await env.KV_BILLING.get(`usage:agg::${email}`, "json")) as any) || {
      total_count: 0,
      tokens_in: 0,
      tokens_out: 0,
      credits_used: 0,
    };

  if (!detail) {
    return { email, aggregate: agg };
  }

  // Return the latest up to 100 records (paginated KV list)
  const prefix = `usage::${email}::`;
  const items: any[] = [];
  let cursor: string | undefined = undefined;

  while (items.length < 100) {
    const list = await env.KV_BILLING.list({ prefix, cursor });
    for (const k of list.keys) {
      if (items.length >= 100) break;
      const v = await env.KV_BILLING.get(k.name, "json");
      items.push({ key: k.name, ...((v as any) ?? {}) });
    }
    if (list.list_complete) break;
    cursor = list.cursor;
  }

  return { email, aggregate: agg, items };
}

/**
 * maybeHandleBilling:
 * Call this early in your fetch() to serve usage/credits endpoints.
 * Returns Response if handled; otherwise null.
 */
export async function maybeHandleBilling(
  req: Request,
  env: BillingEnv,
  _ctx: ExecutionContext
): Promise<Response | null> {
  const url = new URL(req.url);
  const origin = req.headers.get("Origin");
  const headers = cors(origin, env);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    if (USAGE_ALIASES.has(path) || CREDITS_ALIASES.has(path)) {
      return new Response(null, { status: 204, headers });
    }
    return null;
  }

  // ---- USAGE ----
  if (USAGE_ALIASES.has(path)) {
    const email = getEmail(req, url);

    if (req.method === "GET") {
      const detail = url.searchParams.get("detail") === "1";
      const data = await getUsage(env, email, detail);
      return jres(data, 200, headers);
    }

    if (req.method === "POST") {
      const body: any = await readJson(req);
      const tokens_in = Number(body?.tokens_in ?? 0);
      const tokens_out = Number(body?.tokens_out ?? 0);

      let credits_used = Number(body?.credits_used);
      if (!Number.isFinite(credits_used)) {
        const r = rate(env);
        credits_used = r > 0 ? ((tokens_in + tokens_out) / 1000) * r : 0;
      }

      const rec = {
        ts: new Date().toISOString(),
        provider: body?.provider ?? null,
        model: body?.model ?? null,
        tokens_in,
        tokens_out,
        credits_used,
        meta: body?.meta ?? null,
      };

      await recordUsage(env, email, rec);

      // Auto-debit account if credits_used > 0
      let balance = await getBalance(env, email);
      if (credits_used > 0) {
        balance = await incBalance(env, email, -credits_used);
      }

      return jres({ ok: true, email, balance, recorded: rec }, 200, headers);
    }

    return text("Method Not Allowed", 405, headers);
  }

  // ---- CREDITS ----
  if (CREDITS_ALIASES.has(path)) {
    const email = getEmail(req, url);

    if (req.method === "GET") {
      const balance = await getBalance(env, email);
      return jres({ email, balance }, 200, headers);
    }

    if (req.method === "POST") {
      const admin = (req.headers.get("x-admin-key") || "").trim();
      if (!admin || !env.ADMIN_KEY || admin !== env.ADMIN_KEY) {
        return jres({ error: "forbidden" }, 403, headers);
      }

      const body: any = await readJson(req);
      const op = String(body?.op ?? "inc");
      const amount = Number(body?.amount ?? 0);

      let balance: number;
      if (op === "set") balance = await setBalance(env, email, amount);
      else if (op === "dec") balance = await incBalance(env, email, -amount);
      else balance = await incBalance(env, email, amount);

      return jres({ ok: true, email, balance }, 200, headers);
    }

    return text("Method Not Allowed", 405, headers);
  }

  return null;
}