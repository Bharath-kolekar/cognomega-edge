// frontend/src/components/UsageFeed.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, authHeaders, readUserEmail } from "../lib/api/apiBase";

type Props = {
  /** Optional; guests may not have an email. */
  email?: string | null;
  /** Optional; if not a non-empty string, we fall back to apiUrl(). */
  apiBase?: string | unknown;
  /** Poll interval (ms). Default 30s. */
  refreshMs?: number;
  /** Maximum rows to render. Default 10. */
  limit?: number;
};

type UsageEvent = {
  created_at: string;
  route: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_credits?: number;
  // passthrough for any other props the server might return
  [k: string]: any;
};

type LocalPrompt = { ts: number; text: string };

/* ------------------- local prompt correlation helpers ------------------- */
const LS_KEY = "cm_usage_prompts";
const MATCH_WINDOW_MS = 5 * 60 * 1000; // ±5 minutes

function readLocalPrompts(): LocalPrompt[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as LocalPrompt[]) : [];
    // keep last 200 and last 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return arr
      .filter((p) => typeof p?.ts === "number" && typeof p?.text === "string" && p.ts >= cutoff)
      .slice(-200);
  } catch {
    return [];
  }
}

function matchPrompt(evTimeMs: number, prompts: LocalPrompt[]): string | undefined {
  let best: LocalPrompt | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const p of prompts) {
    const d = Math.abs(p.ts - evTimeMs);
    if (d < bestDelta && d <= MATCH_WINDOW_MS) {
      best = p;
      bestDelta = d;
    }
  }
  return best?.text;
}

function clip(s: string, n = 120): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

/* ----------------------------- url helpers ----------------------------- */
function joinBase(base: Props["apiBase"], path: string): string {
  const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
  if (typeof base !== "string" || !base.trim()) {
    // Fall back to apiUrl() which knows the resolved base
    return apiUrl(cleanPath);
  }
  return `${base.replace(/\/+$/, "")}${cleanPath}`;
}

/* --------------------------- Response normalization --------------------------- */
function normalizeUsagePayload(data: any): UsageEvent[] {
  // Accept a few common shapes:
  // 1) { usage: UsageEvent[] }
  // 2) { items: UsageEvent[] }
  // 3) { data: UsageEvent[] }
  // 4) { events: UsageEvent[] }
  // 5) UsageEvent[]
  if (Array.isArray(data)) return data as UsageEvent[];

  if (Array.isArray(data?.usage)) return data.usage as UsageEvent[];
  if (Array.isArray(data?.items)) return data.items as UsageEvent[];
  if (Array.isArray(data?.data)) return data.data as UsageEvent[];
  if (Array.isArray(data?.events)) return data.events as UsageEvent[];

  // Best-effort mapping if the items are in a slightly different shape
  const src =
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.usage?.items) && data.usage.items) ||
    (Array.isArray(data?.results) && data.results) ||
    null;

  if (Array.isArray(src)) {
    return (src as any[]).map((it) => ({
      created_at:
        it.created_at ??
        it.timestamp ??
        it.ts ??
        (typeof it.time === "number" ? new Date(it.time).toISOString() : new Date().toISOString()),
      route: it.route ?? it.path ?? it.endpoint ?? "",
      tokens_in: it.tokens_in ?? it.tin ?? it.in ?? undefined,
      tokens_out: it.tokens_out ?? it.tout ?? it.out ?? undefined,
      cost_credits: it.cost_credits ?? it.credits ?? it.cost ?? undefined,
      ...it,
    }));
  }

  return [];
}

