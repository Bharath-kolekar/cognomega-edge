// api/src/index.ts
// --- Auth/Billing/Jobs/AI routes ---
import { registerAuthBillingRoutes } from "./modules/auth_billing";

// If your file defines an Env type for Bindings, ensure it includes:
// AI: any;
// KEYS: KVNamespace;
// KV_BILLING: KVNamespace;
// R2_UPLOADS: R2Bucket;
// And the vars used by the module (ALLOWED_ORIGINS, PRIVATE_KEY_PEM, GROQ_API_KEY, OPENAI_API_KEY,
// ADMIN_API_KEY, JWT_TTL_SEC, KID, ISSUER, PREFERRED_PROVIDER, GROQ_MODEL, CF_AI_MODEL, OPENAI_MODEL,
// OPENAI_BASE, GROQ_BASE, CREDIT_PER_1K, MAX_UPLOAD_BYTES, WARN_CREDITS).

// Hono + Neon + multi-provider LLM router (Groq / Workers AI / OpenAI)
// Billing (credits), usage feed, SI skills (sketch_to_app queue),
// admin processor (uploads artifact to R2), job download.
// Immediate background trigger after enqueue (internal-only) + cron fallback.
// STRICT CORS: single env-driven layer (preflight + response), no duplicates.

import { Hono, Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// --- Top-level CORS preflight (put before routes) ---
const BASE_ALLOW_HEADERS = [
  "Authorization",
  "Content-Type",
  "X-User-Email",
  "x-user-email",
  "X-Admin-Key",
  "X-Admin-Token",
  "X-Intelligence-Tier",
  "x-intelligence-tier",
];

// --- Request ID helpers (consistent everywhere) ---
function requestIdFrom(req: Request): string {
  return req.headers.get("cf-ray") || crypto.randomUUID();
}
const EXPOSE_ALWAYS = [
  "Content-Type",
  "Content-Disposition",
  "X-Request-Id",
  "X-Credits-Used",
  "X-Credits-Balance",
  "X-Tokens-In",
  "X-Tokens-Out",
  "X-Provider",
  "X-Model",
];

/**
 * Unified origin allow-list:
 * - Exact matches from ALLOWED_ORIGINS (comma-separated)
 * - Stable Pages domain + preview subdomains
 * - Local dev origins
 */
function pickAllowedOrigin(req: Request, env: Env): string {
  const origin = req.headers.get("Origin") || "";
  if (!origin) return "";
  const cfPagesStable = "https://cognomega-frontend.pages.dev";
  const allowed = (String(env.ALLOWED_ORIGINS || "") || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const isPreview = /^https:\/\/[a-z0-9-]+\.cognomega-frontend\.pages\.dev$/i.test(origin);
  const isLocal = origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173";
  if (allowed.includes(origin) || origin === cfPagesStable || isPreview || isLocal) return origin;
  return "";
}

// ---- Bindings & Context ----

type R2Bucket = {
  get: (key: string) => Promise<
    | {
        body: ReadableStream | null;
        httpMetadata?: { contentType?: string | null } | null;
      }
    | null
  >;
  put: (
    key: string,
    value: ArrayBuffer | string | ReadableStream,
    opts?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }
  ) => Promise<void>;
};

/**
 * Superset Env used by auth/billing/jobs/AI module + existing API.
 * (We keep your original fields and add the module’s requirements.)
 */
export interface Env {
  /* ---------- Vars (string values from Wrangler) ---------- */
  ALLOWED_ORIGINS?: string;      // e.g. "https://app.cognomega.com"
  ISSUER?: string;               // e.g. "https://api.cognomega.com"
  JWT_TTL_SEC?: string;          // e.g. "3600"
  KID?: string;                  // e.g. "k1"

  // AI selection & models
  PREFERRED_PROVIDER?: string;   // "groq,cfai,openai"
  GROQ_MODEL?: string;           // "llama-3.1-8b-instant"
  CF_AI_MODEL?: string;          // "@cf/meta/llama-3.1-8b-instruct"
  OPENAI_MODEL?: string;         // "gpt-4o-mini"
  OPENAI_BASE?: string;          // default "https://api.openai.com/v1"
  GROQ_BASE?: string;            // default "https://api.groq.com/openai/v1"

  // Credits/usage pricing
  CREDIT_PER_1K?: string;        // e.g. "0.05"
  WARN_CREDITS?: string;         // warn threshold; default 10

  // Uploads
  MAX_UPLOAD_BYTES?: string;     // e.g. "10485760" (10MB)

  /* ---------- Secrets ---------- */
  PRIVATE_KEY_PEM?: string;      // RS256 signing key (PEM)
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ADMIN_API_KEY?: string;        // for /api/credits/adjust + admin routes

  // Voice/TTS (already bound in your worker — safe to keep)
  CARTESIA_API_KEY?: string;

  /* ---------- Bindings required by the new module ---------- */
  AI: Ai;                        // Workers AI binding
  KEYS: KVNamespace;             // public JWKS (key "jwks")
  KV_BILLING: KVNamespace;       // credits + usage + jobs
  R2_UPLOADS: R2Bucket;          // direct-upload bucket

  /* ---------- New: per-user voice preferences ---------- */
  KV_PREFS: KVNamespace;         // per-user voice preferences

  /* ---------- Your existing fields (kept intact) ---------- */
  DATABASE_URL?: string;
  NEON_DATABASE_URL?: string;

  ADMIN_KEY?: string;
  ADMIN_TASK_SECRET?: string;

  LLM_PROVIDER?: "groq" | "openai" | "workers_ai";
  LLM_MODEL?: string;

  // Your existing R2 binding used by /v1/files/upload
  R2?: R2Bucket;
}

/** (Legacy) Original Bindings type — kept for reference. Prefer Env above. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Bindings = {
  AI: Ai; // Workers AI binding

  // Database
  DATABASE_URL?: string;
  NEON_DATABASE_URL?: string;

  // Admin control
  ADMIN_KEY?: string;
  ADMIN_TASK_SECRET?: string;

  // TTS providers
  CARTESIA_API_KEY?: string;

  // LLM keys
  OPENAI_API_KEY?: string;
  GROQ_API_KEY?: string;

  // LLM defaults
  LLM_PROVIDER?: "groq" | "openai" | "workers_ai";
  LLM_MODEL?: string;

  // Storage
  R2?: R2Bucket;
};

type CtxVars = {
  email?: string;
  userId?: string;
  rid?: string;
};

// Use Env for Bindings, keep your Variables intact
const app = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// -------- Global middleware: Preflight + CORS + Request ID --------
app.use("*", async (c, next) => {
  const req = c.req.raw;
  const env = c.env;
  const rid = requestIdFrom(req);
  c.set("rid", rid);

  if (req.method === "OPTIONS") {
    const allow = pickAllowedOrigin(req, env);
    const requested = (req.headers.get("Access-Control-Request-Headers") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...BASE_ALLOW_HEADERS, ...requested]));

    const h = new Headers();
    if (allow) h.set("Access-Control-Allow-Origin", allow);
    h.set("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    h.set("Access-Control-Allow-Credentials", "true");
    h.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH");
    h.set("Access-Control-Allow-Headers", merged.join(", "));
    h.set("Access-Control-Max-Age", "86400");
    h.set("X-Request-Id", rid);
    // Expose standard headers (no harm on preflight)
    h.set("Access-Control-Expose-Headers", EXPOSE_ALWAYS.join(", "));
    return new Response(null, { status: 204, headers: h });
  }

  await next();

  // Add CORS on normal responses
  const allow = pickAllowedOrigin(req, env);
  if (allow) c.res.headers.set("Access-Control-Allow-Origin", allow);
  c.res.headers.set("Access-Control-Allow-Credentials", "true"); 
  c.res.headers.append("Vary", "Origin");

  // Ensure X-Request-Id is present; preserve if already set (e.g., module)
  if (!c.res.headers.get("X-Request-Id")) {
    c.res.headers.set("X-Request-Id", rid);
  }

  // Merge expose headers (never clobber what a route already set)
  const currentExpose = (c.res.headers.get("Access-Control-Expose-Headers") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mergedExpose = Array.from(new Set([...currentExpose, ...EXPOSE_ALWAYS]));
  if (mergedExpose.length) {
    c.res.headers.set("Access-Control-Expose-Headers", mergedExpose.join(", "));
  }
});

// 1) Workers AI binding probe (used for sanity checks)
app.get("/api/ai/binding", (c) => {
  const ok = !!c.env.AI && typeof (c.env.AI as Ai).run === "function";
  return c.json({ ai_bound: ok }, ok ? 200 : 500);
});

// 2) Serve JWKS from KV so clients can verify our RS256 JWTs
app.get("/.well-known/jwks.json", async (c) => {
  const raw = await c.env.KEYS.get("jwks");
  const body = raw ?? JSON.stringify({ keys: [] });
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      // X-Request-Id will be added by post-route middleware
    },
  });
});

/* ===========================
   Hunk B — Mount new routes
   =========================== */
// ---- Mount Auth/Billing/Usage/Jobs/AI routes ----
registerAuthBillingRoutes(app);

// -------- Helpers --------
const sqlFor = (c: Context<{ Bindings: Env }>) => {
  const dsn = c.env.DATABASE_URL || c.env.NEON_DATABASE_URL;
  if (!dsn) throw new HTTPException(500, { message: "DATABASE_URL not set" });
  return neon(dsn);
};

const nowIso = () => new Date().toISOString();
const estTokens = (s: string) => Math.ceil((s || "").length / 4);

// Pricing (credits)
const TOKENS_PER_CREDIT = 1000;
const HARD_STOP_BELOW = 1;

// env-driven warn credits (default 10)
function warnCredits(env: Env): number {
  const n = Number(env.WARN_CREDITS ?? "10");
  return Number.isFinite(n) && n > 0 ? Number(n.toFixed(3)) : 10;
}

type BalanceLike = number | { [key: string]: unknown } | null | undefined;

function parseBalance(raw: BalanceLike): number {
  const toFinite = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["balance_credits", "balance", "credits", "available"]) {
      if (key in obj) {
        const parsed = toFinite(obj[key]);
        if (parsed != null) return parsed;
      }
    }
  }

  const fallback = toFinite(raw);
  return fallback ?? 0;
}

