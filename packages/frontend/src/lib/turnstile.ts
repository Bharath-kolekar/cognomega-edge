// frontend/src/lib/turnstile.ts
// Single, HMR-safe Turnstile loader + token getter.
// - Loads the script exactly once (cached on window)
// - Renders a hidden, one-off invisible widget per call
// - Executes programmatically and resolves with a token (or "" on failure)
// - Exposes window.__cogGetTurnstileToken(opts?) for other modules (e.g., guest auth)

declare global {
  interface Window {
    turnstile?: any; // keep unified with App.tsx and guest.ts
    __cogTSLoader?: Promise<void>;
    __cogTSHost?: HTMLDivElement | null;
    __cogGetTurnstileToken?: (opts?: GetTokenOpts) => Promise<string>;
  }
}

type GetTokenOpts = { sitekey?: string };

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/* ----------------------------- small helpers ----------------------------- */
function hasDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function envSitekey(): string | undefined {
  try {
    return (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY as string | undefined;
  } catch {
    return undefined;
  }
}

function waitForTurnstile(timeoutMs = 4000): Promise<void> {
  if (!hasDOM()) return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const start = Date.now();
  return new Promise<void>((resolve) => {
    const id = window.setInterval(() => {
      if (window.turnstile || Date.now() - start > timeoutMs) {
        window.clearInterval(id);
        resolve();
      }
    }, 50) as unknown as number;
  });
}

/** Load the Turnstile script once (cached across HMR on window). */
function loadScriptOnce(): Promise<void> {
  if (!hasDOM()) return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__cogTSLoader) return window.__cogTSLoader;

  // If already present, just wait for it to populate window.turnstile
  const existing = document.querySelector<HTMLScriptElement>(
    'script#cf-turnstile-api,script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]'
  );
  if (existing) {
    window.__cogTSLoader = waitForTurnstile();
    return window.__cogTSLoader;
  }

  window.__cogTSLoader = new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.id = "cf-turnstile-api";
    s.src = TURNSTILE_SRC;
    s.async = true;
    (s as any).defer = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => resolve(); // resolve anyway; caller will detect absence
    document.head.appendChild(s);
  }).then(() => waitForTurnstile());

  return window.__cogTSLoader;
}

function ensureHost(): HTMLDivElement {
  if (!hasDOM()) throw new Error("No DOM");
  if (window.__cogTSHost && document.body.contains(window.__cogTSHost)) {
    return window.__cogTSHost;
  }
  const host = document.createElement("div");
  host.id = "cf-ts-host";
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  document.body.appendChild(host);
  window.__cogTSHost = host;
  return host;
}

/* ------------------------------- main API -------------------------------- */
/**
 * Render an invisible widget, execute it, and resolve with the token.
 * Returns "" if sitekey/script is missing or a runtime error occurs.
 */
export async function getTurnstileToken(opts?: GetTokenOpts): Promise<string> {
  if (!hasDOM()) return "";

  const sitekey = opts?.sitekey || envSitekey();
  if (!sitekey) {
    // Soft-fail: environments without a key should not block the UI
    return "";
  }

  await loadScriptOnce();
  if (!window.turnstile || typeof window.turnstile.render !== "function") {
    return "";
  }

  // Create a temporary container for this run (don’t reuse across calls to avoid race conditions)
  const host = ensureHost();
  const container = document.createElement("div");
  host.appendChild(container);

  try {
    const token = await new Promise<string>((resolve) => {
      const widgetId = window.turnstile.render(container, {
        sitekey,
        size: "invisible",            // hidden widget
        appearance: "execute",        // allow programmatic execute
        callback: (t: string) => resolve(t || ""),
        "error-callback": () => resolve(""),
        "timeout-callback": () => resolve(""),
        "expired-callback": () => resolve(""),
      });

      // Some builds require an explicit execute
      try {
        if (typeof window.turnstile.execute === "function") {
          window.turnstile.execute(widgetId);
        }
      } catch {
        // ignore; callbacks above will cover success/failure
      }
    });

    return typeof token === "string" ? token : "";
  } catch {
    return "";
  } finally {
    // Best-effort cleanup: reset & remove the container
    try {
      if (typeof window.turnstile?.reset === "function") {
        try { window.turnstile.reset(); } catch {}
      }
      if (container.parentElement) container.parentElement.removeChild(container);
    } catch {
      /* ignore */
    }
  }
}

/* ---------------------------- global exposure ---------------------------- */
// Expose for other modules (guest auth uses this if present)
if (hasDOM()) {
  window.__cogGetTurnstileToken = getTurnstileToken;
}

export {}; // ensure this file is a module
