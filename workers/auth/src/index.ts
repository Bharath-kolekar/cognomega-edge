// cf-auth/src/index.ts
// Cognomega Unified Worker (Production)
// - RS256 guest auth; KV-backed JWKS, Credits, Usage, Jobs
// - AI orchestrator (groq → cfai → openai) with usage + credit headers
// - Direct R2 uploads
// - Tolerant CORS (echo Origin while ALLOWED_ORIGINS unset)
// - Top-level try/catch so all errors carry CORS
// - Usage route guarded to avoid raw 500s
//
// Endpoints (selected):
//   POST /auth/guest | /api/auth/guest | /api/v1/auth/guest
//   GET  /.well-known/jwks.json
//   GET  /api/credits | /credits | /api/v1/credits
//   POST /api/credits/adjust
//   GET/POST /api/billing/usage   (aliases: /api/usage, /usage, /api/v1/usage, /api/v1/billing/usage)
//   GET/POST /api/jobs;  GET/PATCH /api/jobs/:id;  POST /api/jobs/run
//   POST /api/si/ask
//   POST /api/upload/direct
//   GET  /ready | /healthz | /api/ready | /api/healthz | /api/v1/healthz
//   GET  /api/ai/binding
//   POST /api/ai/test
//   GET  /api/admin/ping
//   POST /api/admin/cleanup

// --- Local type for R2 (TS-only; runtime provided by Workers) ---
type R2Bucket = {
  get(key: string): Promise<
    | { body: ReadableStream | null; httpMetadata?: { contentType?: string | null } | null }
    | null
  >;
  put(
    key: string,
    value: ArrayBuffer | string | ReadableStream,
    opts?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }
  ): Promise<void>;
};

export interface Env {
  // Vars
  ALLOWED_ORIGINS?: string;
  ISSUER?: string;
  JWT_TTL_SEC?: string;
  KID?: string;

  // AI selection & models
  PREFERRED_PROVIDER?: string; // e.g. "groq,cfai,openai"
  GROQ_MODEL?: string;         // e.g. "llama-3.1-8b-instant"
  CF_AI_MODEL?: string;        // e.g. "@cf/meta/llama-3.1-8b-instruct"
  OPENAI_MODEL?: string;       // e.g. "gpt-4o-mini"
  OPENAI_BASE?: string;        // defaults to https://api.openai.com/v1
  GROQ_BASE?: string;          // defaults to https://api.groq.com/openai/v1
  CREDIT_PER_1K?: string;      // credits charged per 1k tokens (input+output)

  // Uploads
  MAX_UPLOAD_BYTES?: string;   // default 10 * 1024 * 1024

  // Secrets
  PRIVATE_KEY_PEM?: string;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ADMIN_API_KEY?: string;      // for /api/credits/adjust and admin routes

  // Bindings
  AI: any;                     // Workers AI binding
  KEYS: KVNamespace;           // public JWKS
  KV_BILLING: KVNamespace;     // credits + usage + jobs
  R2_UPLOADS: R2Bucket;        // R2 bucket for uploads
  VOICE_API?: Fetcher;         // Service binding to cognomega-api (voice/API)
}

type Json = Record<string, unknown> | Array<unknown>;

// ---------- Utilities

const textEncoder = new TextEncoder();

function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? textEncoder.encode(input) : new Uint8Array(input);
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parsePemToPkcs8(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [\s\S]+?-----/g, "")
    .replace(/-----END [\s\S]+?-----/g, "")
    .replace(/\s+/g, "");
  const raw = atob(base64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  const pkcs8 = parsePemToPkcs8(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function nowSeconds() { return Math.floor(Date.now() / 1000); }

const ALLOW_HEADERS  = "Authorization, Content-Type, X-User-Email, x-user-email, X-Admin-Key, X-Admin-Token";
const EXPOSE_HEADERS = "X-Credits-Used, X-Credits-Balance, X-Tokens-In, X-Tokens-Out, X-Provider, X-Model";

// Tolerant CORS: echo Origin if ALLOWED_ORIGINS is unset
function corsHeaders(req: Request, env: Env): Headers {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const allowOrigin =
    allowed.length === 0 ? origin :
    allowed.includes(origin) ? origin : "";

  const h = new Headers();
  if (allowOrigin) h.set("Access-Control-Allow-Origin", allowOrigin);
  h.set("Vary", "Origin");
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PATCH");
  h.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
  h.set("Access-Control-Expose-Headers", EXPOSE_HEADERS);
  h.set("Access-Control-Max-Age", "600");
  return h;
}

function json(
  data: Json,
  req: Request,
  env: Env,
  status = 200,
  extraHeaders?: Record<string, string>
): Response {
  const h = corsHeaders(req, env);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "no-store");
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) h.set(k, v);
    const expose = new Set((h.get("Access-Control-Expose-Headers") || "")
      .split(",").map(s => s.trim()).filter(Boolean));
    for (const k of Object.keys(extraHeaders)) if (/^x-/i.test(k)) expose.add(k);
    if (expose.size) h.set("Access-Control-Expose-Headers", Array.from(expose).join(", "));
  }
  return new Response(JSON.stringify(data), { status, headers: h });
}

