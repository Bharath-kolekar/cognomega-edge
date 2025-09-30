/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/CreditPill.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, authHeaders } from "../lib/api/apiBase";

type Props = {
  /** Optional: override poll interval (ms). Default 45s. */
  refreshMs?: number;
  /** Optional: force a specific API base just for this component. */
  apiBase?: string | unknown;
  /** Compact style (default true). */
  compact?: boolean;
};

type CreditsWire =
  | {
      balance?: number;
      used?: number;
      total?: number;
      currency?: string;
      unit?: string; // e.g., "credits"
      expires_at?: string | null;
      credits?: number; // some APIs use `credits` for current balance
      available?: number; // sometimes present
      pending?: number; // sometimes present
    }
  | Record<string, unknown>;

type NormalizedCredits = {
  balance: number | null;
  used: number | null;
  total: number | null;
  unit: string; // "credits" by default
  expiresAt: string | null;
};

function normalizeCredits(x: CreditsWire): NormalizedCredits {
  const num = (v: any): number | null => (Number.isFinite(Number(v)) ? Number(v) : null);
  const balance =
    num((x as any).balance) ??
    num((x as any).credits) ??
    num((x as any).available) ??
    null;
  const used = num((x as any).used) ?? null;
  const total = num((x as any).total) ?? (balance != null && used != null ? balance + used : null);
  const unit =
    typeof (x as any).unit === "string" && (x as any).unit.trim()
      ? String((x as any).unit)
      : "credits";
  const expiresAt = ((): string | null => {
    const v = (x as any).expires_at;
    if (typeof v === "string" && v.trim()) return v;
    return null;
  })();
  return { balance, used, total, unit, expiresAt };
}

function formatNum(n: number | null, minFrac = 0, maxFrac = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }).format(n);
  } catch {
    return String(n);
  }
}

export default function CreditPill({ refreshMs = 45000, apiBase, compact = true }: Props) {
  const [credits, setCredits] = useState<NormalizedCredits>({
    balance: null,
    used: null,
    total: null,
    unit: "credits",
    expiresAt: null,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [ts, setTs] = useState<number>(0);
  const timer = useRef<number | null>(null);

  const makeUrl = useCallback(
    (path: string) => {
      if (typeof apiBase === "string" && apiBase.trim()) {
        const b = apiBase.trim().replace(/\/+$/, "");
        const p = path.startsWith("/") ? path : `/${path}`;
        return `${b}${p}`;
      }
      return apiUrl(path);
    },
    [apiBase]
  );

  const fetchOnce = useCallback(async () => {
    setStatus("loading");
    setErr(null);
    try {
      const url = makeUrl("/api/credits");
      const r = await fetch(url, {
        method: "GET",
        headers: authHeaders({ Accept: "application/json" }) as HeadersInit,
        credentials: "omit",
        mode: "cors",
      });
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      const data: any = ct.includes("application/json") ? await r.json() : await r.text();
      if (!r.ok) {
        const msg = (typeof data === "string" ? data : data?.error) || `${r.status} ${r.statusText}`;
        throw new Error(String(msg));
      }
      setCredits(normalizeCredits(data as CreditsWire));
      setStatus("ok");
      setTs(Date.now());
    } catch (e: any) {
      setStatus("err");
      setErr(e?.message || "Failed to load credits");
    }
  }, [makeUrl]);

  useEffect(() => {
    void fetchOnce();
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => void fetchOnce(), Math.max(5000, refreshMs));
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [fetchOnce, refreshMs]);

  const tooltip = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Balance: ${formatNum(credits.balance)}`);
    if (credits.used != null) parts.push(`Used: ${formatNum(credits.used)}`);
    if (credits.total != null) parts.push(`Total: ${formatNum(credits.total)}`);
    if (credits.expiresAt) parts.push(`Expires: ${credits.expiresAt}`);
    if (ts) parts.push(`Updated: ${new Date(ts).toLocaleTimeString()}`);
    if (status === "err" && err) parts.push(`Error: ${err}`);
    return parts.join(" • ");
  }, [credits, ts, status, err]);

  const displayValue =
    credits.balance != null ? `${formatNum(credits.balance)} ${credits.unit}` : "—";

  const styles = compact
    ? {
        wrapper: {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        } as React.CSSProperties,
        pill: {
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
          fontSize: 12,
          lineHeight: 1.2,
          cursor: "default",
          userSelect: "none" as const,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 999,
          background: status === "ok" ? "#22c55e" : status === "loading" ? "#f59e0b" : "#ef4444",
          marginRight: 6,
        },
        value: { fontWeight: 600 } as React.CSSProperties,
        button: {
          fontSize: 12,
          padding: "2px 6px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
        } as React.CSSProperties,
      }
    : {
        wrapper: { display: "flex", alignItems: "center", gap: 10 } as React.CSSProperties,
        pill: {
          display: "flex",
          alignItems: "center",
          padding: "6px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
          fontSize: 14,
        } as React.CSSProperties,
        dot: {
          width: 10,
          height: 10,
          borderRadius: 999,
          background: status === "ok" ? "#22c55e" : status === "loading" ? "#f59e0b" : "#ef4444",
          marginRight: 8,
        },
        value: { fontWeight: 600 } as React.CSSProperties,
        button: {
          fontSize: 12,
          padding: "4px 8px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
        } as React.CSSProperties,
      };

  return (
    <div style={styles.wrapper}>
      <div style={styles.pill} title={tooltip}>
        <span style={styles.dot} />
        <span style={{ opacity: 0.8, marginRight: 6 }}>Credits</span>
        <span style={styles.value}>{displayValue}</span>
      </div>
      <button
        type="button"
        style={styles.button}
        onClick={() => void fetchOnce()}
        title="Refresh credits"
        aria-label="Refresh credits"
      >
        Refresh
      </button>
    </div>
  );
}
