// frontend/src/lib/turnstile.ts
// Loads Cloudflare Turnstile, renders an invisible widget, and exposes a single
// helper to fetch a token. Also exposes window.__cogGetTurnstileToken() for callers
// like frontend/src/lib/auth/guest.ts

// Site key comes from Vite env (Cloudflare Pages → Project > Settings > Environment Variables)
const SITE_KEY: string = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY ?? "";

// Types for the global turnstile shim
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: Record<string, unknown>
      ) => string;
      execute: (widgetId: string, opts?: Record<string, unknown>) => void;
      remove: (widgetId: string) => void;
    };
    __cogGetTurnstileToken?: () => Promise<string>;
  }
}

let scriptReady: Promise<void> | null = null;
let widgetId: string | null = null;
let containerEl: HTMLDivElement | null = null;
let pendingResolvers: Array<(t: string) => void> = [];

/** Dynamically load the Turnstile script once. */
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptReady) return scriptReady;

  scriptReady = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(s);
  });

  return scriptReady;
}

/** Ensure a hidden container and a single invisible widget exist. */
async function ensureWidget(): Promise<void> {
  await loadScript();
  if (!SITE_KEY) throw new Error("missing_site_key");

  if (!containerEl) {
    containerEl = document.createElement("div");
    containerEl.id = "cf-turnstile-container";
    // Keep it out of layout/paint; invisible widget renders here
    containerEl.style.position = "fixed";
    containerEl.style.bottom = "-99999px";
    containerEl.style.width = "0";
    containerEl.style.height = "0";
    document.body.appendChild(containerEl);
  }

  if (!widgetId) {
    // Render an invisible widget with a callback that resolves waiting callers
    widgetId = window.turnstile!.render(containerEl, {
      sitekey: SITE_KEY,
      size: "invisible",
      "error-callback": () => {
        // Drop and recreate on next call
        try { if (widgetId) window.turnstile!.remove(widgetId); } catch { /* ignore */ }
        widgetId = null;
      },
      callback: (token: string) => {
        const resolvers = pendingResolvers.splice(0, pendingResolvers.length);
        for (const r of resolvers) r(token);
      },
    }) as unknown as string;
  }
}

/** Get a fresh Turnstile token (renders/executes the invisible widget). */
export async function getTurnstileToken(): Promise<string> {
  await ensureWidget();

  return new Promise<string>((resolve, reject) => {
    pendingResolvers.push(resolve);
    try {
      window.turnstile!.execute(widgetId!, { action: "guest" });
    } catch (e) {
      // On any execute failure, drop widget so next call recreates it
      try { if (widgetId) window.turnstile!.remove(widgetId); } catch { /* ignore */ }
      widgetId = null;
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

/** Optional: remove widget (generally not needed). */
export function destroyTurnstileWidget() {
  try { if (widgetId) window.turnstile?.remove(widgetId); } catch { /* ignore */ }
  widgetId = null;
  if (containerEl?.parentNode) containerEl.parentNode.removeChild(containerEl);
  containerEl = null;
}

// Expose a single global helper for other modules (e.g., guest.ts) to call.
if (typeof window !== "undefined") {
  window.__cogGetTurnstileToken = getTurnstileToken;
}

export default getTurnstileToken;