function noContent(req: Request, env: Env): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req, env) });
}

async function getJWKS(env: Env): Promise<{ keys: any[] }> {
  const raw = await env.KEYS.get("jwks");
  if (raw) { try { return JSON.parse(raw); } catch { /* ignore */ } }
  return { keys: [] };
}

// ---------- Email + JWT helpers

function b64uToUtf8(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s = s + "=".repeat(pad);
  try { return atob(s); } catch { return ""; }
}

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  header.split(";").forEach(part => {
    const [k, ...rest] = part.split("=");
    if (!k) return;
    const key = k.trim();
    const val = rest.join("=").trim();
    if (key) out[key] = decodeURIComponent(val || "");
  });
  return out;
}

function unsafeDecodeJwtEmailFromToken(tok: string | null | undefined): string | null {
  try {
    if (!tok) return null;
    const parts = tok.split(".");
    if (parts.length < 2) return null;
    const payloadJson = b64uToUtf8(parts[1]);
    const p = JSON.parse(payloadJson);
    const email = p?.email ?? p?.em ?? p?.sub ?? null;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

function getCallerEmail(req: Request): string | null {
  const url = new URL(req.url);
  const q = (url.searchParams.get("email") || "").trim();
  const h = (req.headers.get("x-user-email") || "").trim();

  const bearer = req.headers.get("authorization");
  const bearerTok = bearer?.replace(/^Bearer\s+/i, "") || null;

  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = cookieHeader ? parseCookie(cookieHeader) : {};
  const cookieTok = cookies["cog_auth_jwt"] || null;

  const fromJwt = unsafeDecodeJwtEmailFromToken(bearerTok) ||
                  unsafeDecodeJwtEmailFromToken(cookieTok) || "";

  const candidate = q || h || fromJwt;
  return candidate ? candidate.toLowerCase() : null;
}

// ---------- JWT (RS256)

async function signJwtRS256(
  payload: Record<string, unknown>,
  env: Env
): Promise<{ token: string; exp: number }> {
  const ttl = Math.max(60, Number(env.JWT_TTL_SEC || "3600"));
  const now = nowSeconds();
  const exp = now + ttl;

  const header: Record<string, string> = { alg: "RS256", typ: "JWT" };
  if (env.KID) header.kid = env.KID;

  const body = { iat: now, exp, iss: env.ISSUER || "https://api.cognomega.com", ...payload };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;

  const pem = env.PRIVATE_KEY_PEM;
  if (!pem) throw new Error("PRIVATE_KEY_PEM not configured");
  const key = await importRsaPrivateKey(pem);

  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, textEncoder.encode(unsigned));
  const token = `${unsigned}.${b64url(sig)}`;
  return { token, exp };
}

// ---------- Credits (KV_BILLING)

type BalanceRow = { balance_credits: number; updated_at: string };
function balKey(email: string) { return `balance:${email}`; }
function round3(n: number) { return Math.round((n + Number.EPSILON) * 1000) / 1000; }

async function getBalance(env: Env, email: string): Promise<BalanceRow> {
  const v = await env.KV_BILLING.get(balKey(email));
  if (v) {
    try {
      const row = JSON.parse(v) as BalanceRow;
      return { balance_credits: Number(row.balance_credits || 0), updated_at: row.updated_at || new Date().toISOString() };
    } catch {}
  }
  return { balance_credits: 0, updated_at: new Date().toISOString() };
}

async function setBalance(env: Env, email: string, newBalance: number): Promise<BalanceRow> {
  const row: BalanceRow = { balance_credits: round3(Math.max(0, newBalance)), updated_at: new Date().toISOString() };
  await env.KV_BILLING.put(balKey(email), JSON.stringify(row));
  return row;
}

async function adjustBalance(env: Env, email: string, delta: number): Promise<BalanceRow> {
  const cur = await getBalance(env, email);
  return setBalance(env, email, cur.balance_credits + delta);
}

// GET /api/credits | /credits | /api/v1/credits
function handleCreditsGet(req: Request, env: Env): Promise<Response> | Response {
  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);
  return (async () => {
    const row = await getBalance(env, email);
    return json({
      email,
      balance_credits: row.balance_credits,
      updated_at: row.updated_at,
      credits: row.balance_credits,  // legacy aliases
      updated: row.updated_at,
    }, req, env, 200);
  })();
}

// POST /api/credits/adjust  (admin)
async function handleCreditsAdjust(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);
  const k = (req.headers.get("x-admin-key") || req.headers.get("x-admin-token") || "").trim();
  if (!env.ADMIN_API_KEY || k !== env.ADMIN_API_KEY) return json({ error: "unauthorized" }, req, env, 401);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, req, env, 400); }

  const email = (body?.email || "").toString().toLowerCase().trim();
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  const hasSet = typeof body?.set === "number";
  const hasDelta = typeof body?.delta === "number" && !Number.isNaN(body.delta);
  if (hasSet && hasDelta) return json({ error: "set_and_delta_conflict" }, req, env, 400);

  let row: BalanceRow;
  if (hasSet) row = await setBalance(env, email, Number(body.set));
  else if (hasDelta) row = await adjustBalance(env, email, Number(body.delta));
  else return json({ error: "nothing_to_do" }, req, env, 400);

  return json({ email, balance_credits: row.balance_credits, updated_at: row.updated_at }, req, env, 200);
}

