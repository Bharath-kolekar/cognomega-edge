// frontend/src/App.tsx
import {
  apiBase,
  apiUrl,
  readUserEmail,
  ensureApiBase,
  currentApiBase,
} from "./lib/api/apiBase";

/* global window */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import CreditPill from "./components/CreditPill";
import UsageFeed from "./components/UsageFeed";
import LaunchInBuilder from "./components/LaunchInBuilder";

declare global {
  interface Window {
    turnstile?: any;
    __cogAuthReady?: Promise<string | null>;
  }
}

const TS_SITE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY) ||
  "";

// ---- types for polling UI (mirrors tool page) ----
type Job = {
  id: string;
  status: "queued" | "working" | "done" | "error" | string;
  progress?: string | number | null;
};
type UploadResp =
  | { ok: true; key: string; size: number; job_id: string; status: string }
  | { error: string; [k: string]: any };

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 120_000;

// ---- local prompt capture for UsageFeed matching ----
const LS_KEY = "cm_usage_prompts";
const MAX_PROMPTS = 200;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readPrompts(): { ts: number; text: string }[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as { ts: number; text: string }[]) : [];
    const cutoff = Date.now() - MAX_AGE_MS;
    return arr
      .filter((p) => typeof p?.ts === "number" && typeof p?.text === "string" && p.ts >= cutoff)
      .slice(-MAX_PROMPTS);
  } catch {
    return [];
  }
}
function writePrompts(arr: { ts: number; text: string }[]) {
  try {
    const pruned = arr
      .filter((p) => p && typeof p.ts === "number" && typeof p.text === "string")
      .slice(-MAX_PROMPTS);
    const s = JSON.stringify(pruned);
    localStorage.setItem(LS_KEY, s);
    try {
      const ev = new StorageEvent("storage", { key: LS_KEY, newValue: s });
      window.dispatchEvent(ev);
    } catch {
      window.dispatchEvent(new Event("storage"));
    }
  } catch {
    /* ignore */
  }
}
function pushPrompt(text: string) {
  if (!text || !text.trim()) return;
  const list = readPrompts();
  list.push({ ts: Date.now(), text: text.trim() });
  writePrompts(list);
}

// ---- tiny helpers for guest token persistence ----
const nowSec = () => Math.floor(Date.now() / 1000);
function persistGuestToken(token: string, ttlSecOrExp: number) {
  try {
    const exp =
      ttlSecOrExp > 2_000_000_000 /* looks like epoch? */ ? ttlSecOrExp : nowSec() + ttlSecOrExp;
    localStorage.setItem("guest_token", token);
    localStorage.setItem("jwt", token);
    localStorage.setItem("cog_auth_jwt", JSON.stringify({ token, exp }));
    try {
      const ev = new StorageEvent("storage", {
        key: "cog_auth_jwt",
        newValue: JSON.stringify({ token, exp }),
      });
      window.dispatchEvent(ev);
    } catch {
      window.dispatchEvent(new Event("storage"));
    }
  } catch {
    /* no-op */
  }
}