function balanceResponse(raw: BalanceLike, env: Env) {
  const balance = parseBalance(raw);
  const payload: {
    balance: number;
    balance_credits: number;
    warn_credits: number;
    updated_at?: string;
  } = {
    balance,
    balance_credits: balance,
    warn_credits: warnCredits(env),
  };

  if (raw && typeof raw === "object") {
    const updatedAt = (raw as Record<string, unknown>).updated_at;
    if (typeof updatedAt === "string" && updatedAt.trim()) {
      payload.updated_at = updatedAt;
    }
  }

  return payload;
}

// -------- LLM router --------
function defaultModel(provider: string) {
  if (provider === "groq") return "llama-3.1-8b-instant";
  if (provider === "openai") return "gpt-4o-mini";
  return "@cf/meta/llama-3.1-8b-instruct"; // Workers AI
}

async function runProvider(
  c: Context<{ Bindings: Env }>,
  provider: "groq" | "openai" | "workers_ai",
  model: string,
  p: { prompt: string; system: string | null; max_tokens: number; temperature: number }
): Promise<string> {
  const { prompt, system, max_tokens, temperature } = p;

  if (provider === "groq") {
    const key = c.env.GROQ_API_KEY;
    if (!key) throw new Error("Missing GROQ_API_KEY");
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const body = {
      model,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
      max_tokens,
      temperature,
    };
    const r = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Read JSON once, then throw a typed HTTPException if not ok
    const j: { choices?: Array<{ message?: { content?: string } }> } = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detail = j && Object.keys(j).length ? JSON.stringify(j) : String(r.statusText || "");
      throw new HTTPException(502, { message: `groq_error:${r.status} ${detail}` });
    }

    const text: string = j?.choices?.[0]?.message?.content?.toString() ?? "";
    return text.trim();
  }

  if (provider === "openai") {
    const key = c.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");
    const url = "https://api.openai.com/v1/chat/completions";
    const body = {
      model,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
      max_tokens,
      temperature,
    };
    const r = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const j: { choices?: Array<{ message?: { content?: string } }> } = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detail = j && Object.keys(j).length ? JSON.stringify(j) : String(r.statusText || "");
      throw new HTTPException(502, { message: `openai_error:${r.status} ${detail}` });
    }

    const text: string = j?.choices?.[0]?.message?.content?.toString() ?? "";
    return text.trim();
  }

  // workers_ai
  if (!c.env.AI) throw new Error("Workers AI binding missing (env.AI)");
  const input = {
    prompt: system ? `${system}\n\n${prompt}` : prompt,
    max_tokens,
    temperature,
  };
  const out = await c.env.AI.run(model, input);
  const text: string =
    out?.response?.toString() ??
    out?.result?.response?.toString() ??
    out?.choices?.[0]?.message?.content?.toString() ??
    "";
  if (!text) throw new Error("workers_ai_empty_response");
  return text.trim();
}

