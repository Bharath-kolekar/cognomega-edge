import React, { Suspense, useMemo } from "react";

const LazySketchToApp = React.lazy(() => import("./pages/SketchToApp"));
const LazyMainApp   = React.lazy(() => import("./App"));

/**
 * Minimal client router:
 * - If path matches /tools/sketch-to-app (with or without trailing slash), load SketchToApp lazily
 * - Otherwise load the main App lazily
 * This keeps initial bundle small and speeds first paint for the tool page.
 */
export default function RouterGate() {
  const path =
    (typeof window !== "undefined" ? window.location.pathname : "/") || "/";

  const isSketch = /^\/tools\/sketch-to-app(?:\/|$)/.test(path);
  const Comp = useMemo(() => (isSketch ? LazySketchToApp : LazyMainApp), [isSketch]);

  return (
    <Suspense fallback={<PageFallback isSketch={isSketch} />}>
      <Comp />
    </Suspense>
  );
}

function PageFallback({ isSketch }: { isSketch: boolean }) {
  // Lightweight inline fallback (no CSS dependency) to avoid a blank screen.
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",       // slate-50
        color: "#334155",            // slate-700
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            margin: "0 auto 12px",
            border: "3px solid #cbd5e1",       // slate-300
            borderTopColor: "#111827",         // slate-900
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <div>{isSketch ? "Loading Sketch → App…" : "Loading app…"}</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
