// frontend/src/lib/turnstile.ts
// Single, HMR-safe Turnstile loader + token getter.
// - Loads the script once
// - Renders one hidden widget (size:flexible, appearance:execute)
// - Queues calls so execute() is never overlapped
// - Exposes window.__cogGetTurnstileToken()

type Turnstile = {
  render: (
    el: HTMLElement | string,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      "error-callback"?: (err: unknown) => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      theme?: "auto" | "light" | "dark";
      // IMPORTANT: "size" must be one of: "normal" | "compact" | "flexible"
      size?: "normal" | "compact" | "flexible";
      // Let us trigger programmatically:
      appearance?: "always" | "execute" | "interaction-only";
    }
  ) => string;
  execute: (widgetId?: string) => void;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
    __cogTSLoader?: Promise<void>;
    __cogTSWidgetId?: string | null;
    __cogTSBusy?: boolean;
    __cogTSInFlight?: Promise<string> | null;
    __cogGetTurnstileToken?: () => Promise<string>;
  }
}

const W = window as any;

function loadTurnstileOnce(): Promise<void> {
  if (W.turnstile) return Promise.resolve();
  if (W.__cogTSLoader) return W.__cogTSLoader;

  W.__cogTSLoader = new Promise<void>((resolve) => {
    // If a script tag is already present, just wait for turnstile to appear.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[id="cf-turnstile-api"],script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]'
    );
    if (existing) {
      const tick = () =>
        W.turnstile ? resolve() : setTimeout(tick, 25);
      tick();
      return;
    }

    const s = document.createElement("script");
    s.id = "cf-turnstile-api";
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    (s as any).defer = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });

  return W.__cogTSLoader;
}

async function ensureWidget(): Promise<string> {
  await loadTurnstileOnce();

  if (W.__cogTSWidgetId) return W.__cogTSWidgetId;

  const sitekey =
    (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY ||
    (window as any).VITE_TURNSTILE_SITE_KEY ||
    "";

  if (!sitekey) {
    console.warn("[turnstile] VITE_TURNSTILE_SITE_KEY is missing");
  }

  // Hidden container
  let host = document.getElementById("cf-ts-host") as HTMLDivElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = "cf-ts-host";
    host.style.position = "fixed";
    host.style.left = "-9999px";
    host.style.top = "-9999px";
    document.body.appendChild(host);
  }

  let resolveToken!: (v: string) => void;
  let rejectToken!: (e: unknown) => void;

  // We’ll capture the next token here; getTurnstileToken will create a Promise around this.
  const nextToken = new Promise<string>((res, rej) => {
    resolveToken = res;
    rejectToken = rej;
  });

  const id = (window.turnstile as Turnstile).render(host, {
    sitekey,
    // IMPORTANT: allowed sizes: "normal" | "compact" | "flexible"
    size: "flexible",
    // Let us call execute() programmatically:
    appearance: "execute",
    theme: "auto",
    callback: (token) => {
      try {
        resolveToken(token);
      } catch {}
    },
    "error-callback": (err) => {
      try {
        rejectToken(err);
      } catch {}
    },
    "expired-callback": () => {
      // Token expired before we consumed it; just resolve empty and let caller retry.
      try {
        resolveToken("");
      } catch {}
    },
  });

  // Store widget id and the pending promise slot (to be replaced per call)
  W.__cogTSWidgetId = id;
  W.__cogTSInFlight = null;

  // Ensure the first render completed; we won't return this first token here—
  // token acquisition happens via getTurnstileToken().
  nextToken.catch(() => void 0);
  return id;
}

async function _getTokenOnce(): Promise<string> {
  const id = await ensureWidget();

  // Guard: if execute is already running, wait for the in-flight promise.
  if (W.__cogTSBusy && W.__cogTSInFlight) {
    return W.__cogTSInFlight;
  }

  W.__cogTSBusy = true;
  const tokenP = new Promise<string>((resolve, reject) => {
    // Reset to a known state then execute.
    try {
      (window.turnstile as Turnstile).reset(id);
    } catch {}
    try {
      (window.turnstile as Turnstile).execute(id);
    } catch (e) {
      W.__cogTSBusy = false;
      reject(e);
      return;
    }

    // We intercept the token via the widget callback.
    // To keep this function self-contained, we poll until the token changes.
    // But since we wired the resolve in render(), we just wait a short tick and reuse in-flight slot.
    const waitForToken = () => {
      // Next token will resolve via callback wired in render()
      // We swap in a one-shot promise here:
      const p = new Promise<string>((res, rej) => {
        // Reuse the global slot for others to await
        W.__cogTSInFlight = new Promise<string>((ires, irej) => {
          // Bridge: when render callback fires, it will call resolveToken we set there.
          // We piggyback by temporarily replacing resolve/reject to also resolve these.
          const origHost = document.getElementById("cf-ts-host");
          // Nothing to do; just keep references alive.
          void origHost;
        });
        // We can’t directly hook here; instead, re-render already wired callback will resolve.
        // So just race a microtask to pick up whatever the global in-flight will be set to.
        queueMicrotask(() => {
          if (W.__cogTSInFlight) {
            W.__cogTSInFlight.then(res).catch(rej);
          } else {
            // Fallback: give it a moment then check again
            setTimeout(waitForToken, 25);
          }
        });
      });
      p.then(resolve).catch(reject);
    };
    waitForToken();
  });

  try {
    const token = await tokenP;
    return token || "";
  } finally {
    W.__cogTSBusy = false;
    W.__cogTSInFlight = null;
  }
}

async function getTurnstileToken(): Promise<string> {
  try {
    const t = await _getTokenOnce();
    return typeof t === "string" ? t : "";
  } catch (e) {
    console.warn("[turnstile] token error:", e);
    return "";
  }
}

// Expose on window so other code (e.g. guest auth) can call it.
if (typeof window !== "undefined") {
  W.__cogGetTurnstileToken = getTurnstileToken;
}

export { getTurnstileToken };