async function completeWithProvider(c: Context<{ Bindings: Env }>, body: { prompt?: string; system?: string | null; max_tokens?: number; temperature?: number }) {
  const askedProvider =
    (c.req.header("x-llm-provider") as string | undefined) || c.env.LLM_PROVIDER || "groq";
  const askedModel =
    c.req.header("x-llm-model") || c.env.LLM_MODEL || defaultModel(askedProvider);

  const prompt: string = body?.prompt ?? "";
  const system: string | null = body?.system ?? null;
  const max_tokens: number = Math.min(Number(body?.max_tokens ?? 256), 2048);
  const temperature: number = Math.max(0, Math.min(Number(body?.temperature ?? 0.2), 1));

  if (!prompt) throw new HTTPException(400, { message: "Missing prompt" });

  const providers: Array<"groq" | "workers_ai" | "openai"> = [
    askedProvider as "groq" | "workers_ai" | "openai",
    ...(askedProvider === "groq" ? (["workers_ai", "openai"] as const) : []),
    ...(askedProvider === "workers_ai" ? (["groq", "openai"] as const) : []),
    ...(askedProvider === "openai" ? (["groq", "workers_ai"] as const) : []),
  ];

  let lastErr: Error | null = null;
  for (const p of providers) {
    try {
      const model = p === askedProvider ? askedModel : defaultModel(p);
      const text = await runProvider(c, p, model, { prompt, system, max_tokens, temperature });
      return { text, provider: p, model };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw new HTTPException(502, { message: "All providers failed", cause: lastErr });
}

// -------- DB helpers --------
async function ensureSchema(_c: Context<{ Bindings: Env }>, sql: NeonQueryFunction<false, false>) {
  // Try extension; some platforms disallow CREATE EXTENSION.
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  } catch {
    // ignore
  }

  await sql`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS credit_txn (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_credits NUMERIC(18,6) NOT NULL,
    reason TEXT NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS usage_event (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    tokens_in INT NOT NULL DEFAULT 0,
    tokens_out INT NOT NULL DEFAULT 0,
    r2_class_a INT NOT NULL DEFAULT 0,
    r2_class_b INT NOT NULL DEFAULT 0,
    r2_gb_retrieved NUMERIC(18,6) NOT NULL DEFAULT 0,
    cost_credits NUMERIC(18,6) NOT NULL DEFAULT 0,
    request_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_credit_txn_user_time ON credit_txn(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_usage_event_user_time ON usage_event(user_id, created_at DESC)`;
}

async function ensureUserByEmail(sql: NeonQueryFunction<false, false>, email: string): Promise<string> {
  const r = await sql<{ id: string }>`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (r.length) return r[0].id;

  const newId = crypto.randomUUID();
  await sql`INSERT INTO users (id, email) VALUES (${newId}, ${email})`;
  return newId;
}

async function getBalance(sql: NeonQueryFunction<false, false>, userId: string): Promise<number> {
  const r = await sql<{ bal: string }>`
    SELECT COALESCE(SUM(amount_credits), 0)::text AS bal
    FROM credit_txn WHERE user_id = ${userId}
  `;
  return Number(r?.[0]?.bal ?? "0");
}

function creditsForTokens(tokensIn: number, tokensOut: number) {
  const t = (tokensIn + tokensOut) / TOKENS_PER_CREDIT;
  return Number(t.toFixed(3));
}

// -------- Health & Auth --------
app.get("/healthz", (c) => c.json({ ok: true, when: nowIso() }));
app.get("/api/v1/healthz", (c) => c.json({ ok: true, when: nowIso() })); // alias

// extra health aliases (for older UI calls)
app.get("/health", (c) => c.json({ ok: true, when: nowIso() }));
app.get("/api/health", (c) => c.json({ ok: true, when: nowIso() }));

app.get("/ready", (c) => {
  const provider = c.env.LLM_PROVIDER || "groq";
  const model = c.env.LLM_MODEL || defaultModel(provider);
  return c.json({ ok: true, provider, model });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.post("/auth/guest", async (_c) => {
  const token = crypto.randomUUID();
  const expires_in = 600;
  return new Response(JSON.stringify({ token, expires_in }), {
    headers: { "content-type": "application/json" },
  });
});

// -------- Upload + enqueue job (WITH immediate internal trigger) --------
/**
 * POST /v1/files/upload
 * Headers:
 *   Authorization: Bearer <guest token>
 *   (optional) CF-Turnstile-Token: <token>
 * Body:
 *   multipart/form-data: file=<blob>, prompt=<optional>
 * Returns: { ok, key, size, job_id, status: "queued" }
 */
app.post("/v1/files/upload", async (c) => {
  // 1) Basic bearer check
  const auth = c.req.header("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return c.json({ error: "unauthorized" }, 401);
  }

  // 2) Parse form-data
  const form = await c.req.formData();
  const file = form.get("file");
  const prompt = (form.get("prompt") || "").toString();
  if (!(file instanceof File)) {
    return c.json({ error: "file_missing" }, 400);
  }

  if (!c.env.R2) {
    return c.json({ error: "r2_unavailable" }, 500);
  }

  // 3) Store to R2
  const name = (file as File).name || "upload";
  const ct = (file as File).type || "application/octet-stream";
  const ext = name.includes(".") ? name.split(".").pop()! : (ct.split("/")[1] || "bin");
  const key = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const buf = await (file as File).arrayBuffer();
  await c.env.R2.put(key, buf, { httpMetadata: { contentType: ct } });

  // 4) Create a queued job tied to this upload
  const email = c.req.header("x-user-email") || c.req.query("email") || "anon@cognomega.local";
  const sql = sqlFor(c);
  await ensureSchema(c, sql);
  await sql`
    CREATE TABLE IF NOT EXISTS job (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_text TEXT NOT NULL,
      status TEXT NOT NULL,
      progress NUMERIC(5,2) NOT NULL DEFAULT 0,
      r2_url TEXT,
      result_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  const jobId = crypto.randomUUID();
  const payload = { email, r2_key: key, prompt };

  await sql`
    INSERT INTO job (id, user_email, type, payload_text, status)
    VALUES (${jobId}, ${email}, 'sketch_to_app', ${JSON.stringify(payload)}, 'queued')
  `;

  // 5) Eager background trigger (internal-only). Cron remains as fallback.
  const rid = (c.get("rid") as string) || requestIdFrom(c.req.raw);
  c.executionCtx.waitUntil(
    (async () => {
      try {
        console.log(`[trigger rid=${rid}] internal start job_id=${jobId}`);
        const resp = await app.fetch(
          new Request("http://internal/admin/process-one", {
            method: "POST",
            headers: { "x-admin-task": c.env.ADMIN_TASK_SECRET || "" },
          }),
          c.env as Env,
          c.executionCtx
        );
        console.log(`[trigger rid=${rid}] internal status=${resp.status}`);
      } catch (e) {
        console.log(`[trigger rid=${rid}] internal error=${String(e)}`);
      }
    })()
  );

  // 6) Response
  return c.json({ ok: true, key, size: buf.byteLength, job_id: jobId, status: "queued" });
});

// -------- LLM Complete --------
app.post("/api/v1/llm/complete", async (c) => {
  try {
    const body = await c.req.json();
    const { text, provider, model } = await completeWithProvider(c, body);
    return c.json({ text, provider, model });
  } catch (e: unknown) {
    const error = e as Error;
    const status = e instanceof HTTPException ? e.status : 500;
    return c.json(
      { error: "upstream_error", status, detail: String((error as { cause?: string })?.cause || error?.message || error) },
      status
    );
  }
});

// -------- Billing --------
app.get("/api/billing/balance", async (c) => {
  const email = c.req.header("x-user-email") || c.req.query("email") || "anon@cognomega.local";
  const sql = sqlFor(c);
  await ensureSchema(c, sql);
  const uid = await ensureUserByEmail(sql, email);
  const bal = await getBalance(sql, uid);
  return c.json(balanceResponse(bal, c.env));
});

// alias: older UI calls /api/credits
app.get("/api/credits", async (c) => {
  const email = c.req.header("x-user-email") || c.req.query("email") || "anon@cognomega.local";
  const sql = sqlFor(c);
  await ensureSchema(c, sql);
  const uid = await ensureUserByEmail(sql, email);
  const bal = await getBalance(sql, uid);
  return c.json(balanceResponse(bal, c.env));
});

app.get("/api/billing/usage", async (c) => {
  const email = c.req.header("x-user-email") || c.req.query("email") || "anon@cognomega.local";
  const sql = sqlFor(c);
  await ensureSchema(c, sql);
  const uid = await ensureUserByEmail(sql, email);
  const rows = (await sql`
    SELECT
      created_at,
      route,
      provider,
      model,
      tokens_in,
      tokens_out,
      cost_credits::float AS cost_credits
    FROM usage_event
    WHERE user_id = ${uid}
    ORDER BY created_at DESC
    LIMIT 50
  `) as Array<Record<string, unknown>>;
  return c.json({ events: rows });
});

// aliases for usage (older UI variations)
app.get("/api/v1/billing/usage", (c) =>
  app.fetch(new Request(c.req.url.replace("/api/v1", "/api")), c.env as Env, c.executionCtx)
);
app.get("/billing/usage", (c) =>
  app.fetch(new Request(c.req.url.replace("/billing/usage", "/api/billing/usage")), c.env as Env, c.executionCtx)
);
app.get("/api/usage", (c) =>
  app.fetch(new Request(c.req.url.replace("/api/usage", "/api/billing/usage")), c.env as Env, c.executionCtx)
);
app.get("/usage", (c) =>
  app.fetch(new Request(c.req.url.replace("/usage", "/api/billing/usage")), c.env as Env, c.executionCtx)
);

// -------- SI skills (with queue path) --------
app.post("/api/si/ask", async (c) => {
  const sql = sqlFor(c);
  await ensureSchema(c, sql);

  const email = c.req.header("x-user-email") || c.req.query("email") || "anon@cognomega.local";
  const userId = await ensureUserByEmail(sql, email);

  const bal = await getBalance(sql, userId);
  if (bal < HARD_STOP_BELOW) {
    c.header("X-Credits-Balance", String(bal));
    return c.json({ error: "insufficient_credits", balance: bal }, 402);
  }

  const body = await c.req.json().catch(() => ({}));
  const skill: string = String(body?.skill || "").trim();
  const input: string = String(body?.input || "").trim();
  const requestId = (c.get("rid") as string) || requestIdFrom(c.req.raw);

  // Queueable skill
  if (skill === "sketch_to_app") {
    await sql`
      CREATE TABLE IF NOT EXISTS job (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        type TEXT NOT NULL,
        payload_text TEXT NOT NULL,
        status TEXT NOT NULL,
        progress NUMERIC(5,2) NOT NULL DEFAULT 0,
        r2_url TEXT,
        result_text TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    const jobId = crypto.randomUUID();
    const payloadText = JSON.stringify({
      email,
      spec: input || (typeof body?.spec === "string" ? body.spec : ""),
      extras: typeof body?.extras === "object" ? body.extras : {},
    });
    await sql`
      INSERT INTO job (id, user_email, type, payload_text, status)
      VALUES (${jobId}, ${email}, 'sketch_to_app', ${payloadText}, 'queued')
    `;

    // Eager trigger here as well for consistency
    c.executionCtx.waitUntil(
      (async () => {
        try {
          console.log(`[trigger rid=${requestId}] internal start job_id=${jobId}`);
          const resp = await app.fetch(
            new Request("http://internal/admin/process-one", {
              method: "POST",
              headers: { "x-admin-task": c.env.ADMIN_TASK_SECRET || "" },
            }),
            c.env as Env,
            c.executionCtx
          );
          console.log(`[trigger rid=${requestId}] internal status=${resp.status}`);
        } catch (e) {
          console.log(`[trigger rid=${requestId}] internal error=${String(e)}`);
        }
      })()
    );

    c.header("X-Job-Id", jobId);
    // Ensure canonical casing:
    c.header("X-Request-Id", requestId);
    return c.json({ ok: true, job_id: jobId, status: "queued" }, 202);
  }

  // Non-queue skills (billed)
  const skillToSystem: Record<string, string> = {
    summarize: "You are a precise summarizer. Output 5 crisp bullets only.",
    explain: "Explain simply for a smart 12-year-old. Use short sentences.",
    action_items:
      "Extract ordered, actionable tasks. Start each with a verb. Include owners if present.",
    translate: "Translate to the requested language. Keep meaning; no extra commentary.",
    rag_lite: "Answer concisely. If unsure, say what info is needed. Avoid speculation.",
    voice_reply: "Compose a short spoken-style answer (2-4 sentences).",
  };

  if (!skill || !(skill in skillToSystem)) {
    return c.json({ error: "unknown_skill", skill }, 400);
  }

  const sys =
    skill === "translate" && typeof body?.extras?.to === "string"
      ? `Translate into ${String(body.extras.to).slice(0, 20)}. Keep meaning; no extra commentary.`
      : skillToSystem[skill];

  let text = "";
  let provider = "";
  let model = "";
  try {
    const out = await completeWithProvider(c, {
      prompt: input,
      system: sys,
      max_tokens: Number(body?.max_tokens ?? 400),
      temperature: Number(body?.temperature ?? 0.2),
    });
    text = out.text;
    provider = out.provider;
    model = out.model;
  } catch {
    const head = (input || "").slice(0, 240).replace(/\s+/g, " ").trim();
    text = `[DEGRADED:LLM] Unable to reach model. Showing a concise extract:\n${head}`;
    provider = "degraded";
    model = "n/a";
  }

  const tokens_in = estTokens(input);
  const tokens_out = estTokens(text);
  const cost = creditsForTokens(tokens_in, tokens_out);

  await sql`
    INSERT INTO usage_event
      (user_id, route, provider, model, tokens_in, tokens_out, r2_class_a, r2_class_b, r2_gb_retrieved, cost_credits, request_id)
    VALUES
      (${userId}, '/api/si/ask', ${provider}, ${model}, ${tokens_in}, ${tokens_out}, 0, 0, 0, ${cost}, ${requestId})
  `;

  await sql`
    INSERT INTO credit_txn (user_id, amount_credits, reason, meta)
    VALUES (${userId}, ${-cost}, ${"usage:/api/si/ask"}, ${JSON.stringify({
      provider,
      model,
      tokens_in,
      tokens_out,
      request_id: requestId,
      skill,
    })})
  `;

  const newBal = await getBalance(sql, userId);
  c.header("X-Request-Id", requestId);          // unified casing
  c.header("X-Credits-Used", String(cost));
  c.header("X-Credits-Balance", String(newBal));

  return c.json({
    ok: true,
    result: { kind: "text", content: text },
    usage: { tokens_in, tokens_out, r2_class_a: 0, r2_class_b: 0, r2_gb_retrieved: 0 },
    cost,
    balance: newBal,
    provider,
    model,
  });
});

// -------- Job APIs --------
app.get("/api/jobs/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);
  const sql = sqlFor(c);
  await sql`
    CREATE TABLE IF NOT EXISTS job (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_text TEXT NOT NULL,
      status TEXT NOT NULL,
      progress NUMERIC(5,2) NOT NULL DEFAULT 0,
      r2_url TEXT,
      result_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  const rows = (await sql`SELECT * FROM job WHERE id = ${id} LIMIT 1`) as Array<Record<string, unknown>>;
  if (!rows.length) return c.json({ error: "not_found" }, 404);
  return c.json({ job: rows[0] });
});

app.get("/api/jobs/:id/download", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);

  const sql = sqlFor(c);
  await sql`
    CREATE TABLE IF NOT EXISTS job (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_text TEXT NOT NULL,
      status TEXT NOT NULL,
      progress NUMERIC(5,2) NOT NULL DEFAULT 0,
      r2_url TEXT,
      result_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const rows = (await sql`SELECT r2_url, result_text FROM job WHERE id = ${id} LIMIT 1`) as Array<{ r2_url?: string; result_text?: string }>;
  if (!rows.length) return c.json({ error: "not_found" }, 404);

  const { r2_url, result_text } = rows[0] ?? {};

  if (r2_url && c.env.R2) {
    const obj = await c.env.R2.get(r2_url);
    if (obj && obj.body) {
      const ct = (obj.httpMetadata && obj.httpMetadata.contentType) || "application/octet-stream";
      const fname = (r2_url as string).split("/").pop() || "download.bin";
      return new Response(obj.body, {
        headers: {
          "content-type": ct,
          "content-disposition": `attachment; filename="${fname}"`,
          "cache-control": "no-store",
          // X-Request-Id added by post-route middleware
        },
      });
    }
  }

  const txt =
    typeof result_text === "string"
      ? result_text
      : JSON.stringify(result_text ?? {}, null, 2);

  return new Response(txt, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${id}.txt"`,
      "cache-control": "no-store",
    },
  });
});

