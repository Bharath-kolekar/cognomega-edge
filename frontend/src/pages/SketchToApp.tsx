// frontend/src/pages/SketchToApp.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, authHeaders, readUserEmail } from "../lib/api/apiBase";
import LaunchInBuilder from "../components/LaunchInBuilder";
import "../index.css";

type Job = {
  id: string;
  status: "queued" | "working" | "done" | "error" | string;
  progress?: string | number | null;
};

type UploadResp =
  | { ok: true; key?: string; size?: number; job_id?: string; jobId?: string; status?: string }
  | { error: string; [k: string]: any };

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 120_000;

/* ------------------------- Token/bootstrap helpers ------------------------ */

const KEY_GUEST = "guest_token";  // what apiBase.ts reads
const KEY_JWT   = "jwt";          // legacy mirror
const KEY_COG   = "cog_auth_jwt"; // { token, exp? }

const nowSec = () => Math.floor(Date.now() / 1000);

function readAnyToken(): string | null {
  try {
    const guest = localStorage.getItem(KEY_GUEST);
    if (guest && guest.trim()) return guest;
    const legacy = localStorage.getItem(KEY_JWT);
    if (legacy && legacy.trim()) return legacy;
    const raw = localStorage.getItem(KEY_COG);
    if (raw) {
      try {
        const j = JSON.parse(raw);
        if (j && typeof j.token === "string" && j.token.trim()) return j.token;
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return null;
}

function writeAllTokens(token: string, exp?: number) {
  try {
    localStorage.setItem(KEY_GUEST, token);
    localStorage.setItem(KEY_JWT, token);
    localStorage.setItem(KEY_COG, JSON.stringify({ token, exp }));
    // nudge same-tab listeners
    try {
      const ev = new StorageEvent("storage", { key: KEY_COG, newValue: JSON.stringify({ token, exp }) });
      window.dispatchEvent(ev);
    } catch {
      window.dispatchEvent(new Event("storage"));
    }
  } catch { /* ignore */ }
}

/** Try to mint a guest token (prefers POST /auth/guest; falls back gracefully). */
async function mintGuestToken(): Promise<string | null> {
  const tries: Array<() => Promise<{ token?: string; exp?: number } | null>> = [
    async () => {
      try {
        const r = await fetch(apiUrl("/auth/guest"), { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: "{}" });
        if (!r.ok) return null;
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        const j: any = ct.includes("application/json") ? await r.json() : await r.text();
        const token = (typeof j === "string" ? j : j?.token || j?.jwt || j?.guest_token || j?.access_token) || null;
        const exp = typeof j === "object"
          ? Number(j?.exp ?? j?.expires_at ?? (j?.expires_in ? nowSec() + Number(j.expires_in) : undefined))
          : undefined;
        return token ? { token, exp } : null;
      } catch { return null; }
    },
    async () => {
      try {
        const r = await fetch(apiUrl("/api/gen-jwt"), { headers: { Accept: "application/json" } });
        if (!r.ok) return null;
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        const j: any = ct.includes("application/json") ? await r.json() : await r.text();
        const token = (typeof j === "string" ? j : j?.token || j?.jwt) || null;
        const exp = typeof j === "object" ? Number(j?.exp) : undefined;
        return token ? { token, exp } : null;
      } catch { return null; }
    },
    async () => {
      try {
        const r = await fetch(apiUrl("/gen-jwt"), { headers: { Accept: "application/json" } });
        if (!r.ok) return null;
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        const j: any = ct.includes("application/json") ? await r.json() : await r.text();
        const token = (typeof j === "string" ? j : j?.token || j?.jwt) || null;
        const exp = typeof j === "object" ? Number(j?.exp) : undefined;
        return token ? { token, exp } : null;
      } catch { return null; }
    },
  ];
  for (const fn of tries) {
    const got = await fn();
    if (got?.token) {
      writeAllTokens(got.token, got.exp || nowSec() + 3600);
      return got.token;
    }
  }
  return null;
}

/** Ensure we have *some* token (don’t over-validate expiry for guest). */
async function ensureAuthToken(force = false): Promise<string | null> {
  if (!force) {
    const t = readAnyToken();
    if (t) return t;
  }
  return await mintGuestToken();
}

/** Build headers; never set content-type for multipart. */
function makeHeaders(extra?: Record<string, string>): Record<string, string> {
  const base = (authHeaders() as Record<string, string>) || {};
  const h: Record<string, string> = { Accept: "application/json", ...base, ...(extra || {}) };
  if (!("Authorization" in h)) {
    const tok = readAnyToken();
    if (tok) h["Authorization"] = `Bearer ${tok}`;
  }
  // include email if available
  const em = readUserEmail();
  if (em && !h["X-User-Email"]) h["X-User-Email"] = em;
  for (const k of Object.keys(h)) if (k.toLowerCase() === "content-type") delete h[k];
  return h;
}

/* ----------------------- Local prompt correlation ------------------------ */

const LS_KEY = "cm_usage_prompts";
const MAX_PROMPTS = 200;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readPrompts(): { ts: number; text: string }[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as { ts: number; text: string }[]) : [];
    const cutoff = Date.now() - MAX_AGE_MS;
    return arr.filter(p => typeof p?.ts === "number" && typeof p?.text === "string" && p.ts >= cutoff).slice(-MAX_PROMPTS);
  } catch { return []; }
}
function writePrompts(arr: { ts: number; text: string }[]) {
  try {
    const pruned = arr.filter(p => p && typeof p.ts === "number" && typeof p.text === "string").slice(-MAX_PROMPTS);
    const s = JSON.stringify(pruned);
    localStorage.setItem(LS_KEY, s);
    try { window.dispatchEvent(new StorageEvent("storage", { key: LS_KEY, newValue: s })); }
    catch { window.dispatchEvent(new Event("storage")); }
  } catch { /* ignore */ }
}
function pushPrompt(text: string) {
  if (!text || !text.trim()) return;
  const list = readPrompts();
  list.push({ ts: Date.now(), text: text.trim() });
  writePrompts(list);
}

/* ----------------------------- helpers ---------------------------------- */

function pickJobId(data: any, headers: Headers): string | null {
  const headerId = headers.get("X-Job-Id") || headers.get("x-job-id");
  if (headerId && headerId.trim()) return headerId.trim();
  const id = data?.jobId ?? data?.job_id ?? data?.id ?? data?.job?.id ?? null;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/* --------------------------------- UI ----------------------------------- */

const inputCls =
  "w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
const cardCls = "rounded-2xl border border-slate-200 bg-white shadow-sm";

/* -------------------------------- Page ---------------------------------- */

export default function SketchToApp() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");

  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pollAbort = useRef<AbortController | null>(null);
  const pollTimer = useRef<number | null>(null);
  const pollStart = useRef<number>(0);

  // Kick off auth on mount so the first upload doesn't 401.
  useEffect(() => { void ensureAuthToken(); }, []);

  // If we land with ?job=..., restore and poll
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("job");
    if (id) {
      setJobId(id);
      setInfo("Restored job from URL. Polling…");
      setError(null);
      startPolling(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJSON = useCallback(
    async (url: string, signal?: AbortSignal) => {
      await ensureAuthToken();
      const r = await fetch(url, { headers: makeHeaders(), signal });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      if (!ct.toLowerCase().includes("application/json")) {
        const t = await r.text();
        throw new Error(`Unexpected content-type: ${ct} | ${t.slice(0, 160)}`);
      }
      return r.json();
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (pollAbort.current) {
      try { pollAbort.current.abort(); } catch { /* no-op */ }
    }
    pollAbort.current = null;
    if (pollTimer.current) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollAbort.current = new AbortController();
      pollStart.current = Date.now();

      // Keep job id in URL so refresh preserves state
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("job", id);
        window.history.replaceState({}, "", url.toString());
      } catch { /* ignore */ }

      const loop = async () => {
        try {
          if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
            setInfo(null);
            setError("Timed out waiting for job to finish.");
            stopPolling();
            return;
          }
          const j = await fetchJSON(
            apiUrl(`/api/jobs/${encodeURIComponent(id)}`),
            pollAbort.current?.signal
          );
          const jobObj = (j?.job ?? {}) as any;
          const next: Job = {
            id: jobObj.id,
            status: String(jobObj.status || ""),
            progress: jobObj.progress,
          };
          setJob(next);

          if (next.status === "done") {
            setInfo("Job finished. You can download the result.");
            stopPolling();
            return;
          }
          if (next.status === "error" || next.status === "failed") {
            setError("Job failed.");
            stopPolling();
            return;
          }

          pollTimer.current = window.setTimeout(loop, POLL_INTERVAL_MS);
        } catch (e: any) {
          if (pollAbort.current?.signal.aborted) return;
          if (Date.now() - pollStart.current <= POLL_TIMEOUT_MS) {
            setInfo("Reconnecting…");
            pollTimer.current = window.setTimeout(loop, POLL_INTERVAL_MS);
          } else {
            setInfo(null);
            setError(e?.message || "Poll failed");
            stopPolling();
          }
        }
      };

      void loop();
    },
    [fetchJSON, stopPolling]
  );

  const upload = useCallback(
    async (f: File) => {
      setBusy(true);
      setError(null);
      setInfo("Uploading…");
      setJob(null);
      setJobId(null);

      // Save prompt for UsageFeed correlation
      if (prompt && prompt.trim()) pushPrompt(prompt);

      const doPost = async (url: string) => {
        await ensureAuthToken();
        const form = new FormData();
        form.append("file", f);
        if (prompt && prompt.trim()) {
          form.append("prompt", prompt);
        }

        const headers = makeHeaders(
          prompt?.trim() ? { "X-Upload-Notes": prompt.trim() } : undefined
        );

        const r = await fetch(apiUrl(url), {
          method: "POST",
          headers, // DO NOT set content-type here
          body: form,
          credentials: "omit",
          mode: "cors",
        });
        return r;
      };

      // Try a few compatible endpoints; first-success wins
      const candidates = [
        "/v1/files/upload",
        "/api/files/upload",
        "/files/upload",
        "/api/upload/sketch", // compatibility alias
      ];

      try {
        let resp: Response | null = null;
        for (const path of candidates) {
          try {
            const r = await doPost(path);
            // Prefer a JSON response
            const ct = (r.headers.get("content-type") || "").toLowerCase();
            if (!ct.includes("application/json")) {
              // If not JSON and OK, still try to parse error text to surface detail
              if (!r.ok) {
                const t = await r.text();
                throw new Error(`${r.status} ${r.statusText} | ${t.slice(0, 160)}`);
              }
              // Not JSON but OK — keep probing next (some endpoints may redirect)
              continue;
            }
            resp = r;
            // status check after we confirm JSON
            break;
          } catch {
            // keep trying others
          }
        }

        if (!resp) throw new Error("No compatible upload endpoint found");

        // If unauthorized, refresh token and retry once against the same path we picked
        if (resp.status === 401 || resp.status === 403) {
          const retried = await doPost(new URL(resp.url).pathname);
          resp = retried;
        }

        const j: UploadResp = await resp.json();
        if (!resp.ok || (j as any).error) {
          const msg = (j as any).error
            ? String((j as any).error)
            : `${resp.status} ${resp.statusText}`;
          throw new Error(msg);
        }

        // Normalize job id across variants
        const picked = pickJobId(j, resp.headers);
        const job_id = picked ?? (j as any).job_id ?? (j as any).jobId ?? null;

        if (job_id) {
          setJobId(job_id);
          setInfo("Uploaded. Processing…");
          startPolling(job_id);
        } else {
          // Successful upload without a job — surface result, but no polling
          setInfo("Uploaded ? (no processing job returned by server)");
        }
      } catch (e: any) {
        const msg = e?.message || "Upload failed";
        setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [prompt, startPolling]
  );

  const onChooseFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setInfo(null);
      setJob(null);
      setJobId(null);
      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      setFile(f);
      if (f) void upload(f); // auto-start
    },
    [upload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setError(null);
      setInfo(null);
      const f = e.dataTransfer.files?.[0];
      if (f) {
        setFile(f);
        void upload(f);
      }
    },
    [upload]
  );

  const onDownload = useCallback(async () => {
    if (!jobId) return;
    setError(null);
    setInfo("Preparing download…");
    try {
      await ensureAuthToken();
      let r = await fetch(
        apiUrl(`/api/jobs/${encodeURIComponent(jobId)}/download`),
        { method: "GET", headers: makeHeaders(), signal: pollAbort.current?.signal }
      );

      if (r.status === 401 || r.status === 403) {
        await ensureAuthToken(true);
        r = await fetch(
          apiUrl(`/api/jobs/${encodeURIComponent(jobId)}/download`),
          { method: "GET", headers: makeHeaders(), signal: pollAbort.current?.signal }
        );
      }

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
      if (!pollAbort.current?.signal.aborted) {
        setError(e?.message || "Download failed");
      }
    }
  }, [jobId]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const isDone = job?.status === "done";
  const progressNum =
    typeof job?.progress === "number"
      ? Math.min(100, Math.max(0, Number(job?.progress)))
      : undefined;

  const canManualUpload = useMemo(() => !!file && !busy, [file, busy]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Submit upload on Ctrl/Cmd + Enter if a file is selected
    // @ts-expect-error: nativeEvent may have isComposing
    if (e.isComposing || e.nativeEvent?.isComposing) return;
    const isEnter = e.key === "Enter" || e.key === "NumpadEnter";
    if (isEnter && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (file && !busy) void upload(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" onKeyDown={onKeyDown}>
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-xl font-semibold tracking-tight">Cognomega</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div
          className={`${cardCls} p-6`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
        >
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">Sketch ? App</h1>
            {job?.status && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  isDone
                    ? "bg-green-100 text-green-700"
                    : job?.status === "error" || job?.status === "failed"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {job.status}
                {typeof job.progress !== "undefined" &&
                  job.progress !== null &&
                  ` • ${String(job.progress)}%`}
              </span>
            )}
          </div>

          {/* Dropzone + picker */}
          <div className="mt-6 grid gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Sketch file</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf,.gif"
                onChange={onChooseFile}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500">
                Drop a file on this card, or use the picker. Upload starts automatically.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Prompt <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Add any notes about the UI or behavior…"
                className={inputCls}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={!canManualUpload}
                onClick={() => file && upload(file)}
                className={`rounded-xl px-4 py-2 text-white transition ${
                  canManualUpload
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
                title="Upload selected file (Ctrl/Cmd + Enter)"
              >
                {busy ? "Uploading…" : "Upload"}
              </button>

              {jobId && (
                <span className="text-sm text-slate-600">
                  Job:{" "}
                  <code
                    className="text-xs select-all"
                    title="Click and press Ctrl/Cmd+C to copy"
                  >
                    {jobId}
                  </code>
                </span>
              )}

              {job && !isDone && (
                <button
                  type="button"
                  onClick={stopPolling}
                  className="rounded-xl px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200"
                  title="Stop polling"
                >
                  Stop
                </button>
              )}
            </div>

            {/* Progress bar */}
            {typeof progressNum === "number" && !isDone && (
              <div className="w-full h-2 rounded bg-slate-200 overflow-hidden">
                <div
                  className="h-2 bg-indigo-600 transition-all"
                  style={{ width: `${progressNum}%` }}
                />
              </div>
            )}

            {(job || error || info) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
                {info && <div className="text-slate-700">{info}</div>}
                {error && <div className="text-rose-600">Error: {error}</div>}
                {isDone && (
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={onDownload}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
                    >
                      Download result
                    </button>
                    <button
                      onClick={() => {
                        setJob(null);
                        setJobId(null);
                        setInfo(null);
                        setError(null);
                        try {
                          const url = new URL(window.location.href);
                          url.searchParams.delete("job");
                          window.history.replaceState({}, "", url.toString());
                        } catch { /* ignore */ }
                      }}
                      className="rounded-xl bg-slate-200 px-3 py-2 text-slate-800 hover:bg-slate-300"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Realtime App Builder launcher */}
        <div className={`${cardCls} p-6`}>
          <LaunchInBuilder
            defaultName="Sketch Prototype"
            defaultPages="Home,Dashboard,Chat"
            defaultDesc={prompt || "From Sketch to App"}
          />
        </div>
      </main>
    </div>
  );
}
