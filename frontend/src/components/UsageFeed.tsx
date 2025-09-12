// frontend/src/components/UsageFeed.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../lib/api/apiBase";

type Props = {
  /** Optional; guests may not have an email. */
  email?: string | null;
  /** Optional; if not a non-empty string, we fall back to apiUrl(). */
  apiBase?: string | unknown;
  /** Poll interval (ms). Default 15s. */
  refreshMs?: number;
};

type UsageEvent = {
  created_at: string;
  route: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_credits?: number;
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

function clip(s: string, n = 100): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

/* ----------------------------- auth helpers ----------------------------- */
/** Read a bearer token from localStorage (handles our current + legacy keys). */
function readToken(): string | null {
  try {
    // Preferred JSON payload: { token, exp }
    const saved = localStorage.getItem("cog_auth_jwt");
    if (saved) {
      try {
        const j = JSON.parse(saved);
        if (j?.token && typeof j.token === "string") return j.token;
      } catch {
        /* ignore JSON parse error */
      }
    }
    // Back-compat fallbacks (string tokens)
    const jwt = localStorage.getItem("jwt");
    if (jwt && jwt.trim()) return jwt.trim();
    const guest = localStorage.getItem("guest_token");
    if (guest && guest.trim()) return guest.trim();
  } catch {
    /* ignore storage errors (SSR/sandbox) */
  }
  return null;
}

/* --------------------------- URL construction --------------------------- */
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
  // 1) { events: UsageEvent[] }
  // 2) { items: [...]}  (map best-effort)
  // 3) UsageEvent[]
  if (Array.isArray(data)) return data as UsageEvent[];
  if (Array.isArray(data?.events)) return data.events as UsageEvent[];
  if (Array.isArray(data?.items)) {
    return (data.items as any[]).map((it) => ({
      created_at:
        it.created_at ??
        it.timestamp ??
        it.ts ??
        (typeof it.time === "number" ? new Date(it.time).toISOString() : new Date().toISOString()),
      route: it.route ?? it.path ?? it.endpoint ?? "",
      tokens_in: it.tokens_in ?? it.tin ?? it.in ?? undefined,
      tokens_out: it.tokens_out ?? it.tout ?? it.out ?? undefined,
      cost_credits: it.cost_credits ?? it.credits ?? it.cost ?? undefined,
    }));
  }
  return [];
}

/* --------------------------------- UI ---------------------------------- */
export default function UsageFeed({ email, apiBase, refreshMs = 15000 }: Props) {
  const [items, setItems] = useState<UsageEvent[]>([]);
  const [loading, setLoad] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lpVer, setLpVer] = useState(0); // bump when localStorage changes
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);

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
      // cancel any in-flight request
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
      const ac = new AbortController();
      abortRef.current = ac;

      // Build headers WITHOUT custom x-user-email to avoid CORS preflight on GET
      const headers: Record<string, string> = { Accept: "application/json" };
      const tok = readToken();
      if (tok) headers["Authorization"] = `Bearer ${tok}`;

      // Try canonical first, then a few alternates.
      const candidates = [
        joinBase(apiBase, "/api/billing/usage"),
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
      if (!(e?.name === "AbortError")) {
        setErr(e?.message || "Error loading usage");
      }
    } finally {
      setLoad(false);
      abortRef.current = null;
    }
  }, [apiBase, debug]);

  // initial + polling refresh
  useEffect(() => {
    setLoad(true);
    void load();
    intervalRef.current = window.setInterval(load, refreshMs) as unknown as number;
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
      return prompt ? `Q: ${clip(prompt, 120)}` : "Q: (prompt not captured locally)";
    }
    if (route.includes("/v1/files/upload") || route.includes("/files/upload")) {
      return "Upload processed";
    }
    return "Usage";
  };

  const rows = items.slice(0, 10);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Recent usage</div>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: "#b91c1c" }}>Error loading usage</div>}
      {!loading && !err && rows.length === 0 && <div>No recent usage</div>}

      {!loading && !err && rows.length > 0 && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              lineHeight: 1.35,
            }}
          >
            <thead style={{ background: "#f9fafb", color: "#111827" }}>
              <tr>
                <th style={th}>Timestamp</th>
                <th style={th}>What</th>
                <th style={thRight}>Tokens</th>
                <th style={thRight}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x, i) => {
                const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
                const tIn = x.tokens_in ?? 0;
                const tOut = x.tokens_out ?? 0;
                const cr =
                  typeof x.cost_credits === "number" ? x.cost_credits.toFixed(3) : "0.000";
                return (
                  <tr key={`${x.created_at}-${i}`} style={{ background: bg }}>
                    <td style={td}>{fmtWhen(x.created_at)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{whatLabel(x)}</div>
                    </td>
                    <td style={tdRight}>
                      <span style={pill}>{tIn}</span>
                      <span style={{ margin: "0 4px" }}>+</span>
                      <span style={pill}>{tOut}</span>
                    </td>
                    <td style={tdRight}>
                      <span style={creditBadge}>{cr}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div
            style={{
              padding: "6px 10px",
              fontSize: 11,
              color: "#6b7280",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            Auto-refreshing every {Math.round((refreshMs ?? 15000) / 1000)}s
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- tiny inline styles to avoid extra CSS ---- */
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
  fontSize: 12,
};
const thRight: React.CSSProperties = { ...th, textAlign: "right", whiteSpace: "nowrap" };
const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};
const tdRight: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };

const pill: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 999,
  background: "#eef2ff",
  color: "#3730a3",
  fontSize: 12,
  minWidth: 22,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
};

const creditBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 6,
  background: "#ecfeff",
  color: "#155e75",
  fontVariantNumeric: "tabular-nums",
  fontSize: 12,
};