// ---------- Usage (KV_BILLING)

type UsageEvent = {
  id: string;
  created_at: string;           // ISO
  route: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_credits?: number;
  meta?: Record<string, unknown>;
  email: string;
};

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
function revTs(ts: number) { const v = Math.max(0, Math.min(MAX_SAFE, ts)); return v ? (MAX_SAFE - v).toString(36) : "0"; }
function usageKey(email: string, ts: number, id: string) { return `usage:${email}:${revTs(ts)}:${id}`; }

async function appendUsage(
  env: Env,
  email: string,
  route: string,
  tokens_in?: number,
  tokens_out?: number,
  cost_credits?: number,
  meta?: Record<string, unknown>
) {
  const ts = Date.now();
  const id = crypto.randomUUID();
  const evt: UsageEvent = {
    id,
    created_at: new Date(ts).toISOString(),
    route,
    tokens_in,
    tokens_out,
    cost_credits,
    meta,
    email,
  };
  const key = usageKey(email, ts, id);
  await env.KV_BILLING.put(key, JSON.stringify(evt));
  return { key, event: evt };
}

async function handleUsagePost(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);

  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  let body: Partial<UsageEvent> = {};
  try { body = await req.json<Partial<UsageEvent>>(); } catch {
    return json({ error: "invalid_json" }, req, env, 400);
  }

  const createdAt = body.created_at || new Date().toISOString();
  const ts = Date.parse(createdAt) || Date.now();
  const id = body.id || crypto.randomUUID();

  const evt: UsageEvent = {
    id,
    created_at: new Date(ts).toISOString(),
    route: String(body.route || "unknown"),
    tokens_in: typeof body.tokens_in === "number" ? body.tokens_in : undefined,
    tokens_out: typeof body.tokens_out === "number" ? body.tokens_out : undefined,
    cost_credits: typeof body.cost_credits === "number" ? body.cost_credits : undefined,
    meta: (body.meta && typeof body.meta === "object") ? body.meta : undefined,
    email,
  };

  const key = usageKey(email, ts, id);
  await env.KV_BILLING.put(key, JSON.stringify(evt));
  return json({ ok: true, event: evt, stored_key: key }, req, env, 200);
}

async function handleUsageGet(req: Request, env: Env): Promise<Response> {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, req, env, 405);

  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "25"), 100));
  const cursor = url.searchParams.get("cursor") || undefined;

  const prefix = `usage:${email}:`;
  const list = await env.KV_BILLING.list({ prefix, limit, cursor });

  const events: UsageEvent[] = [];
  for (const k of list.keys) {
    const v = await env.KV_BILLING.get(k.name);
    if (v) { try { events.push(JSON.parse(v) as UsageEvent); } catch { /* ignore */ } }
  }

  return json({
    email,
    items: events,                      // newest-first by key design
    next_cursor: list.list_complete ? null : (list.cursor || null),
  }, req, env, 200);
}

// ---------- Jobs (KV-backed)

type Job = {
  id: string;
  email: string;
  type: string;
  params?: Record<string, unknown>;
  status: "queued" | "running" | "succeeded" | "failed";
  result?: unknown;
  created_at: string;
  updated_at: string;
};

function jobRowKey(id: string) { return `job:${id}`; }
function jobsIdxKey(email: string, ts: number, id: string) { return `jobs:${email}:${revTs(ts)}:${id}`; }

async function handleJobCreate(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);
  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  let body: any = {};
  try { body = await req.json(); } catch {}

  const ts = Date.now();
  const id = crypto.randomUUID();
  const job: Job = {
    id,
    email,
    type: String(body?.type || "si"),
    params: (body?.params && typeof body.params === "object") ? body.params : undefined,
    status: "queued",
    created_at: new Date(ts).toISOString(),
    updated_at: new Date(ts).toISOString(),
  };

  await env.KV_BILLING.put(jobRowKey(id), JSON.stringify(job));
  await env.KV_BILLING.put(jobsIdxKey(email, ts, id), id); // index row
  return json({ job }, req, env, 200);
}

async function handleJobGet(req: Request, env: Env, id: string): Promise<Response> {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, req, env, 405);
  const raw = await env.KV_BILLING.get(jobRowKey(id));
  if (!raw) return json({ error: "not_found" }, req, env, 404);
  try { return json({ job: JSON.parse(raw) as Job }, req, env, 200); }
  catch { return json({ error: "corrupt" }, req, env, 500); }
}

