// api/src/modules/auth_billing.ts
// Cognomega API — Auth + Billing + Jobs + SI + Uploads
// Self-contained router you can mount from api/src/index.ts without refactors.
//
// Handles (intentionally *not* /ready):
//   POST /auth/guest | /api/auth/guest | /api/v1/auth/guest
//   GET  /.well-known/jwks.json
//   GET  /api/billing/balance            <-- NEW: module-owned balance endpoint (KV)
//   GET  /api/credits | /credits | /api/v1/credits
//   POST /api/credits/adjust
//   GET/POST /api/billing/usage   (aliases: /api/usage, /usage, /api/v1/usage, /api/v1/billing/usage)
//   GET/POST /api/jobs;  GET/PATCH /api/jobs/:id;  POST /api/jobs/run
//   POST /api/si/ask | /si/ask
//   POST /api/upload/direct
//   GET  /api/ai/binding
//   POST /api/ai/test
//   GET  /api/admin/ping
//   POST /api/admin/cleanup

import type { Hono } from "hono";

/* ---------- Minimal R2 type (local) ---------- */
type R2Bucket = {
  put: (
    key: string,
    value: ArrayBuffer | string | ReadableStream,
    opts?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }
  ) => Promise<{ etag?: string; version?: string } | void>;
  get?: (key: string) => Promise<
    | {
        body: ReadableStream | null;
        httpMetadata?: { contentType?: string | null } | null;
      }
    | null
  >;
};

// KV list typing (prevents implicit any recursion errors)
type KVListResult = Awaited<ReturnType<KVNamespace["list"]>>;

export interface AuthBillingEnv {
  // Vars
  ALLOWED_ORIGINS?: string;
  ISSUER?: string;
  JWT_TTL_SEC?: string;
  KID?: string;

  // AI selection & models
  PREFERRED_PROVIDER?: string; // "groq,cfai,openai"
  GROQ_MODEL?: string;
  CF_AI_MODEL?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE?: string;
  GROQ_BASE?: string;
  CREDIT_PER_1K?: string;

  // Uploads
  MAX_UPLOAD_BYTES?: string;

  // Secrets
  PRIVATE_KEY_PEM?: string; // Expect PKCS#8 "BEGIN PRIVATE KEY" (not PKCS#1)
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ADMIN_API_KEY?: string;

  // Bindings
  AI: any;                 // Workers AI binding
  KEYS: KVNamespace;       // public JWKS
  KV_BILLING: KVNamespace; // credits + usage + jobs
  R2_UPLOADS: R2Bucket;    // R2 bucket for uploads
}

type Json = Record<string, unknown> | Array<unknown>;
const enc = new TextEncoder();
const ALLOW_HEADERS =
  // include Intelligence-Tier so browser preflight passes from app
  "Authorization, Content-Type, X-User-Email, x-user-email, X-Admin-Key, X-Admin-Token, X-Intelligence-Tier, x-intelligence-tier";
const EXPOSE_HEADERS =
  // base X-* we always expose (we’ll add X-Request-Id dynamically too)
  "X-Credits-Used, X-Credits-Balance, X-Tokens-In, X-Tokens-Out, X-Provider, X-Model";

/* ---------------- Request ID ---------------- */
function reqIdFrom(req: Request): string {
  // Prefer Cloudflare Ray ID; else random UUID
  return req.headers.get("cf-ray") || crypto.randomUUID();
}

/* ---------------- CORS helpers ---------------- */

