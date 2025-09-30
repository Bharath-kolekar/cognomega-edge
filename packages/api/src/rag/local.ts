/* eslint-disable @typescript-eslint/no-explicit-any */
// packages/api/src/rag/local.ts
// Local-first embeddings + reranker for RAG quality parity.
// - Talks to a local OpenAI-compatible gateway (vLLM / llama.cpp / FastAPI).
// - NO public routes here; import internally only.
//
// Endpoints (env overrides):
//   LOCAL_LLM_URL        e.g. http://127.0.0.1:8000/v1/chat/completions
//   LOCAL_EMBED_URL      e.g. http://127.0.0.1:8000/v1/embeddings  (derived from LOCAL_LLM_URL if unset)
//   LOCAL_RERANK_URL     e.g. http://127.0.0.1:8000/v1/rerank
//
// Models (env overrides):
//   LOCAL_EMBED_MODEL    default "local-embedding"
//   LOCAL_RERANK_MODEL   default "local-reranker"
//
// Auth (optional):
//   LOCAL_API_KEY        -> sends Authorization: Bearer <key>
//
// Behavior:
// 1) Embeddings: OpenAI-compatible request/response.
// 2) Rerank: Cohere-compatible request/response (tolerant to variants).
// 3) Fallbacks:
//    a) If rerank endpoint down → cosine over local embeddings.
//    b) If embeddings down too → lexical scorer (token overlap).
//
// Guard:
// - Honors ALLOW_PROVIDERS allow-list and requires "local" to be present.

type EnvLike = {
  ALLOW_PROVIDERS?: string;

  LOCAL_LLM_URL?: string;

  LOCAL_EMBED_URL?: string;
  LOCAL_EMBED_MODEL?: string;

  LOCAL_RERANK_URL?: string;
  LOCAL_RERANK_MODEL?: string;

  LOCAL_API_KEY?: string;
};

export type DocRow = { id: string; text: string; meta?: any; score: number };

const DEFAULTS = {
  EMBED_URL: "http://127.0.0.1:8000/v1/embeddings",
  RERANK_URL: "http://127.0.0.1:8000/v1/rerank",
  EMBED_MODEL: "local-embedding",
  RERANK_MODEL: "local-reranker",
};

function isLocalAllowed(env: EnvLike): boolean {
  const list = String(env.ALLOW_PROVIDERS ?? "local")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes("local");
}

function deriveEmbeddingsUrl(env: EnvLike): string {
  if (env.LOCAL_EMBED_URL && String(env.LOCAL_EMBED_URL).trim()) {
    return String(env.LOCAL_EMBED_URL).trim();
  }
  const base = String(env.LOCAL_LLM_URL || "").trim();
  if (!base) return DEFAULTS.EMBED_URL;
  try {
    const u = new URL(base);
    return `${u.origin}/v1/embeddings`;
  } catch {
    return DEFAULTS.EMBED_URL;
  }
}

function headersFor(env: EnvLike): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (env.LOCAL_API_KEY && String(env.LOCAL_API_KEY).trim()) {
    h.authorization = `Bearer ${String(env.LOCAL_API_KEY).trim()}`;
  }
  return h;
}

/* -----------------------------
 * Embeddings (OpenAI-compatible)
 * ----------------------------- */

export type EmbeddingResult = {
  embeddings: number[][];
  model: string;
  dim: number;
  provider: "local";
};

export async function localEmbed(
  env: EnvLike,
  texts: string[],
  opts?: { model?: string; batch?: number; signal?: AbortSignal }
): Promise<EmbeddingResult | null> {
  if (!isLocalAllowed(env)) throw new Error("provider_not_allowed:local");

  const url = deriveEmbeddingsUrl(env);
  const model = opts?.model || env.LOCAL_EMBED_MODEL || DEFAULTS.EMBED_MODEL;
  const batchSize = clamp(Math.floor(opts?.batch ?? 32), 1, 256);

  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) chunks.push(texts.slice(i, i + batchSize));

  const out: number[][] = [];
  let dim = 0;

  for (const chunk of chunks) {
    const res = await fetch(url, {
      method: "POST",
      headers: headersFor(env),
      body: JSON.stringify({ model, input: chunk }),
      signal: opts?.signal,
    });
    const text = await safeText(res);
    let j: any = null;
    try { j = JSON.parse(text || "{}"); } catch { /* ignore */ }

    if (!res.ok) {
      // If local embed server is down/unavailable, signal null (so caller can lexical-fallback)
      return null;
    }

    const vecs: number[][] =
      Array.isArray(j?.data) ? j.data.map((d: any) => (Array.isArray(d?.embedding) ? d.embedding : [])) : [];
    if (!vecs.length || vecs.some((v) => !v.length)) {
      // Malformed embeddings: treat as unavailable → caller can fallback
      return null;
    }

    if (!dim) dim = vecs[0].length;
    out.push(...vecs);
  }

  return { embeddings: out, model, dim, provider: "local" };
}

