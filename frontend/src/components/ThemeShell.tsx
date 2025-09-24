// frontend/src/components/ThemeShell.tsx
import React, { useEffect, useMemo } from "react";

type MaxWidthToken =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl";

type Props = {
  /** Optional header node (e.g., <TopNav />). */
  header?: React.ReactNode;
  /** Optional footer node. */
  footer?: React.ReactNode;
  /**
   * Content max width. Accepts Tailwind containers (e.g. "7xl") or a numeric/px string.
   * Defaults to "7xl".
   */
  maxWidth?: MaxWidthToken | number | `${number}px` | string;
  /** Page content. */
  children: React.ReactNode;
  /** Optional main element id (for skip-to-content). */
  mainId?: string;
};

function ensureInitialTheme() {
  try {
    const root = document.documentElement;
    // Do not override if already set by TopNav or elsewhere
    if (root.dataset.theme) return;

    const saved = localStorage.getItem("cm_theme");
    const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const effective =
      mode === "system"
        ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : mode;

    root.dataset.theme = effective;
    if (effective === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  } catch {
    /* noop */
  }
}

export default function ThemeShell({
  header,
  footer,
  maxWidth = "7xl",
  children,
  mainId = "content",
}: Props) {
  // Apply page-wide aurora bg & sensible base classes
  useEffect(() => {
    ensureInitialTheme();
    const b = document.body;
    b.classList.add("aurora-bg", "min-h-screen", "antialiased");
    return () => {
      b.classList.remove("aurora-bg", "min-h-screen", "antialiased");
    };
  }, []);

  const maxWidthClass = useMemo(() => {
    if (typeof maxWidth === "string") {
      // if the string matches Tailwind token, return container class; else we’ll set style maxWidth
      const tokens = new Set([
        "sm",
        "md",
        "lg",
        "xl",
        "2xl",
        "3xl",
        "4xl",
        "5xl",
        "6xl",
        "7xl",
      ]);
      if (tokens.has(maxWidth as MaxWidthToken)) {
        return `max-w-${maxWidth}`;
      }
    }
    return "";
  }, [maxWidth]);

  const styleMax: React.CSSProperties = useMemo(() => {
    if (typeof maxWidth === "number") return { maxWidth };
    if (typeof maxWidth === "string" && !maxWidthClass) {
      // allow arbitrary CSS width strings e.g. "1200px" or "80ch"
      return { maxWidth: maxWidth as string };
    }
    return {};
  }, [maxWidth, maxWidthClass]);

  return (
    <div className="relative">
      {/* Skip to content for keyboard users */}
      <a
        href={`#${mainId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white/90 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 dark:focus:bg-slate-800/90 dark:focus:text-slate-100"
      >
        Skip to content
      </a>

      {/* Decorative background glow (non-interactive) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          maskImage:
            "radial-gradient(70% 55% at 50% 0%, black, transparent 70%)",
        }}
      />

      {/* Optional header (commonly <TopNav />) */}
      {header}

      {/* Main content container */}
      <main
        id={mainId}
        className={[
          "mx-auto w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8",
          maxWidthClass,
        ].join(" ")}
        style={styleMax}
        role="main"
      >
        {children}
      </main>

      {/* Optional footer */}
      {footer ? (
        <footer
          className={[
            "mx-auto w-full border-t border-white/40 px-4 py-6 text-sm text-slate-600 backdrop-blur sm:px-6 lg:px-8",
            "dark:border-white/10 dark:text-slate-300",
            maxWidthClass,
          ].join(" ")}
          style={styleMax}
        >
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