// Normalize any API response (string or object) to {token, ttl}
function extractToken(result: any): { token: string; ttl: number } | null {
  try {
    if (!result) return null;
    const tokenRaw =
      typeof result === "string"
        ? result
        : result.token || result.jwt || result.guest_token || result.access_token;
    if (!tokenRaw || typeof tokenRaw !== "string") return null;

    // Prefer absolute exp; otherwise expires_in; otherwise default 600s
    let ttl = 600;
    const now = nowSec();
    const expAbs = Number(result.exp || result.expires_at);
    const expRel = Number(result.expires_in);
    if (Number.isFinite(expAbs) && expAbs > now) ttl = expAbs - now;
    else if (Number.isFinite(expRel) && expRel > 0) ttl = expRel;

    return { token: tokenRaw, ttl: Math.max(60, ttl) };
  } catch {
    return null;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [resp, setResp] = useState<string>("");
  const [health, setHealth] = useState<string>("checking...");
  const [authMsg, setAuthMsg] = useState<string>("initializing...");
  const [authReady, setAuthReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resolvedBase, setResolvedBase] = useState<string>(apiBase);

  // Poll/download UI state (copied from tool page)
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDone = job?.status === "done";

  const engineRef = useRef<any>(null);
  const [prompt, setPrompt] = useState("Summarize Cognomega in one line.");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const tsDivRef = useRef<HTMLDivElement | null>(null);
  const widRef = useRef<any>(null);
  const tsExecRef = useRef<Promise<string> | null>(null);
  const authBusyRef = useRef(false);

  // In-memory JWT & timer
  const jwtRef = useRef<string>("");
  const refreshTimer = useRef<any>(null);

  // Polling refs
  const pollAbort = useRef<AbortController | null>(null);
  const pollTimer = useRef<number | null>(null);
  const pollStart = useRef<number>(0);

  // ---------- helpers ----------
  const cleanHeaders = useCallback(() => {
    const h: Record<string, string> = { Accept: "application/json" };
    return h;
  }, []);

  const fetchJSON = useCallback(
    async (url: string) => {
      const r = await fetch(url, { headers: cleanHeaders() });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      if (!ct.includes("application/json")) {
        const t = await r.text();
        throw new Error(`Unexpected content-type: ${ct} | ${t.slice(0, 160)}`);
      }
      return r.json();
    },
    [cleanHeaders]
  );

  const startPolling = useCallback(
    (id: string) => {
      if (pollAbort.current) pollAbort.current.abort();
      if (pollTimer.current) window.clearTimeout(pollTimer.current);

      pollAbort.current = new AbortController();
      pollStart.current = Date.now();

      const loop = async () => {
        try {
          if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
            setInfo(null);
            setError("Timed out waiting for job to finish.");
            return;
          }

          const j = await fetchJSON(apiUrl(`/api/jobs/${encodeURIComponent(id)}`));
          const jobObj = (j?.job ?? {}) as any;
          const next: Job = {
            id: jobObj.id,
            status: (jobObj.status || "").toString(),
            progress: jobObj.progress,
          };
          setJob(next);

          if (next.status === "done") {
            setInfo("Job finished. You can download the result.");
            return;
          }
          if (next.status === "error" || next.status === "failed") {
            setError("Job failed.");
            return;
          }

          pollTimer.current = window.setTimeout(loop, POLL_INTERVAL_MS);
        } catch (e: any) {
          setError(e?.message || "Poll failed");
        }
      };

      void loop();
    },
    [fetchJSON]
  );

  const onDownload = useCallback(async () => {
    if (!jobId) return;
    setError(null);
    setInfo("Preparing download…");
    try {
      const r = await fetch(apiUrl(`/api/jobs/${encodeURIComponent(jobId)}/download`), {
        method: "GET",
        headers: cleanHeaders(),
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);

      const cd = r.headers.get("content-disposition") || "";
      const match = cd.match(/filename="([^"]+)"/i);
      const filename = match?.[1] || `job_${jobId}.bin`;

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setInfo("Downloaded.");
    } catch (e: any) {
      setError(e?.message || "Download failed");
    }
  }, [jobId, cleanHeaders]);

  useEffect(() => {
    return () => {
      if (pollAbort.current) pollAbort.current.abort();
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  // --- restore & poll if landing with ?job= in URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("job");
    if (id) {
      setJobId(id);
      setInfo("Restored job from URL. Polling…");
      setError(null);
      startPolling(id);
    }
  }, [startPolling]);

  // --- Optional: when restored job finishes, hint (or auto-download) ---
  useEffect(() => {
    if (jobId && isDone) {
      setInfo("Job finished. You can download the result.");
      // void onDownload(); // enable to auto-download
    }
  }, [jobId, isDone, onDownload]);

  // ---------- health probe & boot ----------
  useEffect(() => {
    (async () => {
      // Ensure API base is resolved before health checks
      try {
        await ensureApiBase();
        setResolvedBase(currentApiBase());
      } catch {}

      // Wait for auth bootstrap if main.tsx exposed it
      try {
        await (window as any).__cogAuthReady;
      } catch {}

      // Health probe: try multiple endpoints, accept JSON only
      const paths = ["/ready", "/api/ready", "/health", "/api/health", "/healthz", "/api/healthz"];
      let reported = false;
      for (const p of paths) {
        try {
          const r = await fetch(apiUrl(p), { headers: { Accept: "application/json" } });
          const ct = (r.headers.get("content-type") || "").toLowerCase();
          if (!r.ok || !ct.includes("application/json")) continue;
          const data = await r.json();
          setHealth(JSON.stringify(data));
          reported = true;
          break;
        } catch {
          // try next
        }
      }
      setHealth((h) => (reported ? h : "down"));
    })();

    // WebLLM (best-effort)
    (async () => {
      try {
        engineRef.current = await CreateWebWorkerMLCEngine(new URL("/"), {
          model: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
        });
        setReady(true);
      } catch {
        setResp("");
      }
    })();

    // Turnstile widget (invisible) + fallback
    let iv: any = null;
    let fb: any = null;

    if (TS_SITE) {
      iv = setInterval(() => {
        if (window.turnstile && tsDivRef.current && !widRef.current) {
          widRef.current = window.turnstile.render(tsDivRef.current, {
            sitekey: TS_SITE,
            appearance: "execute",
            size: "flexible",
          });

          if (fb) {
            clearTimeout(fb);
            fb = null;
          }
          clearInterval(iv);
          iv = null;
          void refreshJwt(); // proceed once widget rendered
        }
      }, 200);

      // Fallback: if Turnstile still not available after 5s, proceed without it
      fb = setTimeout(() => {
        if (!widRef.current) {
          setAuthMsg("turnstile unavailable; proceeding without it");
          void refreshJwt(); // server allows guest without Turnstile
        }
      }, 5000);
    } else {
      // No Turnstile configured → proceed immediately
      void refreshJwt();
    }

    return () => {
      if (iv) clearInterval(iv);
      if (fb) clearTimeout(fb);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  const getTurnstileToken = async (): Promise<string> => {
    if (!TS_SITE || !window.turnstile || !widRef.current) return "";
    if (tsExecRef.current) return tsExecRef.current;
    tsExecRef.current = new Promise<string>((resolve) => {
      try {
        try {
          window.turnstile.reset(widRef.current);
        } catch {}
        window.turnstile.execute(widRef.current, {
          async: true,
          action: "guest",
          callback: (t: string) => resolve(t),
        });
      } catch {
        resolve("");
      }
    }).finally(() => {
      tsExecRef.current = null;
    });
    return tsExecRef.current;
  };

  // ---- Guest auth: try multiple endpoints & methods (fixes 405) ----
  async function fetchGuestTokenMulti(): Promise<{ token: string; ttl: number } | null> {
    let ts = "";
    try {
      ts = await getTurnstileToken();
    } catch {
      ts = "";
    }

    const baseHeaders = {
      Accept: "application/json",
      ...(ts ? { "CF-Turnstile-Token": ts } : {}),
    } as Record<string, string>;

    const candidates: Array<{ url: string; method: "GET" | "POST" }> = [
      { url: apiUrl("/auth/guest"), method: "GET" },
      { url: apiUrl("/auth/guest"), method: "POST" },
      { url: apiUrl("/api/auth/guest"), method: "GET" },
      { url: apiUrl("/api/auth/guest"), method: "POST" },
      { url: apiUrl("/api/gen-jwt"), method: "GET" },
      { url: apiUrl("/gen-jwt"), method: "GET" },
    ];

    for (const c of candidates) {
      try {
        const init: RequestInit = { method: c.method, headers: { ...baseHeaders } };
        if (c.method === "POST") {
          (init.headers as Record<string, string>)["Content-Type"] = "application/json";
          init.body = "{}";
        }
        const r = await fetch(c.url, init);
        const ct = r.headers.get("content-type") || "";
        const data: any = ct.includes("application/json") ? await r.json() : await r.text();
        if (!r.ok) continue;

        const parsed = extractToken(data);
        if (parsed?.token) return parsed;
      } catch {
        // try next
      }
    }
    return null;
  }

  const refreshJwt = async () => {
    if (authBusyRef.current) return;
    authBusyRef.current = true;
    try {
      setAuthMsg("auth: requesting token...");
      const got = await fetchGuestTokenMulti();
      if (!got) throw new Error("auth failed");

      jwtRef.current = got.token;
      persistGuestToken(jwtRef.current, got.ttl);
      setAuthReady(true);

      setAuthMsg(`token ready (exp ${got.ttl}s)`);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const next = Math.max(10, got.ttl - 60);
      refreshTimer.current = setTimeout(refreshJwt, next * 1000);
    } catch (e: any) {
      const msg = e?.message || e;
      setAuthMsg(`auth error: ${msg} – retrying in 30s`);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(refreshJwt, 30000);
    } finally {
      authBusyRef.current = false;
    }
  };

  const ask = async () => {
    setResp("...");
    if (prompt && prompt.trim()) pushPrompt(prompt.trim());

    const email = readUserEmail();
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-user-email": email,
      };
      if (jwtRef.current) headers["Authorization"] = `Bearer ${jwtRef.current}`;

      const r = await fetch(apiUrl("/api/si/ask"), {
        method: "POST",
        headers,
        body: JSON.stringify({ skill: "summarize", input: prompt }),
      });
      const j = await r.json();
      const used = r.headers.get("X-Credits-Used") || "";
      const bal = r.headers.get("X-Credits-Balance") || "";
      setResp(
        (j.result?.content ?? JSON.stringify(j)) +
          (used ? "\n\n[used: " + used + " | balance: " + bal + "]" : "")
      );
    } catch (e: any) {
      setResp("Error: " + (e?.message ?? String(e)));
    }
  };

  // ---------- new upload that mirrors tool page & redirects ----------
  const upload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return alert("Choose a file first.");
    if (!authReady || !jwtRef.current) return alert("Still obtaining auth… try again in a moment.");
    setUploading(true);
    setError(null);
    setInfo("Uploading…");
    setJob(null);
    setJobId(null);

    try {
      const fd = new FormData();
      fd.append("file", f);

      const r = await fetch(apiUrl("/v1/files/upload"), {
        method: "POST",
        headers: {
          // DO NOT set Content-Type for multipart
          Authorization: `Bearer ${jwtRef.current}`,
        },
        body: fd,
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await r.text();
        throw new Error(`Unexpected content-type: ${ct} | ${text.slice(0, 160)}`);
      }

      const j: UploadResp = await r.json();
      if (!r.ok || (j as any).error) {
        const msg = (j as any).error ? String((j as any).error) : `${r.status} ${r.statusText}`;
        throw new Error(msg);
      }

      const ok = j as Extract<UploadResp, { ok: true }>;
      setJobId(ok.job_id);
      setInfo("Uploaded. Processing…");

      // Start polling here as a fallback (in case navigation is blocked)
      startPolling(ok.job_id);

      // Navigate users to the tool page to continue UX there
      const q = new URLSearchParams({ job: ok.job_id }).toString();
      window.location.assign(`/tools/sketch-to-app?${q}`);
    } catch (e: any) {
      const msg = (e?.message || e)?.toString?.() || "";
      if (msg.toLowerCase().includes("failed to fetch")) {
        setResp("Upload error: network/CORS (preflight blocked or offline)");
      } else {
        setResp(`Upload error: ${msg}`);
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Cognomega</h1>
        <div style={{ marginLeft: "auto" }}>
          <CreditPill />
        </div>
      </div>

      <p>API readiness: {health}</p>
      <p>Auth: {authMsg}</p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <textarea
          style={{
            flex: 1,
            padding: 8,
            minHeight: 96,
            resize: "vertical",
            lineHeight: 1.4,
            fontFamily: "inherit",
            fontSize: 14,
          }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything…  (Ctrl/Cmd + Enter to send)"
          onKeyDown={(e) => {
            // Allow plain Enter for newlines; submit on Ctrl+Enter (Win/Linux) or Cmd+Enter (macOS).
            // @ts-expect-error: nativeEvent may have isComposing
            if (e.isComposing || e.nativeEvent?.isComposing) return;
            const isEnter = e.key === "Enter" || e.key === "NumpadEnter";
            if (isEnter && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        <button onClick={ask}>Ask</button>
      </div>

      {/* Real-time App Builder launcher */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        <LaunchInBuilder
          defaultName="Sketch Prototype"
          defaultPages="Home,Dashboard,Chat"
          defaultDesc={prompt || "From Sketch to App"}
        />
      </div>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#111",
          color: "#0f0",
          padding: 12,
          marginTop: 12,
        }}
      >
        {resp}
      </pre>

      <UsageFeed email={readUserEmail()} apiBase={resolvedBase || apiBase} refreshMs={3000} />

      <hr />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Upload file (to R2 via API): </label>
        <input type="file" ref={fileRef} required />
        <button type="button" onClick={upload} disabled={!authReady || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {(jobId || job || error || info) && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          {jobId && (
            <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
              Job: <code style={{ fontSize: 11 }}>{jobId}</code>
            </div>
          )}
          {job && (
            <>
              <div style={{ fontSize: 14 }}>
                <strong>Status:</strong> {job.status}
                {typeof job.progress !== "undefined" && job.progress !== null && <> — {String(job.progress)}%</>}
              </div>
              {isDone && (
                <div style={{ paddingTop: 8 }}>
                  <button
                    onClick={onDownload}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#16a34a",
                      color: "#fff",
                      border: 0,
                    }}
                  >
                    Download result
                  </button>
                </div>
              )}
            </>
          )}
          {info && <div style={{ fontSize: 14, color: "#444", marginTop: 4 }}>{info}</div>}
          {error && <div style={{ fontSize: 14, color: "#b91c1c", marginTop: 4 }}>Error: {error}</div>}
        </div>
      )}

      {/* Invisible Turnstile container */}
      <div ref={tsDivRef} />
    </div>
  );
}