async function handleJobPatch(req: Request, env: Env, id: string): Promise<Response> {
  if (req.method !== "PATCH") return json({ error: "method_not_allowed" }, req, env, 405);
  const raw = await env.KV_BILLING.get(jobRowKey(id));
  if (!raw) return json({ error: "not_found" }, req, env, 404);

  let job: Job;
  try { job = JSON.parse(raw) as Job; } catch { return json({ error: "corrupt" }, req, env, 500); }

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, req, env, 400); }

  if (body.status && ["queued", "running", "succeeded", "failed"].includes(body.status)) job.status = body.status;
  if ("result" in body) job.result = body.result;
  job.updated_at = new Date().toISOString();

  await env.KV_BILLING.put(jobRowKey(id), JSON.stringify(job));
  return json({ ok: true, job }, req, env, 200);
}

async function handleJobList(req: Request, env: Env): Promise<Response> {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, req, env, 405);

  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "25"), 100));
  const cursor = url.searchParams.get("cursor") || undefined;

  const prefix = `jobs:${email}:`;
  const list = await env.KV_BILLING.list({ prefix, limit, cursor });

  const items: Job[] = [];
  for (const k of list.keys) {
    const id = await env.KV_BILLING.get(k.name);
    if (!id) continue;
    const row = await env.KV_BILLING.get(jobRowKey(id));
    if (!row) continue;
    try { items.push(JSON.parse(row) as Job); } catch {}
  }

  return json({ email, items, next_cursor: list.list_complete ? null : (list.cursor || null) }, req, env, 200);
}

// ----- Background job helpers -----

async function setJob(env: Env, job: Job) {
  await env.KV_BILLING.put(jobRowKey(job.id), JSON.stringify(job));
}

async function getJob(env: Env, id: string): Promise<Job | null> {
  const raw = await env.KV_BILLING.get(jobRowKey(id));
  if (!raw) return null;
  try { return JSON.parse(raw) as Job; } catch { return null; }
}

async function createJob(env: Env, email: string, type: string, params?: Record<string, unknown>): Promise<Job> {
  const ts = Date.now();
  const job: Job = {
    id: crypto.randomUUID(),
    email,
    type,
    params,
    status: "queued",
    created_at: new Date(ts).toISOString(),
    updated_at: new Date(ts).toISOString(),
  };
  await env.KV_BILLING.put(jobRowKey(job.id), JSON.stringify(job));
  await env.KV_BILLING.put(jobsIdxKey(email, ts, job.id), job.id);
  return job;
}

// Run an SI job end-to-end (credits-guarded, usage + deduction)
async function processSiJob(env: Env, jobId: string): Promise<void> {
  const job0 = await getJob(env, jobId);
  if (!job0) return;

  // mark running
  job0.status = "running";
  job0.updated_at = new Date().toISOString();
  await setJob(env, job0);

  const email = job0.email || "anonymous";
  const skill = (job0.params?.["skill"] ?? "general").toString();
  const input = (job0.params?.["input"] ?? "").toString();

  try {
    // credits pre-check — bypass for guests
    const isGuest = (email || "").startsWith("guest:");
    const balRow = await getBalance(env, email);
    if (!isGuest && (balRow.balance_credits ?? 0) <= 0) {
      job0.status = "failed";
      job0.result = { error: "insufficient_credits", balance_credits: balRow.balance_credits };
      job0.updated_at = new Date().toISOString();
      await setJob(env, job0);
      return;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: `You are a helpful assistant. Skill="${skill}". Keep replies concise.` },
      { role: "user",   content: input || "Say hello." }
    ];

    const out = await runPreferred(env, messages);
    const creditsUsed = round3(creditsFor(Number(out.tokens_in || 0), Number(out.tokens_out || 0), env));

    // usage (durable)
    await appendUsage(env, email, "/api/jobs:si",
      Number(out.tokens_in || 0),
      Number(out.tokens_out || 0),
      creditsUsed,
      { provider: out.provider, model: out.model, skill, job_id: job0.id }
    );

    // deduct credits (skip for guests)
    let balanceAfter: number | undefined;
    if (!isGuest && creditsUsed > 0) {
      try {
        const row = await adjustBalance(env, email, -creditsUsed);
        balanceAfter = row.balance_credits;
      } catch {}
    }

    job0.status = "succeeded";
    job0.result = {
      content: out.text,
      provider: out.provider,
      model: out.model,
      tokens_in: out.tokens_in ?? 0,
      tokens_out: out.tokens_out ?? 0,
      credits_used: creditsUsed,
      balance_after: typeof balanceAfter === "number" ? balanceAfter : undefined,
    };
    job0.updated_at = new Date().toISOString();
    await setJob(env, job0);
  } catch (e: any) {
    job0.status = "failed";
    job0.result = { error: String(e?.message || e) };
    job0.updated_at = new Date().toISOString();
    await setJob(env, job0);
  }
}