function corsHeaders(req: Request, env: AuthBillingEnv): Headers {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allow = allowed.length === 0 ? origin : allowed.includes(origin) ? origin : "";

  const h = new Headers();
  if (allow) h.set("Access-Control-Allow-Origin", allow);
  h.set(
    "Vary",
    "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH");

  // Merge baseline allow-list with whatever headers the browser requested in preflight
  const reqAllow = req.headers.get("Access-Control-Request-Headers") || "";
  const mergedAllow = Array.from(
    new Set(
      [...ALLOW_HEADERS.split(","), ...reqAllow.split(",")]
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).join(", ");
  h.set("Access-Control-Allow-Headers", mergedAllow);

  // Expose our standard X-* plus common response headers we use (downloads, content-type, request id)
  const exposeBaseline = `Content-Type, Content-Disposition, X-Request-Id, ${EXPOSE_HEADERS}`;
  const mergedExpose = Array.from(
    new Set(
      exposeBaseline
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).join(", ");
  h.set("Access-Control-Expose-Headers", mergedExpose);

  h.set("Access-Control-Max-Age", "86400");
  return h;
}

function toJson(
  data: Json,
  req: Request,
  env: AuthBillingEnv,
  status = 200,
  extra?: Record<string, string>
) {
  const h = corsHeaders(req, env);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "no-store");
  h.set("X-Request-Id", reqIdFrom(req));
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => h.set(k, v));
    // auto-expose any x-* we add (+ always expose X-Request-Id)
    const expose = new Set(
      (h.get("Access-Control-Expose-Headers") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    for (const k of Object.keys(extra)) if (/^x-/i.test(k)) expose.add(k);
    expose.add("X-Request-Id");
    if (expose.size)
      h.set("Access-Control-Expose-Headers", Array.from(expose).join(", "));
  }
  return new Response(JSON.stringify(data), { status, headers: h });
}

function noContent(req: Request, env: AuthBillingEnv) {
  const h = corsHeaders(req, env);
  h.set("X-Request-Id", reqIdFrom(req));
  return new Response(null, { status: 204, headers: h });
}

/* ---------------- JWT helpers ---------------- */

function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? enc.encode(input) : new Uint8Array(input);
  // small payloads; spread is OK
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
  // NOTE: expects PKCS#8. If you have "BEGIN RSA PRIVATE KEY" (PKCS#1),
  // convert it to PKCS#8 before storing in PRIVATE_KEY_PEM.
  const pkcs8 = parsePemToPkcs8(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}
function b64uToUtf8(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s = s + "=".repeat(pad);
  try {
    return atob(s);
  } catch {
    return "";
  }
}

async function getJWKS(env: AuthBillingEnv): Promise<{ keys: any[] }> {
  const raw = await env.KEYS.get("jwks");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  return { keys: [] };
}

async function signJwtRS256(
  payload: Record<string, unknown>,
  env: AuthBillingEnv
): Promise<{ token: string; exp: number }> {
  const ttl = Math.max(60, Number(env.JWT_TTL_SEC || "3600"));
  const now = nowSec();
  const exp = now + ttl;
  const header: Record<string, string> = { alg: "RS256", typ: "JWT" };
  if (env.KID) header.kid = env.KID;
  const body = {
    iat: now,
    exp,
    iss: env.ISSUER || "https://api.cognomega.com",
    ...payload,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(body)
  )}`;

  const pem = env.PRIVATE_KEY_PEM;
  if (!pem) throw new Error("PRIVATE_KEY_PEM not configured");
  const key = await importRsaPrivateKey(pem);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(unsigned)
  );
  return { token: `${unsigned}.${b64url(sig)}`, exp };
}

/* ---------------- Caller identity helpers ---------------- */

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.split("=");
    if (!k) return;
    const key = k.trim();
    const val = rest.join("=").trim();
    if (key) out[key] = decodeURIComponent(val || "");
  });
  return out;
}

function unsafeDecodeJwtEmail(tok: string | null | undefined): string | null {
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

  const fromJwt =
    unsafeDecodeJwtEmail(bearerTok) || unsafeDecodeJwtEmail(cookieTok) || "";
  const candidate = q || h || fromJwt;
  return candidate ? candidate.toLowerCase() : null;
}

/* ---------------- Credits + Usage + Jobs ---------------- */

type BalanceRow = { balance_credits: number; updated_at: string };
function balanceRowWithExtras(
  row: BalanceRow,
  extras: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    ...extras,
    balance: row.balance_credits,
    balance_credits: row.balance_credits,
    credits: row.balance_credits,
    updated_at: row.updated_at,
    updated: row.updated_at,
  };
}
function round3(n: number) {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}
function balKey(email: string) {
  return `balance:${email}`;
}

async function getBalance(
  env: AuthBillingEnv,
  email: string
): Promise<BalanceRow> {
  const v = await env.KV_BILLING.get(balKey(email));
  if (v) {
    try {
      const row = JSON.parse(v) as BalanceRow;
      return {
        balance_credits: Number(row.balance_credits || 0),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    } catch {}
  }
  return { balance_credits: 0, updated_at: new Date().toISOString() };
}

async function setBalance(
  env: AuthBillingEnv,
  email: string,
  newBalance: number
): Promise<BalanceRow> {
  const row: BalanceRow = {
    balance_credits: round3(Math.max(0, newBalance)),
    updated_at: new Date().toISOString(),
  };
  await env.KV_BILLING.put(balKey(email), JSON.stringify(row));
  return row;
}
async function adjustBalance(
  env: AuthBillingEnv,
  email: string,
  delta: number
): Promise<BalanceRow> {
  const cur = await getBalance(env, email);
  return setBalance(env, email, cur.balance_credits + delta);
}

/** Standardized balance JSON used across endpoints (keeps README contract). */
function balancePayload(row: BalanceRow, email?: string) {
  return balanceRowWithExtras(row, email ? { email } : {});
}

type UsageEvent = {
  id: string;
  created_at: string;
  route: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_credits?: number;
  meta?: Record<string, unknown>;
  email: string;
};

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
function revTs(ts: number) {
  const v = Math.max(0, Math.min(MAX_SAFE, ts));
  return v ? (MAX_SAFE - v).toString(36) : "0";
}
function usageKey(email: string, ts: number, id: string) {
  return `usage:${email}:${revTs(ts)}:${id}`;
}

async function appendUsage(
  env: AuthBillingEnv,
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
  await env.KV_BILLING.put(usageKey(email, ts, id), JSON.stringify(evt));
  return evt;
}

/* ---------------- AI Orchestrator ---------------- */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
function pickOrder(env: AuthBillingEnv): string[] {
  const raw = (env.PREFERRED_PROVIDER || "groq,cfai,openai").toLowerCase();
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function pickGroqModel(env: AuthBillingEnv) {
  return env.GROQ_MODEL || "llama-3.1-8b-instant";
}
function pickCfModel(env: AuthBillingEnv) {
  return env.CF_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
}
function pickOpenAiModel(env: AuthBillingEnv) {
  return env.OPENAI_MODEL || "gpt-4o-mini";
}
function groqBase(env: AuthBillingEnv) {
  return env.GROQ_BASE || "https://api.groq.com/openai/v1";
}
function openAiBase(env: AuthBillingEnv) {
  return env.OPENAI_BASE || "https://api.openai.com/v1";
}

function normalizeWorkersAiText(out: any): string {
  if (out && typeof out.response === "string") return out.response;
  const c = out?.choices?.[0]?.message?.content;
  if (typeof c === "string") return c;
  return JSON.stringify(out);
}
function estimateTokens(text: string): number {
  const len = (text || "").length;
  return Math.max(1, Math.round(len / 4)); // ~4 chars/token heuristic
}

async function callGroq(env: AuthBillingEnv, messages: ChatMessage[]) {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  const model = pickGroqModel(env);
  const res = await fetch(`${groqBase(env)}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const j: any = await res.json();
  const text = j?.choices?.[0]?.message?.content ?? "";
  const inTok = j?.usage?.prompt_tokens ?? estimateTokens(JSON.stringify(messages));
  const outTok = j?.usage?.completion_tokens ?? estimateTokens(text);
  return { provider: "groq", model, text, tokens_in: inTok, tokens_out: outTok };
}