// -------- Admin: process-one --------
// Accept either x-admin-key (operator) OR x-admin-task (internal scheduled/trigger)
// NOTE: Removed URL-based bypass; only secrets are honored.
app.post("/admin/process-one", async (c) => {
  const adminKey = c.req.header("x-admin-key") || "";
  const taskKey  = c.req.header("x-admin-task") || "";
  const allow =
    (adminKey && adminKey === (c.env.ADMIN_KEY || "")) ||
    (taskKey  && taskKey  === (c.env.ADMIN_TASK_SECRET || ""));
  if (!allow) return c.json({ error: "forbidden" }, 403);

  const sql = sqlFor(c);
  await sql`
    CREATE TABLE IF NOT EXISTS job (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_text TEXT NOT NULL,
      status TEXT NOT NULL,
      progress NUMERIC(5,2) NOT NULL DEFAULT 0,
      r2_url TEXT,
      result_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Pick oldest queued
  const items = (await sql`
    SELECT * FROM job
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
  `) as Array<{ id?: string; skill?: string; payload_text?: string; r2_file_key?: string }>;
  const count = items.length;
  console.log(`[admin rid=${c.get("rid") || requestIdFrom(c.req.raw)}] queued=${count}`);
  if (!count) return c.json({ ok: true, processed: 0 });

  const j = items[0];

  const payload = (() => {
    try { return JSON.parse(j.payload_text || "{}"); } catch { return {}; }
  })();
  const spec = (payload?.spec || "").toString();

  const result = {
    summary: "Sketch-to-app prototype created.",
    spec_head: spec.slice(0, 200),
    files: [
      {
        path: "README.md",
        contents:
`# Generated App
This is an initial scaffold derived from your sketch.

Spec (head):
${spec.slice(0, 200)}
`,
      },
    ],
  };

  // Upload to R2 (optional)
  let r2Key: string | null = null;
  try {
    const primary = (result as { files?: Array<{ path?: string; contents?: string }> }).files?.[0];
    if (primary && c.env.R2) {
      const k = `jobs/${j.id}/${primary.path}`;
      await c.env.R2.put(k, primary.contents || "", {
        httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        customMetadata: { job_id: j.id || "", type: j.skill || "" },
      });
      r2Key = k;
    }
  } catch {
    // non-fatal
  }

  await sql`
    UPDATE job
    SET status = 'done',
        progress = 100,
        result_text = ${JSON.stringify(result)},
        r2_url = ${r2Key},
        updated_at = now()
    WHERE id = ${j.id}
  `;

  console.log(`[admin rid=${c.get("rid") || requestIdFrom(c.req.raw)}] processed job_id=${j.id}`);
  return c.json({ ok: true, job_id: j.id, status: "done", r2_key: r2Key ?? undefined });
});

// -------- Admin: env snapshot (NEW) --------
// GET /api/admin/env-snapshot  (X-Admin-Key must equal ADMIN_API_KEY)
app.get("/api/admin/env-snapshot", (c) => {
  const k = (c.req.header("x-admin-key") || c.req.header("x-admin-token") || "").trim();
  if (!c.env.ADMIN_API_KEY || k !== c.env.ADMIN_API_KEY) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const vars = {
    ALLOWED_ORIGINS: c.env.ALLOWED_ORIGINS || "",
    ISSUER: c.env.ISSUER || "",
    JWT_TTL_SEC: c.env.JWT_TTL_SEC || "",
    KID: c.env.KID || "",
    CREDIT_PER_1K: c.env.CREDIT_PER_1K || "",
    MAX_UPLOAD_BYTES: c.env.MAX_UPLOAD_BYTES || "",
    WARN_CREDITS: String(warnCredits(c.env)),
    PREFERRED_PROVIDER: c.env.PREFERRED_PROVIDER || "",
    GROQ_MODEL: c.env.GROQ_MODEL || "",
    CF_AI_MODEL: c.env.CF_AI_MODEL || "",
    OPENAI_MODEL: c.env.OPENAI_MODEL || "",
    OPENAI_BASE: c.env.OPENAI_BASE || "",
    GROQ_BASE: c.env.GROQ_BASE || "",
  };

  const secrets = {
    PRIVATE_KEY_PEM: !!c.env.PRIVATE_KEY_PEM,
    GROQ_API_KEY: !!c.env.GROQ_API_KEY,
    OPENAI_API_KEY: !!c.env.OPENAI_API_KEY,
    ADMIN_API_KEY: !!c.env.ADMIN_API_KEY,
    ADMIN_KEY: !!c.env.ADMIN_KEY, // operator key for /admin/process-one
    ADMIN_TASK_SECRET: !!c.env.ADMIN_TASK_SECRET,
    CARTESIA_API_KEY: !!c.env.CARTESIA_API_KEY,
    DATABASE_URL: !!c.env.DATABASE_URL,
    NEON_DATABASE_URL: !!c.env.NEON_DATABASE_URL,
  };

  const bindings = {
    AI: !!c.env.AI,
    KEYS: !!c.env.KEYS,
    KV_BILLING: !!c.env.KV_BILLING,
    R2: !!c.env.R2,
    R2_UPLOADS: !!c.env.R2_UPLOADS,
    KV_PREFS: !!c.env.KV_PREFS,   // <— new: voice prefs KV presence
  };

  return c.json({
    ok: true,
    at: nowIso(),
    note: "Secrets are boolean flags (set/unset). No secret values are returned.",
    vars,
    secrets,
    bindings,
  });
});

// -------- TTS: Cartesia proxy (batch + realtime token) --------

/**
 * POST /api/tts/cartesia/batch
 * Body: { text: string, voice?: string, format?: "mp3"|"wav" }
 * Returns: audio/* on success, or JSON error.
 */
app.post("/api/tts/cartesia/batch", async (c) => {
  const key = c.env.CARTESIA_API_KEY || "";
  // wants, voice, and format are for future use
  // const wants = c.req.header("accept") || "";

  // Read JSON body (tolerant)
  const body = await c.req.json().catch(() => ({}));
  const text = String((body as { text?: string }).text || "");
  // const voice = ((body as { voice?: string }).voice && String((body as { voice?: string }).voice)) || undefined;
  // const format = ((body as { format?: string }).format && String((body as { format?: string }).format)) || "mp3";

  if (!text.trim()) return c.json({ error: "missing_text" }, 400);

  // Not configured yet? Return a clean capability signal.
  if (!key) {
    return c.json({ error: "cartesia_unconfigured" }, 501);
  }

  // TODO: Wire real Cartesia call here (intentionally left 501)
  return c.json({ error: "cartesia_not_implemented_yet" }, 501);
});

/**
 * GET /api/tts/cartesia/realtime-token
 * Returns: ephemeral auth object for realtime transport (when enabled).
 */
app.get("/api/tts/cartesia/realtime-token", async (c) => {
  const key = c.env.CARTESIA_API_KEY || "";
  if (!key) return c.json({ error: "cartesia_unconfigured" }, 501);

  // TODO: Exchange for a short-lived token / WebRTC credentials
  return c.json({ error: "cartesia_realtime_unavailable" }, 501);
});

/* --------------------------------------------------------
   Voice: Per-user Preferences (KV_PREFS) — GET / PUT
   -------------------------------------------------------- */

type VoicePrefs = {
  assistant_name?: string;         // e.g., "Vihaan"
  language?: string;               // BCP-47, e.g., "en-US"
  stt_language?: string;           // input language model hint
  tts_voice?: string;              // provider-specific voice id
  tts_speed?: number;              // 0.5..2
  tts_pitch?: number;              // -12..+12 semitones (or provider scale)
  wake_words?: string[];           // custom hotwords
  continuous_listen?: boolean;     // hands-free
  sentiment_tone?: "supportive" | "excited" | "calm" | "neutral";
  accessibility_mode?: boolean;    // enhanced prompts/feedback
  last_updated?: string;           // ISO string
  // allow forward-compat extra fields:
  [k: string]: unknown;
};

const PREFS_KEY_FOR = (email: string) => `prefs:${email.toLowerCase()}`;

// Defaults are minimal; frontend may add richer presets
const DEFAULT_PREFS: VoicePrefs = {
  assistant_name: "Vihaan",
  language: "en-US",
  stt_language: "en-US",
  tts_voice: "default",
  tts_speed: 1.0,
  tts_pitch: 0,
  wake_words: [],
  continuous_listen: false,
  sentiment_tone: "neutral",
  accessibility_mode: false,
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function sanitizePrefs(input: unknown): VoicePrefs {
  const out: VoicePrefs = { ...DEFAULT_PREFS };
  if (!isPlainObject(input)) return out;

  const copyIf = <T>(k: keyof VoicePrefs, pred: (x: unknown) => x is T) => {
    if (k in input && pred(input[k])) (out[k] as T) = input[k] as T;
  };

  copyIf<string>("assistant_name", (x): x is string => typeof x === "string" && x.length <= 64);
  copyIf<string>("language", (x): x is string => typeof x === "string" && x.length <= 32);
  copyIf<string>("stt_language", (x): x is string => typeof x === "string" && x.length <= 32);
  copyIf<string>("tts_voice", (x): x is string => typeof x === "string" && x.length <= 64);
  copyIf<number>("tts_speed", (x): x is number => typeof x === "number" && isFinite(x) && x > 0 && x <= 3);
  copyIf<number>("tts_pitch", (x): x is number => typeof x === "number" && isFinite(x) && x >= -24 && x <= 24);
  if (Array.isArray((input as Record<string, unknown>).wake_words)) {
    out.wake_words = ((input as Record<string, unknown>).wake_words as unknown[])
      .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .slice(0, 10);
  }
  copyIf<boolean>("continuous_listen", (x): x is boolean => typeof x === "boolean");
  if (
    typeof (input as Record<string, unknown>).sentiment_tone === "string" &&
    ["supportive", "excited", "calm", "neutral"].includes((input as Record<string, unknown>).sentiment_tone as string)
  ) {
    out.sentiment_tone = (input as Record<string, unknown>).sentiment_tone as "supportive" | "excited" | "calm" | "neutral";
  }
  copyIf<boolean>("accessibility_mode", (x): x is boolean => typeof x === "boolean");

  // carry forward compatible extras if the payload is not too big
  const raw = JSON.stringify(input);
  if (raw.length <= 10_000) {
    for (const [k, v] of Object.entries(input)) {
      if (!(k in out)) (out as Record<string, unknown>)[k] = v;
    }
  }
  out.last_updated = new Date().toISOString();
  return out;
}

// GET: read current prefs (fallback to defaults if missing)
app.get("/api/voice/prefs", async (c) => {
  const email = c.req.header("x-user-email") || c.req.query("email") || "";
  const e = String(email || "").toLowerCase().trim();
  if (!e) return c.json({ error: "missing_email" }, 400);

  const key = PREFS_KEY_FOR(e);
  const raw = await c.env.KV_PREFS.get(key);
  let prefs: VoicePrefs = DEFAULT_PREFS;
  if (raw) {
    try {
      const j = JSON.parse(raw);
      if (isPlainObject(j)) prefs = { ...DEFAULT_PREFS, ...sanitizePrefs(j) };
    } catch {
      // ignore bad JSON; treat as defaults
    }
  }

  return c.json(
    {
      email: e,
      prefs,
    },
    200,
    {
      "Cache-Control": "no-store",
    }
  );
});

// PUT: update prefs (sanitized/validated) and persist in KV
app.put("/api/voice/prefs", async (c) => {
  const email = c.req.header("x-user-email") || c.req.query("email") || "";
  const e = String(email || "").toLowerCase().trim();
  if (!e) return c.json({ error: "missing_email" }, 400);

  const body = await c.req.json().catch(() => ({}));
  if (!isPlainObject(body)) return c.json({ error: "invalid_json" }, 400);

  const sanitized = sanitizePrefs(body);
  const key = PREFS_KEY_FOR(e);

  // Small guard on payload size (10 KB)
  const json = JSON.stringify(sanitized);
  if (json.length > 10_000) return c.json({ error: "payload_too_large" }, 413);

  await c.env.KV_PREFS.put(key, json);
  return c.json(
    {
      ok: true,
      email: e,
      prefs: sanitized,
    },
    200,
    {
      "Cache-Control": "no-store",
    }
  );
});

// -------- Export CF Worker entrypoints --------
export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) => app.fetch(req, env, ctx),

  // Cron: */5 * * * *  — kicks the queue periodically
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Up to 5 jobs per tick
    const makeReq = () =>
      new Request("http://internal/admin/process-one", {
        method: "POST",
        headers: { "x-admin-task": env.ADMIN_TASK_SECRET || "" },
      });

    await (async () => {
      for (let i = 0; i < 5; i++) {
        const resp = await app.fetch(makeReq(), env, ctx);
        if (!resp.ok) break;
        const text = await resp.text().catch(() => "");
        if (text.includes('"processed":0')) break; // nothing to do
      }
    })();
  },
};