// Fire-and-wait for SI job
async function handleJobRun(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);

  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const type = String(body?.type || "si");
  const params = (body?.params && typeof body.params === "object") ? body.params : undefined;

  if (type !== "si") return json({ error: "unsupported_type", type }, req, env, 400);

  // Create then run inline (no waitUntil) to "fire-and-wait"
  const job = await createJob(env, email, type, params);
  await processSiJob(env, job.id);
  const final = await getJob(env, job.id);

  if (!final) return json({ error: "job_missing_after_run", id: job.id }, req, env, 500);
  return json({ job: final, mode: "sync" }, req, env, 200);
}

// ---------- AI Orchestrator (Groq → CF Workers AI → OpenAI)

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function pickOrder(env: Env): string[] {
  const raw = (env.PREFERRED_PROVIDER || "groq,cfai,openai").toLowerCase();
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}
function pickGroqModel(env: Env) { return env.GROQ_MODEL || "llama-3.1-8b-instant"; }
function pickCfModel(env: Env)   { return env.CF_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct"; }
function pickOpenAiModel(env: Env) { return env.OPENAI_MODEL || "gpt-4o-mini"; }
function groqBase(env: Env)     { return env.GROQ_BASE || "https://api.groq.com/openai/v1"; }
function openAiBase(env: Env)   { return env.OPENAI_BASE || "https://api.openai.com/v1"; }

function normalizeWorkersAiText(out: any): string {
  if (out && typeof out.response === "string") return out.response;
  const c = out?.choices?.[0]?.message?.content;
  if (typeof c === "string") return c;
  return JSON.stringify(out);
}
function estimateTokens(text: string): number {
  // heuristic ~4 chars/token
  const len = (text || "").length;
  return Math.max(1, Math.round(len / 4));
}

async function callGroq(env: Env, messages: ChatMessage[]) {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  const model = pickGroqModel(env);
  const res = await fetch(`${groqBase(env)}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const j = await res.json() as any;
  const text = j?.choices?.[0]?.message?.content ?? "";
  const inTok  = j?.usage?.prompt_tokens ?? estimateTokens(JSON.stringify(messages));
  const outTok = j?.usage?.completion_tokens ?? estimateTokens(text);
  return { provider: "groq", model, text, tokens_in: inTok, tokens_out: outTok };
}

async function callCfAi(env: Env, messages: ChatMessage[]) {
  if (!env.AI || typeof env.AI.run !== "function") throw new Error("AI binding missing");
  const model = pickCfModel(env);
  const out = await env.AI.run(model, { messages, max_tokens: 512 });
  const text = normalizeWorkersAiText(out);
  const inTok  = estimateTokens(JSON.stringify(messages));
  const outTok = estimateTokens(text);
  return { provider: "cfai", model, text, tokens_in: inTok, tokens_out: outTok };
}

async function callOpenAi(env: Env, messages: ChatMessage[]) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const model = pickOpenAiModel(env);
  const res = await fetch(`${openAiBase(env)}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const j = await res.json() as any;
  const text = j?.choices?.[0]?.message?.content ?? "";
  const inTok  = j?.usage?.prompt_tokens ?? estimateTokens(JSON.stringify(messages));
  const outTok = j?.usage?.completion_tokens ?? estimateTokens(text);
  return { provider: "openai", model, text, tokens_in: inTok, tokens_out: outTok };
}

async function runPreferred(env: Env, messages: ChatMessage[]) {
  const order = pickOrder(env);
  const errors: string[] = [];
  for (const p of order) {
    try {
      if (p === "groq")   return await callGroq(env, messages);
      if (p === "cfai")   return await callCfAi(env, messages);
      if (p === "openai") return await callOpenAi(env, messages);
      errors.push(`unknown provider "${p}"`);
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }
  }
  throw new Error(`all providers failed: ${errors.join(" | ")}`);
}

function creditsFor(tokensIn: number, tokensOut: number, env: Env): number {
  const per1k = Number(env.CREDIT_PER_1K || "0");
  if (!isFinite(per1k) || per1k <= 0) return 0;
  const total = (tokensIn || 0) + (tokensOut || 0);
  return (total / 1000) * per1k;
}

// ---------- Health & Auth & JWKS

async function handleGuest(req: Request, env: Env): Promise<Response> {
  if (req.method === "OPTIONS") return noContent(req, env);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);

  const sub = `guest:${crypto.randomUUID()}`;
  try {
    const { token, exp } = await signJwtRS256({ sub, role: "guest" }, env);
    return json({ token, exp }, req, env, 200);
  } catch (e: any) {
    return json({ error: "sign_failed", detail: String(e?.message || e) }, req, env, 500);
  }
}

async function handleJwks(req: Request, env: Env): Promise<Response> {
  const jwks = await getJWKS(env);
  const h = corsHeaders(req, env);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "public, max-age=300");
  return new Response(JSON.stringify(jwks), { status: 200, headers: h });
}

function handleReady(req: Request, env: Env): Response {
  // stricter: require PRIVATE_KEY_PEM and ALLOWED_ORIGINS to be present for "ok"
  const ok = Boolean(env.PRIVATE_KEY_PEM) && (env.ALLOWED_ORIGINS !== undefined);
  return json({ ok }, req, env, ok ? 200 : 500);
}