async function callCfAi(env: AuthBillingEnv, messages: ChatMessage[]) {
  if (!env.AI || typeof env.AI.run !== "function")
    throw new Error("AI binding missing");
  const model = pickCfModel(env);
  const out = await env.AI.run(model, { messages, max_tokens: 512 });
  const text = normalizeWorkersAiText(out);
  const inTok = estimateTokens(JSON.stringify(messages));
  const outTok = estimateTokens(text);
  return { provider: "cfai", model, text, tokens_in: inTok, tokens_out: outTok };
}

async function callOpenAi(env: AuthBillingEnv, messages: ChatMessage[]) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const model = pickOpenAiModel(env);
  const res = await fetch(`${openAiBase(env)}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const j: any = await res.json();
  const text = j?.choices?.[0]?.message?.content ?? "";
  const inTok = j?.usage?.prompt_tokens ?? estimateTokens(JSON.stringify(messages));
  const outTok = j?.usage?.completion_tokens ?? estimateTokens(text);
  return { provider: "openai", model, text, tokens_in: inTok, tokens_out: outTok };
}

async function runPreferred(env: AuthBillingEnv, messages: ChatMessage[]) {
  const order = pickOrder(env);
  const errors: string[] = [];
  for (const p of order) {
    try {
      if (p === "groq") return await callGroq(env, messages);
      if (p === "cfai") return await callCfAi(env, messages);
      if (p === "openai") return await callOpenAi(env, messages);
      errors.push(`unknown provider "${p}"`);
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }
  }
  throw new Error(`all providers failed: ${errors.join(" | ")}`);
}

function creditsFor(tokensIn: number, tokensOut: number, env: AuthBillingEnv): number {
  const per1k = Number(env.CREDIT_PER_1K || "0");
  if (!isFinite(per1k) || per1k <= 0) return 0;
  const total = (tokensIn || 0) + (tokensOut || 0);
  return (total / 1000) * per1k;
}

/* ---------------- Jobs storage ---------------- */

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

function jobRowKey(id: string) {
  return `job:${id}`;
}
function jobsIdxKey(email: string, ts: number, id: string) {
  return `jobs:${email}:${revTs(ts)}:${id}`;
}

async function setJob(env: AuthBillingEnv, job: Job) {
  await env.KV_BILLING.put(jobRowKey(job.id), JSON.stringify(job));
}
async function getJob(env: AuthBillingEnv, id: string): Promise<Job | null> {
  const raw = await env.KV_BILLING.get(jobRowKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Job;
  } catch {
    return null;
  }
}
async function createJob(
  env: AuthBillingEnv,
  email: string,
  type: string,
  params?: Record<string, unknown>
): Promise<Job> {
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

async function processSiJob(env: AuthBillingEnv, jobId: string): Promise<void> {
  const job0 = await getJob(env, jobId);
  if (!job0) return;
  job0.status = "running";
  job0.updated_at = new Date().toISOString();
  await setJob(env, job0);

  const email = job0.email || "anonymous";
  const skill = (job0.params?.["skill"] ?? "general").toString();
  const input = (job0.params?.["input"] ?? "").toString();

  try {
    const isGuest = (email || "").startsWith("guest:");
    const balRow = await getBalance(env, email);
    if (!isGuest && (balRow.balance_credits ?? 0) <= 0) {
      job0.status = "failed";
      job0.result = {
        error: "insufficient_credits",
        ...balancePayload(balRow, email),      };
      job0.updated_at = new Date().toISOString();
      await setJob(env, job0);
      return;
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful assistant. Skill="${skill}". Keep replies concise.`,
      },
      { role: "user", content: input || "Say hello." },
    ];

    const out = await runPreferred(env, messages);
    const creditsUsed = round3(
      creditsFor(
        Number(out.tokens_in || 0),
        Number(out.tokens_out || 0),
        env
      )
    );

    await appendUsage(env, email, "/api/jobs:si", Number(out.tokens_in || 0), Number(out.tokens_out || 0), creditsUsed, {
      provider: out.provider,
      model: out.model,
      skill,
      job_id: job0.id,
    });

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

