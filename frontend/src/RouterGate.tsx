// frontend/src/RouterGate.tsx
import React, { Suspense, useEffect, useMemo, useState } from "react";

const LazySketchToApp = React.lazy(() => import("./pages/SketchToApp"));
const LazyMainApp = React.lazy(() => import("./App"));

/**
 * RouterGate — ultra-light client router
 * - Chooses between the Sketch→App tool and the main App bundle
 * - Handles direct path, hash-based, and query-string routes
 * - Listens to history changes (back/forward)
 * - Gracefully retries on chunk-load failures
 */

type RouteKind = "sketch" | "app";

function isSketchMatchFromPath(path: string): boolean {
  // Normalize and match a few legacy shapes as well
  const p = (path || "/").toLowerCase();
  return (
    /^\/tools\/sketch-to-app(?:\/|$)/.test(p) ||
    /^\/tools\/sketch(?:\/|$)/.test(p) ||
    /^\/sketch-to-app(?:\/|$)/.test(p)
  );
}

function pickRoute(): RouteKind {
  if (typeof window === "undefined") return "app";

  const path = window.location.pathname || "/";
  const search = window.location.search || "";
  const hash = (window.location.hash || "").replace(/^#\/?/, "/");

  // 1) Path-based
  if (isSketchMatchFromPath(path)) return "sketch";

  // 2) Hash-based SPA style (#/tools/sketch-to-app)
  if (isSketchMatchFromPath(hash)) return "sketch";

  // 3) Query-based (?page=sketch or ?tool=sketch-to-app)
  const qp = new URLSearchParams(search);
  const page = (qp.get("page") || qp.get("tool") || "").toLowerCase();
  if (page === "sketch" || page === "sketch-to-app") return "sketch";

  return "app";
}

export default function RouterGate() {
  // Track route and retry key (to recover from chunk failures)
  const [route, setRoute] = useState<RouteKind>(() => pickRoute());
  const [retryKey, setRetryKey] = useState(0);

  // Respond to history navigation or hash changes
  useEffect(() => {
    const onNav = () => setRoute(pickRoute());
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, []);

  // Preload the other chunk when idle (small perf win on subsequent nav)
  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb)
        : setTimeout(cb, 400);
    idle(() => {
      if (route === "sketch") {
        // warm main bundle
        void import("./App");
      } else {
        // warm tool bundle
        void import("./pages/SketchToApp");
      }
    });
  }, [route]);

  const isSketch = route === "sketch";
  const Comp = useMemo(() => (isSketch ? LazySketchToApp : LazyMainApp), [isSketch]);

  return (
    <ChunkErrorBoundary onRetry={() => setRetryKey((n) => n + 1)} isSketch={isSketch}>
      <Suspense fallback={<PageFallback isSketch={isSketch} />}>
        {/* retryKey forces remount on retry */}
        <div key={retryKey}>
          <Comp />
        </div>
      </Suspense>
    </ChunkErrorBoundary>
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
        background: "#f8fafc", // slate-50
        color: "#334155", // slate-700
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
            border: "3px solid #cbd5e1", // slate-300
            borderTopColor: "#111827", // slate-900
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

/** Simple error boundary to recover from failed dynamic import / chunk load */
class ChunkErrorBoundary extends React.Component<
  { onRetry: () => void; isSketch: boolean },
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch() {
    // no-op; we just render a friendly UI with retry
  }
  handleRetry = () => {
    this.setState({ error: null });
    // Attempt to pre-import the failed bundle before retry mount
    if (this.props.isSketch) {
      void import("./pages/SketchToApp").catch(() => {});
    } else {
      void import("./App").catch(() => {});
    }
    this.props.onRetry();
  };
  render() {
    if (!this.state.error) return this.props.children as React.ReactElement;

    const isChunkErr =
      this.state.error &&
      /Loading chunk [\w-]+ failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(
        String(this.state.error?.message || this.state.error)
      );

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fff7ed", // orange-50
          color: "#7c2d12", // orange-900
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, marginBottom: 12 }}>
            {isChunkErr
              ? "We couldn't load part of the app bundle (possibly a transient network error)."
              : "An unexpected error occurred while loading this page."}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #fed7aa",
                background: "#ffedd5",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Reload page
            </button>
          </div>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "#7c2d12" }}>
              Error details
            </summary>
            <pre
              style={{
                marginTop: 8,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                background: "#fff",
                color: "#7c2d12",
                padding: 10,
                border: "1px solid #ffe4e6",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