// Internal: ping API worker via service binding for voice health
async function handleVoiceHealth(req: Request, env: Env): Promise<Response> {
  if (req.method === "OPTIONS") return noContent(req, env);
  if (!env.VOICE_API) return json({ ok: false, error: "service_unbound" }, req, env, 503);

  try {
    const t0 = Date.now();
    const r = await env.VOICE_API.fetch(new Request("http://internal/ready", { method: "GET" }));
    const ms = Date.now() - t0;
    let detail: any = null;
    try { detail = await r.json(); } catch { /* ignore */ }
    return json({ ok: r.ok, status: r.status, ms, detail }, req, env, r.ok ? 200 : 502);
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, req, env, 502);
  }
}

// ---------- Router helpers

function isUsagePath(p: string): boolean {
  return p === "/api/billing/usage" || p === "/billing/usage" ||
         p === "/api/usage" || p === "/usage" ||
         p === "/api/v1/usage" || p === "/api/v1/billing/usage";
}

function isJobsCollection(p: string): boolean { return p === "/api/jobs"; }
function isJobItem(p: string): string | null {
  const m = p.match(/^\/api\/jobs\/([A-Za-z0-9-]+)$/);
  return m ? m[1] : null;
}

// ---------- Admin cleanup ----------

type CleanupBody = {
  kind?: "usage" | "jobs" | "both";
  older_than_days?: number;
  limit?: number;
  dry_run?: boolean;
  email_prefix?: string; // optional: narrow by email prefix
};

async function handleAdminCleanup(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);
  const k = (req.headers.get("x-admin-key") || req.headers.get("x-admin-token") || "").trim();
  if (!env.ADMIN_API_KEY || k !== env.ADMIN_API_KEY) return json({ error: "unauthorized" }, req, env, 401);

  let body: CleanupBody = {};
  try { body = await req.json<CleanupBody>(); } catch { return json({ error: "invalid_json" }, req, env, 400); }

  const kind = (body.kind || "both");
  const olderDays = Math.max(0, Number(body.older_than_days ?? 30));
  const cutoffTs = Date.now() - olderDays * 24 * 60 * 60 * 1000;
  const hardLimit = Math.max(1, Math.min(Number(body.limit ?? 500), 5000));
  const dryRun = Boolean(body.dry_run);
  const emailPrefix = (body.email_prefix || "").trim();
  const mkUsagePrefix = () => `usage:${emailPrefix}`;
  const mkJobsIdxPrefix = () => `jobs:${emailPrefix}`;
  const res = {
    ok: true,
    dry_run: dryRun,
    kind,
    older_than_days: olderDays,
    limit: hardLimit,
    scanned: { usage: 0, jobs_index: 0, jobs_rows_checked: 0 },
    deleted: { usage_keys: 0, job_index_keys: 0, job_rows: 0 },
    kept: { usage_keys: 0, job_index_keys: 0, job_rows: 0 },
  };

  async function maybeDelete(key: string) {
    if (!dryRun) await env.KV_BILLING.delete(key);
  }

  // Clean usage
  if (kind === "usage" || kind === "both") {
    let cursor: string | undefined = undefined;
    const prefix = mkUsagePrefix();
    outer: while (true) {
      const list = await env.KV_BILLING.list({ prefix, cursor, limit: 1000 });
      for (const k of list.keys) {
        res.scanned.usage++;
        const v = await env.KV_BILLING.get(k.name);
        if (!v) { res.kept.usage_keys++; continue; }
        let ts = 0;
        try {
          const row = JSON.parse(v) as UsageEvent;
          ts = Date.parse(row.created_at || "");
        } catch {}
        if (ts && ts < cutoffTs) {
          await maybeDelete(k.name);
          res.deleted.usage_keys++;
          if ((res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys) >= hardLimit) break outer;
        } else {
          res.kept.usage_keys++;
        }
      }
      if (list.list_complete || (res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys) >= hardLimit) break;
      cursor = list.cursor;
    }
  }

  // Clean jobs (index + rows)
  if (kind === "jobs" || kind === "both") {
    let cursor: string | undefined = undefined;
    const prefix = mkJobsIdxPrefix();
    outer2: while (true) {
      const list = await env.KV_BILLING.list({ prefix, cursor, limit: 1000 });
      for (const k of list.keys) {
        res.scanned.jobs_index++;
        const id = await env.KV_BILLING.get(k.name);
        if (!id) { res.kept.job_index_keys++; continue; }
        const row = await env.KV_BILLING.get(jobRowKey(id));
        res.scanned.jobs_rows_checked++;
        if (!row) {
          await maybeDelete(k.name);
          res.deleted.job_index_keys++;
          if ((res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys) >= hardLimit) break outer2;
          continue;
        }
        let ts = 0;
        try {
          const job = JSON.parse(row) as Job;
          ts = Date.parse(job.created_at || "");
        } catch {}
        if (ts && ts < cutoffTs) {
          await maybeDelete(k.name);
          res.deleted.job_index_keys++;
          await maybeDelete(jobRowKey(id));
          res.deleted.job_rows++;
          if ((res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys) >= hardLimit) break outer2;
        } else {
          res.kept.job_index_keys++;
          res.kept.job_rows++;
        }
      }
      if (list.list_complete || (res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys) >= hardLimit) break;
      cursor = list.cursor;
    }
  }

  return json(res, req, env, 200);
}

