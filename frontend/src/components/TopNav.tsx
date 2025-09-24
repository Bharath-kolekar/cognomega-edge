// frontend/src/components/TopNav.tsx
import React, { useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

type Props = {
  /** If true, show API “OK” pill; otherwise show “Offline”. */
  apiOk?: boolean;
  /** Optional provider name shown in API pill. */
  provider?: string | null;
  /** Optional model name shown in API pill. */
  model?: string | null;
  /** Current user credits; if undefined, the pill is hidden. */
  credits?: number;
  /** Optional click handler to refresh credits. */
  onRefreshCredits?: () => void;
};

const THEME_KEY = "cm_theme";

/* ---- theme helpers ---- */
function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}
function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const effective = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;

  // For Tailwind "dark:" variants:
  if (effective === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  // For our custom CSS tokens:
  root.dataset.theme = effective;

  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {}
}

/* ---- tiny UI atoms ---- */
function SegButton({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={[
        "px-2.5 py-1 text-xs font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
        active
          ? "rounded-md bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
          : "rounded-md bg-white/60 text-slate-700 hover:bg-white/80 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function TopNav({
  apiOk,
  provider,
  model,
  credits,
  onRefreshCredits,
}: Props) {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  // Apply theme and keep in sync with OS when in "system"
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mm = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mm) return;
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mm.addEventListener?.("change", handler);
    return () => mm.removeEventListener?.("change", handler);
  }, [theme]);

  const apiLabel = useMemo(() => {
    if (!apiOk) return "API: Offline";
    const p = (provider || "").trim();
    const m = (model || "").trim();
    if (p && m) return `API: OK · ${p} · ${m}`;
    if (p) return `API: OK · ${p}`;
    return "API: OK";
  }, [apiOk, provider, model]);

  return (
    <header
      className={[
        "sticky top-0 z-40",
        "border-b border-white/40 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur",
        "dark:border-white/10 dark:from-slate-900/80 dark:to-slate-900/50",
      ].join(" ")}
      role="banner"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6"
        aria-label="Top navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="inline-grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 text-white shadow-glass">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5S17.25 2.5 12 2.5Zm0 16.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"
                fill="currentColor"
                opacity=".9"
              />
              <circle cx="12" cy="12" r="3.25" fill="currentColor" />
            </svg>
          </div>
          <span className="select-none text-base font-semibold text-slate-900 dark:text-slate-100">
            Cognomega
          </span>

          {/* API health pill */}
          <span
            className={[
              "ml-2 hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex",
              apiOk
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100",
            ].join(" ")}
            title={apiLabel}
            aria-live="polite"
          >
            {apiLabel}
          </span>
        </div>

        {/* Right cluster: credits + theme */}
        <div className="flex items-center gap-3">
          {typeof credits === "number" && (
            <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
              <span className="whitespace-nowrap">{credits.toFixed(2)} credits</span>
              {onRefreshCredits && (
                <button
                  type="button"
                  onClick={onRefreshCredits}
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-indigo-300 dark:hover:bg-slate-800/70"
                  title="Refresh credits"
                >
                  Refresh
                </button>
              )}
            </div>
          )}

          {/* Theme segmented control */}
          <div
            role="group"
            aria-label="Theme"
            className="flex items-center gap-1 rounded-xl border border-white/40 bg-white/50 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50"
          >
            <SegButton active={theme === "system"} onClick={() => setTheme("system")} ariaLabel="System theme">
              System
            </SegButton>
            <SegButton active={theme === "light"} onClick={() => setTheme("light")} ariaLabel="Light theme">
              Light
            </SegButton>
            <SegButton active={theme === "dark"} onClick={() => setTheme("dark")} ariaLabel="Dark theme">
              Dark
            </SegButton>
          </div>
        </div>
      </nav>
    </header>
  );
}