/* --------------------------------- UI ---------------------------------- */
export default function UsageFeed({
  email,
  apiBase,
  refreshMs = 30000, // 30s default
  limit = 10,
}: Props) {
  const [items, setItems] = useState<UsageEvent[]>([]);
  const [loading, setLoad] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lpVer, setLpVer] = useState(0); // bump when localStorage changes
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Only allow usage feed on production app domain or allowed localhost ports.
  const originOk = useMemo(() => {
    try {
      const o = window.location.origin.toLowerCase();
      return (
        o === "https://app.cognomega.com" ||
        o === "http://localhost:5173" ||
        o === "http://localhost:5174"
      );
    } catch {
      return true;
    }
  }, []);

  const debug = (() => {
    try {
      return (localStorage.getItem("debug_usage") || "").trim() === "1";
    } catch {
      return false;
    }
  })();

  const load = useCallback(async () => {
    try {
      setErr(null);

      // If we're on a preview domain, quietly skip (CORS would block).
      if (!originOk) {
        if (debug) console.info("[UsageFeed] skipping on preview origin (CORS)");
        setItems([]);
        setLoad(false);
        return;
      }

      // cancel any in-flight request
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
      const ac = new AbortController();
      abortRef.current = ac;

      // Compose headers using authHeaders + optional email
      const who =
        (typeof email === "string" && email.trim() ? email.trim() : null) || readUserEmail() || undefined;

      const headers = authHeaders({
        Accept: "application/json",
        ...(who ? { "X-User-Email": who } : {}),
      }) as HeadersInit;

      // Try canonical first, then a few alternates (including /api/v1).
      const candidates = [
        joinBase(apiBase, "/api/billing/usage"),
        joinBase(apiBase, "/api/v1/billing/usage"),
        joinBase(apiBase, "/billing/usage"),
        joinBase(apiBase, "/api/usage"),
        joinBase(apiBase, "/usage"),
      ];

      let chosen = "";
      let data: any = null;

      for (const url of candidates) {
        try {
          const r = await fetch(url, {
            method: "GET",
            headers,
            cache: "no-store",
            signal: ac.signal,
            credentials: "omit",
            mode: "cors",
          });

          const ct = (r.headers.get("content-type") || "").toLowerCase();
          const isJson = ct.includes("application/json");
          const parsed = isJson ? await r.json() : await r.text();

          if (debug) console.info("[UsageFeed] probe", url, r.status, ct);

          if (r.ok && isJson) {
            chosen = url;
            data = parsed;
            break;
          }
        } catch (e) {
          if (debug) console.warn("[UsageFeed] probe error", url, e);
          // continue
        }
      }

      if (!chosen) {
        throw new Error("usage endpoint not found");
      }

      const list: UsageEvent[] = normalizeUsagePayload(data);
      if (debug) console.info("[UsageFeed] chosen", chosen, "events", list.length);

      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      // On preview domains CORS shows up as "Failed to fetch" — we already skip above,
      // but be extra defensive and silence network noise.
      const msg = (e?.message || "").toString().toLowerCase();
      if (!originOk && msg.includes("failed to fetch")) {
        setErr(null);
      } else if (!(e?.name === "AbortError")) {
        setErr(e?.message || "Error loading usage");
      }
    } finally {
      setLoad(false);
      abortRef.current = null;
    }
  }, [apiBase, originOk, debug, email]);

  // initial + polling refresh
  useEffect(() => {
    setLoad(true);
    void load();
    intervalRef.current = window.setInterval(load, Math.max(5000, refreshMs)) as unknown as number;
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
    };
  }, [load, refreshMs]);

  // listen to localStorage updates so the What column refreshes immediately
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setLpVer((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const localPrompts = useMemo(() => readLocalPrompts(), [lpVer]);

  const fmtWhen = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const whatLabel = (x: UsageEvent) => {
    const route = x.route || "";
    const isAsk =
      route.includes("/api/si/ask") ||
      route.includes("/v1/si/ask") ||
      route.includes("/si/ask") ||
      (route.includes("ask") && route.includes("/api/"));
    if (isAsk) {
      const prompt = matchPrompt(new Date(x.created_at).getTime(), localPrompts);
      return prompt ? `Q: ${clip(prompt)}` : "Q: (prompt not captured locally)";
    }
    if (
      route.includes("/v1/files/upload") ||
      route.includes("/files/upload") ||
      route.includes("/api/upload/direct")
    ) {
      return "Upload processed";
    }
    return "Usage";
  };

  const rows = items.slice(0, Math.max(1, limit));

  return (
    <section className="mt-12 space-y-4" aria-live="polite">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Recent usage
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Telemetry for the last {Math.max(1, limit)} requests.
          </p>
        </div>
      </div>

      {!originOk && (
        <div className="message-bubble" data-tone="info">
          Usage feed is unavailable on preview domains (CORS). Open{" "}
          <code className="ml-2 rounded-full bg-white/60 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-200">
            https://app.cognomega.com
          </code>{" "}
          or run locally to view.
        </div>
      )}

      {originOk && loading && (
        <div className="message-bubble" data-tone="info">
          Loading…
        </div>
      )}

      {originOk && err && (
        <div className="message-bubble" data-tone="error">
          Error loading usage
        </div>
      )}

      {originOk && !loading && !err && rows.length === 0 && (
        <div className="message-bubble" data-tone="info">
          No recent usage
        </div>
      )}

      {originOk && !loading && !err && rows.length > 0 && (
        <div className="glass-surface-soft overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/40 text-left text-sm text-slate-700 dark:divide-white/10 dark:text-slate-200">
              <thead className="bg-white/70 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">What</th>
                  <th className="px-4 py-3 text-right">Tokens</th>
                  <th className="px-4 py-3 text-right">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {rows.map((x, i) => {
                  const tIn = Number.isFinite(Number(x.tokens_in)) ? Number(x.tokens_in) : 0;
                  const tOut = Number.isFinite(Number(x.tokens_out)) ? Number(x.tokens_out) : 0;
                  const cr =
                    typeof x.cost_credits === "number"
                      ? x.cost_credits.toFixed(3)
                      : Number.isFinite(Number(x.cost_credits))
                      ? Number(x.cost_credits).toFixed(3)
                      : "0.000";

                  return (
                    <tr key={`${x.created_at}-${i}`} className="bg-white/50 text-sm dark:bg-slate-900/50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {fmtWhen(x.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{whatLabel(x)}</div>
                        {x.route && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{x.route}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1">
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100">
                            {tIn}
                          </span>
                          <span className="text-slate-400">+</span>
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100">
                            {tOut}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-0.5 font-mono text-[11px] font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-100">
                          {cr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/40 bg-white/50 px-4 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
            Auto-refreshing every {Math.round((refreshMs ?? 30000) / 1000)}s
          </div>
        </div>
      )}
    </section>
  );
}
