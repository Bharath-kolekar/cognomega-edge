// frontend/src/App.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiUrl,
  readUserEmail,
  ensureApiBase,
} from "./lib/api/apiBase";

import ThemeShell from "./components/ThemeShell";
import TopNav from "./components/TopNav";
import CreditPill from "./components/CreditPill";
import LaunchInBuilder from "./components/LaunchInBuilder";
import UsageFeed from "./components/UsageFeed";
import VoiceGuide from "./components/VoiceGuide";

declare global {
  interface Window {
    turnstile?: any;
    __cogAuthReady?: Promise<string | null>;
    __apiBase?: string;
    webkitSpeechRecognition?: any;
  }
}

// Minimal SpeechRecognition type (keeps TS happy across browsers)
type SpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult?: (ev: any) => void;
  onend?: () => void;
  onerror?: (ev?: any) => void;
};

const TS_SITE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY) ||
  "";

// ---- types for polling UI (kept; used elsewhere) ----
type Job = {
  id: string;
  status: "queued" | "working" | "done" | "error" | string;
  progress?: string | number | null;
};

type Tier = "human" | "advanced" | "super";
type ABVariant = "A" | "B";
type Skill =
  | "summarize"
  | "codegen"
  | "refactor"
  | "testgen"
  | "explain"
  | "plan"
  | "api-design"
  | "sql"
  | "data-viz"
  | "translate"
  | "vision-analyze";

const SKILLS: { id: Skill; label: string }[] = [
  { id: "summarize", label: "Summarize" },
  { id: "codegen", label: "Code Generation" },
  { id: "refactor", label: "Refactor" },
  { id: "testgen", label: "Test Generation" },
  { id: "explain", label: "Explain Code" },
  { id: "plan", label: "Plan / Decompose" },
  { id: "api-design", label: "API Design" },
  { id: "sql", label: "SQL / Analytics" },
  { id: "data-viz", label: "Data Visualization" },
  { id: "translate", label: "Translate" },
  { id: "vision-analyze", label: "Vision: Analyze" },
];

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 120_000;

// ---- local prompt capture for (optional) usage matching ----
const LS_KEY = "cm_usage_prompts";
const MAX_PROMPTS = 200;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readPrompts(): { ts: number; text: string }[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as { ts: number; text: string }[]) : [];
    const cutoff = Date.now() - MAX_AGE_MS;
    return arr
      .filter(
        (p) =>
          typeof p?.ts === "number" &&
          typeof p?.text === "string" &&
          p.ts >= cutoff
      )
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
      ttlSecOrExp > 2_000_000_000 ? ttlSecOrExp : nowSec() + ttlSecOrExp;
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

