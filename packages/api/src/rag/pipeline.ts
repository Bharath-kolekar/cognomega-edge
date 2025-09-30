/* eslint-disable @typescript-eslint/no-explicit-any */
// packages/api/src/rag/pipeline.ts
// Thin private RAG helper that composes the local embeddings + reranker.
// No routes here — import from service code where you run search/RAG.

import { localRerank } from "./local";

export type RAGDoc = {
  id?: string;
  text: string;
  meta?: Record<string, unknown>;
};

export type RAGCandidate = {
  index: number;          // original index into `docs`
  score: number;          // higher is better
  id?: string;
  text: string;
  meta?: Record<string, unknown>;
};

export type RankOpts = {
  topK?: number;          // default: all
  minScore?: number;      // optional threshold (0..1 if cosine fallback)
  model?: string;         // local reranker model name
  signal?: AbortSignal;
};

/**
 * New public shape (per request):
 * rankDocuments returns { top: Array<RAGDoc & { score:number }>, used_fallback:boolean }
 * Internally we still compute detailed candidates and then strip the 'index' field.
 */
export async function rankDocuments(
  env: { [k: string]: unknown },
  query: string,
  docs: RAGDoc[],
  opts: RankOpts = {}
): Promise<{ top: Array<RAGDoc & { score: number }>; used_fallback: boolean }> {
  const { candidates, used_fallback } = await rankDocumentsDetailed(env, query, docs, opts);
  const rows = candidates.map((c) => ({
    id: c.id,
    text: c.text,
    meta: c.meta,
    score: c.score,
  }));
  return { top: rows, used_fallback };
}

/**
 * Detailed variant (kept for feature parity):
 * returns scored items including original index.
 */
export async function rankDocumentsDetailed(
  env: { [k: string]: unknown },
  query: string,
  docs: RAGDoc[],
  opts: RankOpts = {}
): Promise<{ candidates: RAGCandidate[]; used_fallback: boolean }> {
  if (!Array.isArray(docs) || docs.length === 0) return { candidates: [], used_fallback: false };

  const texts = docs.map((d) => d.text ?? "");
  const res = await localRerank(env as any, query, texts, {
    topN: Math.min(opts.topK ?? texts.length, texts.length),
    model: opts.model,
    signal: opts.signal,
  });

  const byScore: RAGCandidate[] = res.results
    .map((r) => {
      const base = docs[r.index];
      return {
        index: r.index,
        score: Number.isFinite(r.score) ? r.score : 0,
        id: base?.id,
        text: base?.text ?? "",
        meta: base?.meta,
      };
    })
    .sort((a, b) => b.score - a.score);

  const filtered =
    typeof opts.minScore === "number"
      ? byScore.filter((c) => c.score >= (opts.minScore as number))
      : byScore;

  return { candidates: filtered, used_fallback: !!res.used_fallback };
}

/**
 * Convenience that returns just the top-N texts.
 * Useful when you want a quick “context pack” for a generation step.
 */
export async function topTexts(
  env: { [k: string]: unknown },
  query: string,
  docs: RAGDoc[],
  topK = 5,
  signal?: AbortSignal
): Promise<{ texts: string[]; used_fallback: boolean }> {
  const { top, used_fallback } = await rankDocuments(env, query, docs, { topK, signal });
  return { texts: top.map((t) => t.text), used_fallback };
}