/* -----------------------------
 * Rerank (Cohere-compatible)
 * ----------------------------- */

export type RerankResult = {
  results: Array<{ index: number; score: number }>; // best-first
  model: string;
  provider: "local";
  used_fallback?: boolean | "embeddings" | "lexical";
};

export async function localRerank(
  env: EnvLike,
  query: string,
  documents: string[],
  opts?: { model?: string; topK?: number; topN?: number; minScore?: number; signal?: AbortSignal }
): Promise<RerankResult> {
  if (!isLocalAllowed(env)) throw new Error("provider_not_allowed:local");

  const url = (env.LOCAL_RERANK_URL && String(env.LOCAL_RERANK_URL).trim()) || DEFAULTS.RERANK_URL;
  const model = opts?.model || env.LOCAL_RERANK_MODEL || DEFAULTS.RERANK_MODEL;
  const nDocs = documents.length;
  const topN = clamp(
    Math.floor(typeof opts?.topK === "number" ? opts!.topK! : (opts?.topN ?? nDocs)),
    1,
    nDocs
  );

  // 1) Try dedicated rerank endpoint
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headersFor(env),
      body: JSON.stringify({ model, query, documents, top_n: topN }),
      signal: opts?.signal,
    });
    const text = await safeText(res);
    let j: any = null;
    try { j = JSON.parse(text || "{}"); } catch { /* ignore */ }

    if (res.ok && j) {
      // Tolerate multiple shapes:
      // - { results: [{ index, relevance_score }...] }
      // - { results: [{ index, score }...] }
      // - { data:    [{ index, score }...] }
      const arr: any[] = Array.isArray(j?.results)
        ? j.results
        : Array.isArray(j?.data)
        ? j.data
        : [];

      const items: Array<{ index: number; score: number }> = arr
        .map((r: any) => ({
          index: Number(r?.index ?? r?.document_index ?? 0),
          score: Number(r?.relevance_score ?? r?.score ?? 0),
        }))
        .filter((r) => Number.isFinite(r.index) && r.index >= 0 && r.index < nDocs);

      if (items.length) {
        items.sort((a, b) => b.score - a.score);
        let out = items.slice(0, topN);
        if (typeof opts?.minScore === "number" && Number.isFinite(opts.minScore)) {
          out = out.filter((r) => r.score >= (opts.minScore as number));
        }
        return {
          results: out,
          model: j?.model || model,
          provider: "local",
        };
      }
      // If shape is empty, fall through to embeddings…
    }
    // Not ok or no usable results → fall through
  } catch {
    // Network/connection errors → fall through to embeddings…
  }

  // 2) Fallback: cosine via local embeddings
  const emb = await localEmbed(env, [query, ...documents], {
    model: env.LOCAL_EMBED_MODEL || DEFAULTS.EMBED_MODEL,
    signal: opts?.signal,
  });

  if (emb && emb.embeddings.length >= 2) {
    const qv = normalize(emb.embeddings[0]);
    const scores: Array<{ index: number; score: number }> = [];
    for (let i = 0; i < nDocs; i++) {
      const dv = normalize(emb.embeddings[i + 1] || []);
      scores.push({ index: i, score: cosine(qv, dv) });
    }
    scores.sort((a, b) => b.score - a.score);
    let out = scores.slice(0, topN);
    if (typeof opts?.minScore === "number" && Number.isFinite(opts.minScore)) {
      out = out.filter((r) => r.score >= (opts.minScore as number));
    }
    return { results: out, model: model + "+embed-fallback", provider: "local", used_fallback: "embeddings" };
  }

  // 3) Last resort: lexical overlap
  const lex = documents
    .map((t, i) => ({ index: i, score: lexicalScore(query, t) }))
    .sort((a, b) => b.score - a.score);

  let out = lex.slice(0, topN);
  if (typeof opts?.minScore === "number" && Number.isFinite(opts.minScore)) {
    out = out.filter((r) => r.score >= (opts.minScore as number));
  }
  return { results: out, model: model + "+lexical-fallback", provider: "local", used_fallback: "lexical" };
}

/* -----------------------------
 * Utilities
 * ----------------------------- */

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function normalize(v: number[]): number[] {
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i] || 0;
    s += x * x;
  }
  const mag = Math.sqrt(s) || 1;
  const out = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = (v[i] || 0) / mag;
  return out;
}

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += (a[i] || 0) * (b[i] || 0);
  return dot;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function lexicalScore(query: string, text: string): number {
  // Simple overlap / sqrt(len) — fast and decent as a last resort
  const q = new Set(tokenize(query));
  const d = tokenize(text);
  if (!q.size || !d.length) return 0;
  let overlap = 0;
  for (const t of d) if (q.has(t)) overlap++;
  return overlap / Math.sqrt(Math.max(1, d.length));
}