function getOrCreateClientId(): string {
  const KEY = "cm_client_id";
  try {
    const have = localStorage.getItem(KEY);
    if (have && have.trim()) return have;
    const id = crypto?.randomUUID?.() || `cid_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `cid_${Math.random().toString(36).slice(2)}`;
  }
}

/* ---------- shared UI tokens ---------- */
const fieldCls =
  "w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950 backdrop-blur placeholder:text-slate-500 dark:placeholder:text-slate-400";

/* --------------------------------- App ---------------------------------- */
export default function App() {
  const [ready, setReady] = useState(false);

  // Ask console
  const [askResp, setAskResp] = useState<string>("");
  const [uploadResp, setUploadResp] = useState<string>("");

  const [health, setHealth] = useState<string>("checking...");
  const [authMsg, setAuthMsg] = useState<string>("initializing...");
  const [authReady, setAuthReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [tier, setTier] = useState<Tier>("human");
  const [ab, setAb] = useState<ABVariant>(() => (Math.random() < 0.5 ? "A" : "B"));
  const [skill, setSkill] = useState<Skill>("summarize");
  const [stream, setStream] = useState<boolean>(true);
  const [sysPrompt, setSysPrompt] = useState<string>("");
  const [attachLastUpload, setAttachLastUpload] = useState<boolean>(false);
  const [lastUploadKey, setLastUploadKey] = useState<string | null>(null);

  // Poll/download UI state
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

  // Ask abort (for streaming)
  const askAbortRef = useRef<AbortController | null>(null);

  // Speech-to-text (Web Speech API)
  const sttRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);

  // Resolved API base for child components (UsageFeed)
  const [resolvedBase, setResolvedBase] = useState<string>("");

  // Optional: balance for TopNav pill
  const [credits, setCredits] = useState<number | undefined>(undefined);

  /* ---------- helpers ---------- */
  const cleanHeaders = useCallback(() => {
    const h: Record<string, string> = { Accept: "application/json" };
    return h;
  }, []);

  const fetchJSON = useCallback(
    async (url: string) => {
      const r = await fetch(url, { headers: cleanHeaders(), credentials: "include", mode: "cors" });
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
    setInfo("Preparing download...");
    try {
      const r = await fetch(apiUrl(`/api/jobs/${encodeURIComponent(jobId)}/download`), {
        method: "GET",
        headers: cleanHeaders(),
        credentials: "include",
        mode: "cors",
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
      if (askAbortRef.current) askAbortRef.current.abort();
      try { sttRef.current?.stop(); } catch {}
    };
  }, []);

  // --- restore & poll if landing with ?job= in URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("job");
    if (id) {
      setJobId(id);
      setInfo("Restored job from URL. Polling...");
      setError(null);
      startPolling(id);
    }
  }, [startPolling]);

  useEffect(() => {
    if (jobId && isDone) {
      setInfo("Job finished. You can download the result.");
    }
  }, [jobId, isDone]);

  // ---------- health probe & boot ----------
  useEffect(() => {
    (async () => {
      try {
        await ensureApiBase();
        setResolvedBase((window as any).__apiBase ?? "");
      } catch {}

      try { await (window as any).__cogAuthReady; } catch {}

      const paths = ["/ready", "/ready", "/health", "/healthz", "/healthz", "/healthz", "/api/v1/healthz"];
      let reported = false;
      for (const p of paths) {
        try {
          const r = await fetch(apiUrl(p), {
            headers: { Accept: "application/json" },
            credentials: "include",
            mode: "cors",
          });
          const ct = (r.headers.get("content-type") || "").toLowerCase();
          if (!r.ok || !ct.includes("application/json")) continue;
          const data = await r.json();
          setHealth(JSON.stringify(data));
          reported = true;
          break;
        } catch {}
      }
      setHealth((h) => (reported ? h : "down"));
    })();

    // web-llm (best-effort)
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import("@mlc-ai/web-llm");
        engineRef.current = await (mod as any).CreateWebWorkerMLCEngine(
          new URL("/"),
          { model: "Llama-3.1-8B-Instruct-q4f16_1-MLC" } as any
        );
        setReady(true);
      } catch {}
    })();

    // Turnstile widget
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

          if (fb) { clearTimeout(fb); fb = null; }
          clearInterval(iv); iv = null;
          void refreshJwt();
        }
      }, 200);

      fb = setTimeout(() => {
        if (!widRef.current) {
          setAuthMsg("turnstile unavailable; proceeding without it");
          void refreshJwt();
        }
      }, 5000);
    } else {
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
        try { window.turnstile.reset(widRef.current); } catch {}
        window.turnstile.execute(widRef.current, {
          async: true,
          action: "guest",
          callback: (t: string) => resolve(t),
        });
      } catch {
        resolve("");
      }
    }).finally(() => { tsExecRef.current = null; });
    return tsExecRef.current;
  };

  // ---- Voice Dictation ----
  function getRecognizer(): SpeechRecognition | null {
    try {
      if (sttRef.current) return sttRef.current;
      const Ctor = window.webkitSpeechRecognition;
      if (!Ctor) return null;
      const rec: SpeechRecognition = new Ctor();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (ev: any) => {
        let txt = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) txt += r[0].transcript;
        }
        if (txt) setPrompt((p) => (p ? (p.trimEnd() + " " + txt).trim() : txt));
      };

      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);

      sttRef.current = rec;
      return rec;
    } catch { return null; }
  }
  function toggleDictation() {
    const rec = getRecognizer();
    if (!rec) return alert("Voice dictation is not available in this browser.");
    if (listening) { try { rec.stop(); } catch {} setListening(false); return; }
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "m" || e.key === "M")) { e.preventDefault(); toggleDictation(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listening]);

  // ---- Guest auth ----
  async function fetchGuestTokenMulti(): Promise<{ token: string; ttl: number } | null> {
    let ts = "";
    try { ts = await getTurnstileToken(); } catch { ts = ""; }

    const baseHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(ts ? { "CF-Turnstile-Token": ts } : {}),
    };

    const candidates: Array<{ url: string; method: "POST" }> = [
      { url: apiUrl("/auth/guest"), method: "POST" },
      { url: apiUrl("/api/v1/auth/guest"), method: "POST" },
    ];

    for (const c of candidates) {
      try {
        const init: RequestInit = {
          method: "POST",
          headers: { ...baseHeaders, "Content-Type": "application/json" },
          body: "{}",
          credentials: "include",
          mode: "cors",
        };
        const r = await fetch(c.url, init);
        const ct = r.headers.get("content-type") || "";
        const data: any = ct.includes("application/json") ? await r.json() : await r.text();
        if (!r.ok) continue;

        const parsed = extractToken(data);
        if (parsed?.token) return parsed;
      } catch {}
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
      setAuthMsg(`auth error: ${(e?.message || e)} - retrying in 30s`);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(refreshJwt, 30000);
    } finally {
      authBusyRef.current = false;
    }
  };

  // ---------- Credits for TopNav ----------
  const loadBalance = useCallback(async () => {
    try {
      const email = readUserEmail();
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(email ? { "X-User-Email": email } : {}),
        ...(jwtRef.current ? { Authorization: `Bearer ${jwtRef.current}` } : {}),
      };
      const r = await fetch(apiUrl("/api/billing/balance"), {
        headers,
        credentials: "include",
        mode: "cors",
      });
      if (!r.ok) throw new Error("balance fetch failed");
      const j = await r.json();
      const val =
        typeof j?.credits === "number"
          ? j.credits
          : (Number(j?.balance_credits) || Number(j?.balance) || 0);
      if (Number.isFinite(val)) setCredits(Number(val));
    } catch {
      setCredits(undefined);
    }
  }, []);
  useEffect(() => { if (authReady) void loadBalance(); }, [authReady, loadBalance]);

  // ---------- Ask (advanced) ----------
  const ask = async () => {
    if (askAbortRef.current) { askAbortRef.current.abort(); askAbortRef.current = null; }
    const ac = new AbortController();
    askAbortRef.current = ac;

    setAskResp("");
    if (prompt && prompt.trim()) pushPrompt(prompt.trim());

    const email = readUserEmail();
    const clientId = getOrCreateClientId();
    const ts = Date.now().toString();

    const attachments =
      attachLastUpload && lastUploadKey
        ? [{ storage: "r2", key: lastUploadKey }]
        : [];

    const skillsEnabled = (() => {
      switch (skill) {
        case "codegen": return ["codegen", "reasoning", "tests", "lint"];
        case "refactor": return ["refactor", "reasoning"];
        case "testgen": return ["tests", "coverage", "reasoning"];
        case "api-design": return ["api-design", "schema", "reasoning"];
        case "sql": return ["sql", "analytics", "reasoning"];
        case "data-viz": return ["data-viz", "explain", "reasoning"];
        case "translate": return ["translate", "reasoning"];
        case "vision-analyze": return ["vision", "reasoning"];
        case "plan": return ["plan", "agents", "reasoning"];
        case "explain": return ["explain", "reasoning"];
        default: return ["summarization", "reasoning"];
      }
    })();

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "X-Intelligence-Tier": tier,
        "X-AB-Variant": ab,
        "X-Client-Id": clientId,
        "X-Client-TS": ts,
        "X-Project-Name": "AskConsole",
        "X-Project-Pages": "Ask",
        "X-Skills": skillsEnabled.join(","),
        "X-Experiment": `Ask_${skill}_${tier}_${ab}`,
      };
      if (email) headers["X-User-Email"] = email;
      if (jwtRef.current) headers["Authorization"] = `Bearer ${jwtRef.current}`;
      if (stream) headers["Accept"] = "text/event-stream";

      const body = {
        skill,
        input: prompt,
        system: sysPrompt || undefined,
        attachments,
        telemetry: {
          tier, ab,
          client_id: clientId,
          client_ts: ts,
          source: "ask_console",
          page: "App.tsx",
          skills_enabled: skillsEnabled,
          api_base: (window as any).__apiBase ?? "",
          user_email: email || undefined,
          stream_hint: stream ? "sse" : "off",
        },
      };

      const r = await fetch(apiUrl("/api/si/ask"), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: ac.signal,
        credentials: "include",
        mode: "cors",
      });

      const used = r.headers.get("X-Credits-Used") || "";
      const bal = r.headers.get("X-Credits-Balance") || "";
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      const isJSON = ct.includes("application/json");
      const isSSE = ct.includes("text/event-stream");

      if (stream && r.ok && r.body && !isJSON) {
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          if (isSSE) {
            const parts = buffer.split("\n\n");
            for (let i = 0; i < parts.length - 1; i++) {
              const chunk = parts[i]
                .split("\n")
                .filter((l) => l.startsWith("data:"))
                .map((l) => l.replace(/^data:\s?/, ""))
                .join("\n");
              if (chunk) setAskResp((prev) => prev + chunk);
            }
            buffer = parts[parts.length - 1];
          } else {
            setAskResp((prev) => prev + buffer);
            buffer = "";
          }
        }
        if (used) setAskResp((prev) => prev + `\n\n[used: ${used} | balance: ${bal}]`);
        return;
      }

      const j = await r.json().catch(async () => ({ raw: await r.text() }));
      setAskResp(
        (j?.result?.content ?? j?.raw ?? JSON.stringify(j)) +
          (used ? `\n\n[used: ${used} | balance: ${bal}]` : "")
      );
    } catch (e: any) {
      const msg = e?.name === "AbortError" ? "Cancelled." : (e?.message ?? String(e));
      setAskResp("Error: " + msg);
    } finally {
      askAbortRef.current = null;
    }
  };

  // ---------- Direct upload via /api/upload/direct ----------
  const upload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return alert("Choose a file first.");
    if (!authReady || !jwtRef.current)
      return alert("Still obtaining auth... try again in a moment.");

    setUploading(true);
    setError(null);
    setInfo("Uploading to R2...");
    setUploadResp("");
    setJob(null);
    setJobId(null);

    try {
      const email = readUserEmail() || "";
      const url = apiUrl(`/api/upload/direct?filename=${encodeURIComponent(f.name)}`);

      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtRef.current}`,
          ...(email ? { "X-User-Email": email } : {}),
          "Content-Type": (f.type && f.type.trim()) || "application/octet-stream",
        },
        body: f,
        credentials: "include",
        mode: "cors",
      });

      const ct = r.headers.get("content-type") || "";
      const asJson = ct.includes("application/json");
      const data: any = asJson ? await r.json() : ({ error: await r.text() } as any);

      if (!r.ok || data?.error) {
        const msg = data?.error || `${r.status} ${r.statusText}` || "upload failed";
        throw new Error(msg);
      }

      setInfo(`Uploaded ✓  key=${data.key}  size=${data.size}  ${data.content_type ? `ct=${data.content_type}` : ""}`);
      setUploadResp(JSON.stringify(data, null, 2));
      setLastUploadKey(data.key || null);
    } catch (e: any) {
      const msg = (e?.message || e)?.toString?.() || "";
      if (msg.toLowerCase().includes("failed to fetch")) {
        setUploadResp("Upload error: network/CORS (preflight blocked or offline)");
      } else {
        setUploadResp(`Upload error: ${msg}`);
      }
      setError(msg);
      setLastUploadKey(null);
    } finally {
      setUploading(false);
    }
  };

  /* ---------- derived view state ---------- */
  const healthObj = useMemo(() => {
    try { return JSON.parse(health || "{}"); } catch { return null; }
  }, [health]);
  const apiOk = !!(healthObj && typeof healthObj === "object" && healthObj.ok);

  /* ---------- UI ---------- */
  return (
    <ThemeShell
      header={
        <TopNav
          apiOk={apiOk}
          provider={healthObj?.provider}
          model={healthObj?.model}
          credits={typeof credits === "number" ? credits : undefined}
          onRefreshCredits={loadBalance}
        />
      }
      maxWidth="7xl"
    >
      {/* Status pills (left of hero) */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="rounded-full border border-white/40 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
          API readiness: {health}
        </div>
        <div className="rounded-full border border-white/40 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
          Auth: {authMsg}
        </div>
        <div className="hidden rounded-full border border-white/40 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 sm:block">
          App is calling: {(resolvedBase && String(resolvedBase)) || "(base not resolved yet)"}
        </div>
        <div className="ml-auto">
          <CreditPill />
        </div>
      </div>

      {/* Ask console */}
      <section className="glass-card space-y-3 px-5 py-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Ask console
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Talk to Cognomega Super-Intelligence
            </h2>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          {/* left pane */}
          <div className="flex flex-col gap-3">
            <textarea
              className={`${fieldCls} min-h-[140px]`}
              data-voice-hint="Type your prompt. Press Ctrl or Cmd + Enter to submit."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything…  (Ctrl/Cmd + Enter to send)"
              onKeyDown={(e) => {
                // @ts-expect-error: nativeEvent may have isComposing
                if (e.isComposing || e.nativeEvent?.isComposing) return;
                const isEnter = e.key === "Enter" || e.key === "NumpadEnter";
                if (isEnter && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void ask();
                }
              }}
            />

            <details>
              <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-300">
                Advanced options
              </summary>
              <div className="mt-2 space-y-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">System Prompt (optional)</label>
                <textarea
                  className={`${fieldCls} min-h-[80px]`}
                  value={sysPrompt}
                  onChange={(e) => setSysPrompt(e.target.value)}
                  placeholder="You are Cognomega Super Intelligence. Be helpful, precise, and production-grade…"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/40 bg-white/80 text-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/20 dark:bg-slate-900/70 dark:text-indigo-300"
                    checked={attachLastUpload}
                    onChange={(e) => setAttachLastUpload(e.target.checked)}
                    disabled={!lastUploadKey}
                  />
                  <span className="text-sm">
                    Attach last uploaded file {lastUploadKey ? `(key: ${lastUploadKey})` : "(none)"}
                  </span>
                </label>
              </div>
            </details>

            <div className="flex flex-wrap gap-2">
              <button className="btn-base btn-primary" data-role="ask-button" onClick={ask}>
                Ask
              </button>
              <button
                className="btn-base btn-secondary"
                data-role="mic"
                onClick={toggleDictation}
                title={listening ? "Stop voice dictation" : "Start voice dictation"}
              >
                {listening ? "Stop Mic" : "Voice"}
              </button>
              <button
                className="btn-base btn-ghost"
                title="Abort current request"
                onClick={() => askAbortRef.current?.abort()}
              >
                Abort
              </button>
              <button
                className="btn-base btn-ghost"
                onClick={() => {
                  const blob = new Blob([askResp || ""], { type: "text/markdown;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `ask_${Date.now()}.md`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                Export .md
              </button>
              <button
                className="btn-base btn-ghost"
                onClick={() => navigator.clipboard.writeText(askResp || "").catch(() => {})}
                title="Copy answer"
              >
                Copy
              </button>
            </div>
          </div>

          {/* right pane */}
          <div className="flex flex-col gap-3">
            <label className="text-xs text-slate-500 dark:text-slate-400">Skill</label>
            <select
              className={fieldCls}
              value={skill}
              onChange={(e) => setSkill(e.target.value as Skill)}
            >
              {SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <label className="text-xs text-slate-500 dark:text-slate-400">Intelligence Tier</label>
            <select
              className={fieldCls}
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
            >
              <option value="human">Human</option>
              <option value="advanced">Advanced</option>
              <option value="super">Super</option>
            </select>

            <label className="text-xs text-slate-500 dark:text-slate-400">A/B Variant</label>
            <select
              className={fieldCls}
              value={ab}
              onChange={(e) => setAb(e.target.value as ABVariant)}
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </select>

            <label className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/40 bg-white/80 text-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/20 dark:bg-slate-900/70 dark:text-indigo-300"
                checked={stream}
                onChange={(e) => setStream(e.target.checked)}
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">Enable streaming (if supported)</span>
            </label>
          </div>
        </div>
      </section>

      {/* Real-time App Builder */}
      <section className="mt-4">
        <LaunchInBuilder
          defaultName="Sketch Prototype"
          defaultPages="Home,Dashboard,Chat"
          defaultDesc={prompt || "From Sketch to App"}
        />
      </section>

      {/* Ask output console */}
      <section className="mt-4">
        <pre className="glass-surface-soft rounded-2xl border border-white/40 bg-white/60 p-4 text-sm text-slate-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 whitespace-pre-wrap">
          {askResp}
        </pre>
      </section>

      {/* Recent usage */}
      <section className="mt-4">
        <UsageFeed
          email={readUserEmail() || ""}
          apiBase={resolvedBase}
          refreshMs={30000}
        />
      </section>

      {/* Upload */}
      <section className="mt-4 glass-surface-soft rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">Upload file (to R2 via API):</label>
          <input className="text-sm" type="file" ref={fileRef} required />
          <button
            type="button"
            className="btn-base btn-secondary"
            data-role="upload-button"
            onClick={upload}
            disabled={!authReady || uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {lastUploadKey && (
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Last upload key:&nbsp;
              <code className="rounded bg-white/60 px-1 py-0.5 dark:bg-slate-800/60">
                {lastUploadKey}
              </code>
            </span>
          )}
        </div>

        {info && <div className="mt-2 message-bubble" data-tone="info">{info}</div>}
        {error && <div className="mt-2 message-bubble" data-tone="error">{error}</div>}
        {uploadResp && (
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/90 p-3 text-cyan-200">
            {uploadResp}
          </pre>
        )}
      </section>

      {/* Invisible Turnstile container */}
      <div ref={tsDivRef} />

      {/* Voice guidance */}
      <VoiceGuide
        enabledByDefault={false}
        position="bottom-right"
        selectors={{
          textarea: "Type your prompt. Press control or command and enter to send.",
          "[data-role='ask-button']":
            "Click to ask Super-Intelligence. Telemetry and credits are recorded.",
          "[data-role='builder']":
            "Open the real-time App Builder in a new tab to prototype instantly.",
          "[data-role='upload-button']":
            "Upload a file to R2 and use the returned key in skills.",
          "[data-role='mic']":
            "Start voice dictation. Speak your prompt and we’ll transcribe it here.",
        }}
      />
    </ThemeShell>
  );
}
