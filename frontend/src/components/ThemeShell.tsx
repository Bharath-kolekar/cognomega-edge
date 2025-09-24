import React, { ReactNode, useEffect } from "react";

/** Page shell: glass/aurora backdrop, skip link, and a consistent content container. */
type Props = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** e.g. "7xl" | "full" | "5xl"; default "7xl" */
  maxWidth?: "full" | "7xl" | "5xl" | "4xl";
  /** Add top/bottom padding; default true */
  padded?: boolean;
};

const maxCls: Record<NonNullable<Props["maxWidth"]>, string> = {
  full: "max-w-[1400px]",
  "7xl": "max-w-7xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
};

export default function ThemeShell({
  header,
  footer,
  children,
  maxWidth = "7xl",
  padded = true,
}: Props) {
  // Ensure the page has the aurora backdrop class even if index.html is older
  useEffect(() => {
    try {
      document.body.classList.add("aurora-bg");
      return () => document.body.classList.remove("aurora-bg");
    } catch {}
  }, []);

  return (
    <>
      {/* a11y: skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only fixed left-3 top-3 z-[100] rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Skip to content
      </a>

      {/* Sticky, glass navigation (passed from parent) */}
      {header ? (
        <div className="sticky top-0 z-50 border-b border-white/30 bg-white/55 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
          <div className={`mx-auto ${maxCls[maxWidth]} px-4 sm:px-6 lg:px-8`}>{header}</div>
        </div>
      ) : null}

      <main
        id="main"
        className={`mx-auto ${maxCls[maxWidth]} px-4 sm:px-6 lg:px-8 ${
          padded ? "py-6 sm:py-8" : ""
        }`}
      >
        {children}
      </main>

      {footer ? (
        <footer className={`mx-auto ${maxCls[maxWidth]} px-4 sm:px-6 lg:px-8 py-8`}>{footer}</footer>
      ) : null}
    </>
  );
}