// ---------- Uploads (R2) ----------

function sanitizeFilename(name: string): string {
  const base = (name || "").split(/[\\\/]/).pop() || "";
  const cleaned = base.replace(/[^\w.\-]+/g, "_");
  const noDots = cleaned.replace(/^\.+/, "");
  const limited = noDots.slice(0, 128);
  return limited || "blob";
}

/**
 * POST /api/upload/direct
 * - Raw body (not multipart)
 * - Requires Content-Length; enforces MAX_UPLOAD_BYTES (default 10MB)
 * - Requires caller email (X-User-Email or JWT/cookie)
 * - Writes to env.R2_UPLOADS with content-type and metadata
 */
async function handleUploadDirect(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);

  const email = getCallerEmail(req);
  if (!email) return json({ error: "missing_email" }, req, env, 400);

  const bucket = (env as any).R2_UPLOADS as R2Bucket | undefined;
  if (!bucket || typeof (bucket as any).put !== "function") {
    return json({ error: "r2_not_bound" }, req, env, 500);
  }

  // Enforce size from Content-Length
  const clRaw = req.headers.get("content-length") || "";
  const size = Number(clRaw);
  const maxBytes = Math.max(1, Number(env.MAX_UPLOAD_BYTES || "10485760")); // 10MB default
  if (!Number.isFinite(size) || size <= 0) return json({ error: "length_required" }, req, env, 411);
  if (size > maxBytes) return json({ error: "payload_too_large", max_bytes: maxBytes }, req, env, 413);

  const url = new URL(req.url);
  const filenameQ = (url.searchParams.get("filename") || "").trim();
  const filename = sanitizeFilename(filenameQ) || "blob";
  const ct = (req.headers.get("content-type") || "application/octet-stream").split(";")[0].trim();
  if (!req.body) return json({ error: "empty_body" }, req, env, 400);

  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const safeEmail = (email || "").replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 64);
  const key = `uploads/${yyyy}/${mm}/${dd}/${safeEmail}/${crypto.randomUUID()}-${filename}`;

  const putRes = await bucket.put(key, req.body as any, {
    httpMetadata: { contentType: ct },
    customMetadata: { uploader: email, route: "/api/upload/direct", original_filename: filename }
  });

  return json({
    ok: true,
    key,
    size,
    etag: (putRes as any)?.etag || null,
    version: (putRes as any)?.version || null,
    content_type: ct
  }, req, env, 200);
}

