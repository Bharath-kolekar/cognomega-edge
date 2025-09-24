import React, { useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "light" | "dark";
const THEME_KEY = "cm_theme";

function applyTheme(mode: ThemeMode) {
  try {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    if (mode === "light") root.classList.add("theme-light");
    if (mode === "dark") root.classList.add("theme-dark");
    if (mode === "system") {
      // rely on prefers-color-scheme (no override classes)
    }
    localStorage.setItem(THEME_KEY, mode);
  } catch {}
}

function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = (localStorage.getItem(THEME_KEY) || "system") as ThemeMode;
      return saved;
    } catch {
      return "system";
    }
  });
  useEffect(() => { applyTheme(mode); }, [mode]);
  return [mode, setMode];
}

type Props = {
  /** Optional API status pill */
  apiOk?: boolean;
  provider?: string;
  model?: string;
  /** Optional credit balance (e.g., from your header poll) */
  credits?: number;
  onRefreshCredits?: () => void;
};

export default function TopNav({ apiOk, provider, model, credits, onRefreshCredits }: Props) {
  const [mode, setMode] = useTheme();
  const apiLabel = useMemo(() => {
    if (apiOk === undefined) return "API: …";
    return apiOk ? `API: OK${provider ? " · " + provider : ""}${model ? " · " + model : ""}` : "API: down";
  }, [apiOk, provider, model]);

  return (
    <nav className="flex h-14 items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-violet-500 via-cyan-400 to-sky-400 shadow-md" />
        <div className="brand-gradient select-none text-base font-extrabold tracking-tight">
          Cognomega
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-white/40 bg-white/60 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 sm:inline-flex">
          {apiLabel}
        </span>
      </div>

      {/* Right side: credits & theme */}
      <div className="flex items-center gap-2">
        {typeof credits === "number" ? (
          <button
            type="button"
            onClick={onRefreshCredits}
            className="hidden items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white/70 active:scale-[.99] dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 sm:inline-flex"
            title="Refresh credits"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            {credits.toFixed(2)} credits
          </button>
        ) : null}

        <div
          role="radiogroup"
          aria-label="Theme"
          className="glass-surface-soft hidden items-center gap-1 rounded-full px-1.5 py-1 text-xs shadow-sm sm:flex"
        >
          {(["system", "light", "dark"] as ThemeMode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                role="radio"
                aria-checked={active}
                onClick={() => setMode(m)}
                className={`rounded-full px-2.5 py-1 font-semibold outline-none transition ${
                  active
                    ? "bg-gradient-to-br from-violet-500 to-cyan-400 text-white"
                    : "text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
                }`}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
