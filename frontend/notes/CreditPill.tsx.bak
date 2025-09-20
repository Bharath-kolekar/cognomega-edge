// frontend/src/components/CreditPill.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchCreditBalance, formatCreditsLabel } from "../lib/billing/credits";

type Props = {
  /** Optional: how often to refresh (ms). Default 5000. */
  refreshMs?: number;
  /** Optional: extra classes to tweak placement. */
  className?: string;
  /** Back-compat: accepted but not required. */
  email?: string;
  /** Back-compat: accepted but not required. */
  apiBase?: string;
};

export default function CreditPill({
  refreshMs = 5000,
  className = "",
}: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const nf = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }),
    []
  );

  const label = useMemo(() => {
    const info =
      balance !== null
        ? ({ ok: true, remaining: balance } as const)
        : ({ ok: false, error: "unavailable" } as const);
    return formatCreditsLabel(info as any);
  }, [balance]);

  const statusColor = useMemo(() => {
    if (pending) return "bg-amber-400";
    if (error) return "bg-rose-500";
    return "bg-emerald-500";
  }, [pending, error]);

  const formattedBalance =
    balance === null ? "—" : nf.format(balance);

  const lastUpdatedText = useMemo(() => {
    if (!lastAt) return "never";
    const d = new Date(lastAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, [lastAt]);

  const probe = async (manual = false) => {
    if (pending) return;
    setPending(true);
    setError(null);

    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    abortRef.current = new AbortController();

    try {
      const v = await fetchCreditBalance(abortRef.current.signal as any);
      if (v !== null) {
        setBalance(v);
        setLastAt(Date.now());
      } else {
        setError("Unavailable");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setPending(false);
    }
  };

  // initial + polling
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await probe();
      if (!mounted) return;
      timerRef.current = window.setInterval(() => probe(), refreshMs);
    })();
    return () => {
      mounted = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, [refreshMs]);

  return (
    <div
      className={[
        "inline-flex select-none items-center gap-2 rounded-full border border-slate-200",
        "bg-white/80 px-3 py-1 text-sm text-slate-900 shadow-sm backdrop-blur",
        "transition-colors",
        className,
      ].join(" ")}
      role="status"
      aria-live="polite"
      title={`${label} • Updated: ${lastUpdatedText}${error ? ` • Error: ${error}` : ""}`}
      data-testid="credit-pill"
    >
      {/* status dot */}
      <span
        className={[
          "h-2 w-2 rounded-full",
          statusColor,
          pending ? "animate-pulse" : "",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* label */}
      <span className="hidden sm:inline text-slate-600">Credits</span>

      {/* value */}
      <span
        className={[
          "font-semibold tabular-nums",
          error ? "text-rose-600" : "text-slate-900",
        ].join(" ")}
        aria-label={label}
      >
        {formattedBalance}
      </span>

      {/* spinner / refresh */}
      {pending ? (
        <svg
          className="ml-0.5 h-3 w-3 animate-spin text-slate-500"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        <button
          type="button"
          onClick={() => probe(true)}
          className={[
            "ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full",
            "hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
          ].join(" ")}
          title="Refresh credits"
          aria-label="Refresh credits"
        >
          {/* refresh icon */}
          <svg
            className="h-3.5 w-3.5 text-slate-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      )}

      {/* subtle meta on larger screens */}
      <span className="ml-1 hidden text-xs text-slate-500 sm:inline">
        {error ? "retry" : `updated ${lastUpdatedText}`}
      </span>
    </div>
  );
}