/* ---------------- Route helpers ---------------- */

function isUsagePath(p: string): boolean {
  return (
    p === "/api/billing/usage" ||
    p === "/billing/usage" ||
    p === "/api/usage" ||
    p === "/usage" ||
    p === "/api/v1/usage" ||
    p === "/api/v1/billing/usage"
  );
}
function isJobsCollection(p: string): boolean {
  return p === "/api/jobs";
}
function getJobId(p: string): string | null {
  const m = p.match(/^\/api\/jobs\/([A-Za-z0-9-]+)$/);
  return m ? m[1] : null;
}

/* ---------- PUBLIC API ---------- */

export async function handleAuthBilling(
  req: Request,
  env: AuthBillingEnv,
  ctx: ExecutionContext
): Promise<Response | null> {
  const url = new URL(req.url);
  const p = (url.pathname.replace(/\/+$/, "") || "/").toLowerCase();

  // We don't own /ready — let outer router handle it
  if (
    p === "/ready" ||
    p === "/api/ready" ||
    p === "/healthz" ||
    p === "/api/healthz" ||
    p === "/api/v1/healthz"
  ) {
    return null;
  }

  // CORS preflight — reply immediately (with request id)
  if (req.method === "OPTIONS") return noContent(req, env);

  try {
    // ---- Auth
    if (p === "/auth/guest" || p === "/api/auth/guest" || p === "/api/v1/auth/guest") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const sub = `guest:${crypto.randomUUID()}`;
      const { token, exp } = await signJwtRS256({ sub, role: "guest" }, env);
      return toJson({ token, exp }, req, env, 200);
    }

    // ---- JWKS
    if (p === "/.well-known/jwks.json") {
      const jwks = await getJWKS(env);
      const h = corsHeaders(req, env);
      h.set("Content-Type", "application/json; charset=utf-8");
      h.set("Cache-Control", "public, max-age=300");
      h.set("X-Request-Id", reqIdFrom(req));
      // ensure X-Request-Id is exposed
      const expose = new Set(
        (h.get("Access-Control-Expose-Headers") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
      expose.add("X-Request-Id");
      h.set("Access-Control-Expose-Headers", Array.from(expose).join(", "));
      return new Response(JSON.stringify(jwks), { status: 200, headers: h });
    }

    // ---- Balance (module-owned; KV source of truth)
    if (p === "/api/billing/balance" || p === "/api/v1/billing/balance") {      if (req.method !== "GET")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const email = getCallerEmail(req);
      if (!email) return toJson({ error: "missing_email" }, req, env, 400);
      const row = await getBalance(env, email);
      return toJson(balancePayload(row, email), req, env, 200);
    }

    // ---- Credits (GET returns balance payload; POST adjust returns same shape)
    if (p === "/api/credits" || p === "/credits" || p === "/api/v1/credits") {
      if (req.method !== "GET")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const email = getCallerEmail(req);
      if (!email) return toJson({ error: "missing_email" }, req, env, 400);
      const row = await getBalance(env, email);
      return toJson(balancePayload(row, email), req, env, 200);
    }

    if (p === "/api/credits/adjust") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const k =
        (req.headers.get("x-admin-key") ||
          req.headers.get("x-admin-token") ||
          "").trim();
      if (!env.ADMIN_API_KEY || k !== env.ADMIN_API_KEY)
        return toJson({ error: "unauthorized" }, req, env, 401);

      let body: any = {};
      try {
        body = await req.json();
      } catch {
        return toJson({ error: "invalid_json" }, req, env, 400);
      }
      const email = (body?.email || "").toString().toLowerCase().trim();
      if (!email) return toJson({ error: "missing_email" }, req, env, 400);

      const hasSet = typeof body?.set === "number";
      const hasDelta = typeof body?.delta === "number" && !Number.isNaN(body.delta);
      if (hasSet && hasDelta)
        return toJson({ error: "set_and_delta_conflict" }, req, env, 400);

      let row: BalanceRow;
      if (hasSet) row = await setBalance(env, email, Number(body.set));
      else if (hasDelta) row = await adjustBalance(env, email, Number(body.delta));
      else return toJson({ error: "nothing_to_do" }, req, env, 400);

      return toJson(balancePayload(row, email), req, env, 200);    }

    // ---- Usage (guarded)
    if (isUsagePath(p)) {
      try {
        if (req.method === "GET") {
          const email = getCallerEmail(req);
          if (!email) return toJson({ error: "missing_email" }, req, env, 400);

          const limit = Math.max(
            1,
            Math.min(Number(new URL(req.url).searchParams.get("limit") || "25"), 100)
          );
          const cursor = new URL(req.url).searchParams.get("cursor") || undefined;

          const prefix = `usage:${email}:`;
          const list = await env.KV_BILLING.list({ prefix, limit, cursor });
          const events: UsageEvent[] = [];
          for (const k of list.keys) {
            const v = await env.KV_BILLING.get(k.name);
            if (v) {
              try {
                events.push(JSON.parse(v) as UsageEvent);
              } catch {}
            }
          }
          return toJson(
            {
              email,
              items: events,
              next_cursor: list.list_complete ? null : list.cursor || null,
            },
            req,
            env,
            200
          );
        }
        if (req.method === "POST") {
          const email = getCallerEmail(req);
          if (!email) return toJson({ error: "missing_email" }, req, env, 400);
          let body: Partial<UsageEvent> = {};
          try {
            body = await req.json();
          } catch {
            return toJson({ error: "invalid_json" }, req, env, 400);
          }
          const createdAt = body.created_at || new Date().toISOString();
          const ts = Date.parse(createdAt) || Date.now();
          const id = body.id || crypto.randomUUID();
          const evt: UsageEvent = {
            id,
            created_at: new Date(ts).toISOString(),
            route: String(body.route || "unknown"),
            tokens_in:
              typeof body.tokens_in === "number" ? body.tokens_in : undefined,
            tokens_out:
              typeof body.tokens_out === "number" ? body.tokens_out : undefined,
            cost_credits:
              typeof body.cost_credits === "number" ? body.cost_credits : undefined,
            meta: body.meta && typeof body.meta === "object" ? body.meta : undefined,
            email,
          };
          await env.KV_BILLING.put(usageKey(email, ts, id), JSON.stringify(evt));
          return toJson({ ok: true, event: evt }, req, env, 200);
        }
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      } catch (e: any) {
        return toJson(
          { events: [], error: "usage_failed", message: String(e?.message ?? e) },
          req,
          env,
          200
        );
      }
    }

    // ---- Jobs
    if (isJobsCollection(p)) {
      if (req.method === "GET") {
        const email = getCallerEmail(req);
        if (!email) return toJson({ error: "missing_email" }, req, env, 400);

        const u = new URL(req.url);
        const limit = Math.max(
          1,
          Math.min(Number(u.searchParams.get("limit") || "25"), 100)
        );
        const cursor = u.searchParams.get("cursor") || undefined;

        const prefix = `jobs:${email}:`;
        const list = await env.KV_BILLING.list({ prefix, limit, cursor });
        const items: Job[] = [];
        for (const k of list.keys) {
          const id = await env.KV_BILLING.get(k.name);
          if (!id) continue;
          const row = await env.KV_BILLING.get(jobRowKey(id));
          if (!row) continue;
          try {
            items.push(JSON.parse(row) as Job);
          } catch {}
        }
        return toJson(
          {
            email,
            items,
            next_cursor: list.list_complete ? null : list.cursor || null,
          },
          req,
          env,
          200
        );
      }

      if (req.method === "POST") {
        const email = getCallerEmail(req);
        if (!email) return toJson({ error: "missing_email" }, req, env, 400);
        let body: any = {};
        try {
          body = await req.json();
        } catch {}
        const type = String(body?.type || "si");
        const params =
          body?.params && typeof body.params === "object" ? body.params : undefined;

        const job = await createJob(env, email, type, params);
        if (type === "si") (ctx as any).waitUntil(processSiJob(env, job.id));
        return toJson({ job }, req, env, 200);
      }

      return toJson({ error: "method_not_allowed" }, req, env, 405);
    }

    if (p === "/api/jobs/run") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const email = getCallerEmail(req);
      if (!email) return toJson({ error: "missing_email" }, req, env, 400);
      let body: any = {};
      try {
        body = await req.json();
      } catch {}
      const type = String(body?.type || "si");
      const params =
        body?.params && typeof body.params === "object" ? body.params : undefined;
      if (type !== "si")
        return toJson({ error: "unsupported_type", type }, req, env, 400);

      const job = await createJob(env, email, type, params);
      await processSiJob(env, job.id);
      const final = await getJob(env, job.id);
      if (!final)
        return toJson(
          { error: "job_missing_after_run", id: job.id },
          req,
          env,
          500
        );
      return toJson({ job: final, mode: "sync" }, req, env, 200);
    }

    const jobId = getJobId(p);
    if (jobId) {
      if (req.method === "GET") {
        const raw = await env.KV_BILLING.get(jobRowKey(jobId));
        if (!raw) return toJson({ error: "not_found" }, req, env, 404);
        try {
          return toJson({ job: JSON.parse(raw) as Job }, req, env, 200);
        } catch {
          return toJson({ error: "corrupt" }, req, env, 500);
        }
      }
      if (req.method === "PATCH") {
        const raw = await env.KV_BILLING.get(jobRowKey(jobId));
        if (!raw) return toJson({ error: "not_found" }, req, env, 404);
        let job: Job;
        try {
          job = JSON.parse(raw) as Job;
        } catch {
          return toJson({ error: "corrupt" }, req, env, 500);
        }
        let body: any = {};
        try {
          body = await req.json();
        } catch {
          return toJson({ error: "invalid_json" }, req, env, 400);
        }
        if (body.status && ["queued", "running", "succeeded", "failed"].includes(body.status))
          job.status = body.status;
        if ("result" in body) job.result = body.result;
        job.updated_at = new Date().toISOString();
        await env.KV_BILLING.put(jobRowKey(jobId), JSON.stringify(job));
        return toJson({ ok: true, job }, req, env, 200);
      }
      return toJson({ error: "method_not_allowed" }, req, env, 405);
    }

    // ---- AI binding + test
    if (p === "/api/ai/binding") {
      const ok = !!(env as any).AI && typeof (env as any).AI.run === "function";
      return toJson({ ai_bound: ok }, req, env, ok ? 200 : 500);
    }
    if (p === "/api/ai/test") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      let body: any = {};
      try {
        body = await req.json();
      } catch {}
      const prompt = (body?.prompt ?? "Say 'pong'").toString();
      try {
        const model = env.CF_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
        const result = await (env as any).AI.run(model, {
          messages: [{ role: "user", content: prompt }],
          max_tokens: 64,
        });
        const text = normalizeWorkersAiText(result);
        return toJson({ ok: true, model, output: text }, req, env, 200);
      } catch (e: any) {
        return toJson(
          { ok: false, error: "ai_run_failed", detail: String(e?.message || e) },
          req,
          env,
          500
        );
      }
    }

    // ---- Admin
    if (p === "/api/admin/ping") {
      const k =
        req.headers.get("X-Admin-Key") ||
        req.headers.get("X-Admin-Token") ||
        "";
      const ok = !!env.ADMIN_API_KEY && k === env.ADMIN_API_KEY;
      return toJson({ ok }, req, env, ok ? 200 : 401);
    }

    if (p === "/api/admin/cleanup") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const k =
        (req.headers.get("x-admin-key") ||
          req.headers.get("x-admin-token") ||
          "").trim();
      if (!env.ADMIN_API_KEY || k !== env.ADMIN_API_KEY)
        return toJson({ error: "unauthorized" }, req, env, 401);

      type CleanupBody = {
        kind?: "usage" | "jobs" | "both";
        older_than_days?: number;
        limit?: number;
        dry_run?: boolean;
        email_prefix?: string;
      };
      let body: CleanupBody = {};
      try {
        body = await req.json<CleanupBody>();
      } catch {
        return toJson({ error: "invalid_json" }, req, env, 400);
      }

      const kind = body.kind || "both";
      const olderDays = Math.max(0, Number(body.older_than_days ?? 30));
      const cutoffTs = Date.now() - olderDays * 24 * 60 * 60 * 1000;
      const hardLimit = Math.max(1, Math.min(Number(body.limit ?? 500), 5000));
      const dryRun = Boolean(body.dry_run);
      const emailPrefix = (body.email_prefix || "").trim();

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

      // usage
      if (kind === "usage" || kind === "both") {
        let cursor: string | undefined = undefined;
        const prefix = `usage:${emailPrefix}`;
        outer: while (true) {
          const list: KVListResult = await env.KV_BILLING.list({ prefix, cursor, limit: 1000 });
          for (const k of list.keys) {
            res.scanned.usage++;
            const v = await env.KV_BILLING.get(k.name);
            if (!v) {
              res.kept.usage_keys++;
              continue;
            }
            let ts = 0;
            try {
              const row = JSON.parse(v) as UsageEvent;
              ts = Date.parse(row.created_at || "");
            } catch {}
            if (ts && ts < cutoffTs) {
              await maybeDelete(k.name);
              res.deleted.usage_keys++;
              if (
                res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys >=
                hardLimit
              )
                break outer;
            } else {
              res.kept.usage_keys++;
            }
          }
          if (
            list.list_complete ||
            res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys >=
              hardLimit
          )
            break;
          cursor = list.cursor;
        }
      }

      // jobs
      if (kind === "jobs" || kind === "both") {
        let cursor: string | undefined = undefined;
        const prefix = `jobs:${emailPrefix}`;
        outer2: while (true) {
          const list: KVListResult = await env.KV_BILLING.list({ prefix, cursor, limit: 1000 });
          for (const k of list.keys) {
            res.scanned.jobs_index++;
            const id = await env.KV_BILLING.get(k.name);
            if (!id) {
              res.kept.job_index_keys++;
              continue;
            }
            const row = await env.KV_BILLING.get(jobRowKey(id));
            res.scanned.jobs_rows_checked++;
            if (!row) {
              await maybeDelete(k.name);
              res.deleted.job_index_keys++;
              if (
                res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys >=
                hardLimit
              )
                break outer2;
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
              if (
                res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys >=
                hardLimit
              )
                break outer2;
            } else {
              res.kept.job_index_keys++;
              res.kept.job_rows++;
            }
          }
          if (
            list.list_complete ||
            res.deleted.usage_keys + res.deleted.job_rows + res.deleted.job_index_keys >=
              hardLimit
          )
            break;
          cursor = list.cursor;
        }
      }

      return toJson(res as any, req, env, 200);
    }

    // ---- Direct R2 upload
    if (p === "/api/upload/direct") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);
      const email = getCallerEmail(req);
      if (!email) return toJson({ error: "missing_email" }, req, env, 400);
      const bucket = (env as any).R2_UPLOADS as R2Bucket | undefined;
      if (!bucket || typeof (bucket as any).put !== "function")
        return toJson({ error: "r2_not_bound" }, req, env, 500);

      const clRaw = req.headers.get("content-length") || "";
      const size = Number(clRaw);
      const maxBytes = Math.max(1, Number(env.MAX_UPLOAD_BYTES || "10485760")); // 10MB
      if (!Number.isFinite(size) || size <= 0)
        return toJson({ error: "length_required" }, req, env, 411);
      if (size > maxBytes)
        return toJson({ error: "payload_too_large", max_bytes: maxBytes }, req, env, 413);

      const u = new URL(req.url);
      const filenameQ = (u.searchParams.get("filename") || "").trim();
      const base = (filenameQ || "").split(/[\\\/]/).pop() || "";
      const cleaned =
        base.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "").slice(0, 128) || "blob";
      const ct =
        (req.headers.get("content-type") || "application/octet-stream")
          .split(";")[0]
          .trim();
      if (!req.body) return toJson({ error: "empty_body" }, req, env, 400);

      const d = new Date();
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const safeEmail = (email || "").replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 64);
      const key = `uploads/${yyyy}/${mm}/${dd}/${safeEmail}/${crypto.randomUUID()}-${cleaned}`;

      const putRes = await (bucket as R2Bucket).put(key, req.body as any, {
        httpMetadata: { contentType: ct },
        customMetadata: {
          uploader: email,
          route: "/api/upload/direct",
          original_filename: cleaned,
        },
      });

      return toJson(
        {
          ok: true,
          key,
          size,
          etag: (putRes as any)?.etag || null,
          version: (putRes as any)?.version || null,
          content_type: ct,
        },
        req,
        env,
        200
      );
    }

    // ---- SI ask
    if (p === "/api/si/ask" || p === "/si/ask") {
      if (req.method !== "POST")
        return toJson({ error: "method_not_allowed" }, req, env, 405);

      const email = getCallerEmail(req) || "anonymous";
      let body: any = {};
      try {
        body = await req.json();
      } catch {}
      const skill = (body?.skill ?? "general").toString();
      const input = (body?.input ?? "").toString();

      const isGuest = (email || "").startsWith("guest:");
      const balRow = await getBalance(env, email);
      if (!isGuest && (balRow.balance_credits ?? 0) <= 0) {
        return toJson(
          { error: "insufficient_credits", ...balancePayload(balRow, email) },          req,
          env,
          402
        );
      }

      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `You are a helpful assistant. Skill="${skill}". Keep replies concise.`,
        },
        { role: "user", content: input || "Say hello." },
      ];

      try {
        const out = await runPreferred(env, messages);
        const creditsUsed = round3(
          creditsFor(
            Number(out.tokens_in || 0),
            Number(out.tokens_out || 0),
            env
          )
        );

        const requestId = reqIdFrom(req);
        (ctx as any).waitUntil(
          appendUsage(
            env,
            email,
            "/api/si/ask",
            Number(out.tokens_in || 0),
            Number(out.tokens_out || 0),
            creditsUsed,
            {
              provider: out.provider,
              model: out.model,
              skill,
              request_id: requestId,
            }
          )
            .then(() => {})
            .catch(() => {})
        );

        let updatedBalance: number | null = null;
        if (!isGuest && creditsUsed > 0 && email) {
          try {
            const row = await adjustBalance(env, email, -creditsUsed);
            updatedBalance = row.balance_credits;
          } catch {}
        }

        const extra: Record<string, string> = {
          "X-Provider": out.provider,
          "X-Model": out.model,
          "X-Tokens-In": String(out.tokens_in ?? 0),
          "X-Tokens-Out": String(out.tokens_out ?? 0),
          "X-Credits-Used": creditsUsed.toFixed(3),
        };
        if (updatedBalance !== null)
          extra["X-Credits-Balance"] = updatedBalance.toFixed(3);

        return toJson({ result: { content: out.text } }, req, env, 200, extra);
      } catch (e: any) {
        return toJson(
          { error: "si_ask_failed", detail: String(e?.message || e) },
          req,
          env,
          502
        );
      }
    }

    // Not ours → let outer router continue
    return null;
  } catch (err: any) {
    return toJson(
      { error: "internal_error", message: String(err?.message ?? err) },
      req,
      env,
      500
    );
  }
}

/* ---------- Hono adapter (mount this in index.ts) ---------- */
export function registerAuthBillingRoutes<AppEnv extends { Bindings: AuthBillingEnv }>(
  app: Hono<AppEnv>
) {
  // Mount as a catchable middleware AFTER your CORS/preflight but BEFORE final catch-all.
  app.use("*", async (c, next) => {
    const res = await handleAuthBilling(c.req.raw, c.env as unknown as AuthBillingEnv, c.executionCtx);
    if (res) return res;
    await next();
  });
}