// ---------- Worker (router with top-level try/catch and guarded usage) ----------

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(req.url);
      const p = (url.pathname.replace(/\/+$/, "") || "/").toLowerCase();

      // CORS preflight
      if (req.method === "OPTIONS") return noContent(req, env);

      // Health
      if (p === "/ready" || p === "/healthz" || p === "/api/ready" || p === "/api/healthz" || p === "/api/v1/healthz") {
        return handleReady(req, env);
      }

      // Internal voice health via service binding
      if (p === "/internal/voice/health") {
        return handleVoiceHealth(req, env);
      }

      // Auth (plain, /api/, /api/v1/)
      if (p === "/auth/guest" || p === "/api/auth/guest" || p === "/api/v1/auth/guest") {
        return handleGuest(req, env);
      }

      // Public JWKS
      if (p === "/.well-known/jwks.json") {
        return handleJwks(req, env);
      }

      // Credits
      if (p === "/api/credits" || p === "/credits" || p === "/api/v1/credits") {
        return handleCreditsGet(req, env);
      }
      if (p === "/api/credits/adjust") {
        return handleCreditsAdjust(req, env);
      }

      // Usage (guard: never leak raw 500s)
      if (isUsagePath(p)) {
        if (req.method === "OPTIONS") return noContent(req, env);
        try {
          if (req.method === "GET")  return await handleUsageGet(req, env);
          if (req.method === "POST") return await handleUsagePost(req, env);
          return json({ error: "method_not_allowed" }, req, env, 405);
        } catch (e: any) {
          return json({ events: [], error: "usage_failed", message: String(e?.message ?? e) }, req, env, 200);
        }
      }

      // Jobs
      if (isJobsCollection(p)) {
        if (req.method === "GET")  return handleJobList(req, env);

        if (req.method === "POST") {
          const email = getCallerEmail(req);
          if (!email) return json({ error: "missing_email" }, req, env, 400);

          let body: any = {};
          try { body = await req.json(); } catch {}
          const type = String(body?.type || "si");
          const params = (body?.params && typeof body.params === "object") ? body.params : undefined;

          // create the job row + index
          const job = await createJob(env, email, type, params);

          // kick off background processing for SI jobs
          if (type === "si") {
            // @ts-ignore Cloudflare provides ExecutionContext in fetch
            ctx.waitUntil(processSiJob(env, job.id));
          }

          return json({ job }, req, env, 200);
        }

        return json({ error: "method_not_allowed" }, req, env, 405);
      }

      // Fire-and-wait run
      if (p === "/api/jobs/run") {
        return handleJobRun(req, env);
      }

      const jobId = isJobItem(p);
      if (jobId) {
        if (req.method === "GET")   return handleJobGet(req, env, jobId);
        if (req.method === "PATCH") return handleJobPatch(req, env, jobId);
        return json({ error: "method_not_allowed" }, req, env, 405);
      }

      // Workers AI binding check
      if (p === "/api/ai/binding") {
        const ok = !!(env as any).AI && typeof (env as any).AI.run === "function";
        return json({ ai_bound: ok }, req, env, ok ? 200 : 500);
      }

      // Workers AI test
      if (p === "/api/ai/test") {
        if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);
        let body: any = {}; try { body = await req.json(); } catch {}
        const prompt = (body?.prompt ?? "Say 'pong'").toString();
        const model = pickCfModel(env);
        try {
          const result = await (env as any).AI.run(model, { messages: [{ role: "user", content: prompt }], max_tokens: 64 });
          const text = normalizeWorkersAiText(result);
          return json({ ok: true, model, output: text }, req, env, 200);
        } catch (e: any) {
          return json({ ok: false, error: "ai_run_failed", detail: String(e?.message || e) }, req, env, 500);
        }
      }

      // Admin ping
      if (p === "/api/admin/ping") {
        const k = req.headers.get("X-Admin-Key") || req.headers.get("X-Admin-Token") || "";
        const ok = !!env.ADMIN_API_KEY && k === env.ADMIN_API_KEY;
        return json({ ok }, req, env, ok ? 200 : 401);
      }

      // Admin cleanup
      if (p === "/api/admin/cleanup") {
        return handleAdminCleanup(req, env);
      }

      // Direct upload to R2
      if (p === "/api/upload/direct") {
        if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);
        return handleUploadDirect(req, env);
      }

      // SI ask (provider-ordered chat + usage + credit deduct + headers)
      if (p === "/api/si/ask" || p === "/si/ask") {
        if (req.method !== "POST") return json({ error: "method_not_allowed" }, req, env, 405);

        const email = getCallerEmail(req) || "anonymous";
        let body: any = {}; try { body = await req.json(); } catch {}
        const skill = (body?.skill ?? "general").toString();
        const input = (body?.input ?? "").toString();

        const messages: ChatMessage[] = [
          { role: "system", content: `You are a helpful assistant. Skill="${skill}". Keep replies concise.` },
          { role: "user",   content: input || "Say hello." }
        ];

        // ---- credits pre-check: block if empty (except guests) ----
        const isGuest = (email || "").startsWith("guest:");
        const balRow = await getBalance(env, email);
        if (!isGuest && (balRow.balance_credits ?? 0) <= 0) {
          return json(
            { error: "insufficient_credits", balance_credits: balRow.balance_credits },
            req,
            env,
            402, // Payment Required
          );
        }

        try {
          const out = await runPreferred(env, messages);
          const creditsUsed = round3(creditsFor(Number(out.tokens_in || 0), Number(out.tokens_out || 0), env));

          // log usage (durable via waitUntil to survive response end)
          ctx.waitUntil(
            appendUsage(
              env,
              email,
              "/api/si/ask",
              Number(out.tokens_in || 0),
              Number(out.tokens_out || 0),
              creditsUsed,
              { provider: out.provider, model: out.model, skill }
            ).then(() => {}).catch(() => {})
          );

          // deduct credits if possible (skip for guests)
          let updatedBalance: number | null = null;
          if (!isGuest && creditsUsed > 0 && email) {
            try {
              const row = await adjustBalance(env, email, -creditsUsed);
              updatedBalance = row.balance_credits;
            } catch { /* ignore */ }
          }

          const extraHeaders: Record<string, string> = {
            "X-Provider": out.provider,
            "X-Model": out.model,
            "X-Tokens-In": String(out.tokens_in ?? 0),
            "X-Tokens-Out": String(out.tokens_out ?? 0),
            "X-Credits-Used": creditsUsed.toFixed(3),
          };
          if (updatedBalance !== null) extraHeaders["X-Credits-Balance"] = updatedBalance.toFixed(3);

          return json({ result: { content: out.text } }, req, env, 200, extraHeaders);
        } catch (e: any) {
          return json({ error: "si_ask_failed", detail: String(e?.message || e) }, req, env, 502);
        }
      }

      // Not found
      return json({ error: "not_found", path: p }, req, env, 404);
    } catch (err: any) {
      // Top-level safety net: always send JSON with CORS
      return json(
        { error: "internal_error", message: String(err?.message ?? err) },
        req,
        env,
        500
      );
    }
  }
};
