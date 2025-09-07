// frontend/src/pages/SketchToApp.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiBase, authHeaders } from "../lib/api/apiBase";
import LaunchInBuilder from "../components/LaunchInBuilder";

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

// A tiny utility to keep form controls tidy
const inputCls =
  "w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
const cardCls =
  "rounded-2xl border border-slate-200 bg-white shadow-sm";

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

  const cleanHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {
      Accept: "application/json",
      ...(authHeaders() as any),
    };
    for (const k of Object.keys(h)) {
      if (k.toLowerCase() === "content-type") delete h[k];
    }
    return h;
  }, []);

  const fetchJSON = useCallback(
    async (url: string, signal?: AbortSignal) => {
      const r = await fetch(url, { headers: cleanHeaders(), signal });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      if (!ct.toLowerCase().includes("application/json")) {
        const t = await r.text();
        throw new Error(`Unexpected content-type: ${ct} | ${t.slice(0, 160)}`);
      }
      return r.json();
    },
    [cleanHeaders]
  );

  const stopPolling = useCallback(() => {
    if (pollAbort.current) {
      try {
        pollAbort.current.abort();
      } catch {}
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

      const loop = async () => {
        try {
          if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
            setInfo(null);
            setError("Timed out waiting for job to finish.");
            stopPolling();
            return;
          }
          const j = await fetchJSON(
            `${apiBase}/api/jobs/${encodeURIComponent(id)}`,
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

      try {
        const form = new FormData();
        form.append("file", f);
        form.append("prompt", prompt);

        const r = await fetch(`${apiBase}/v1/files/upload`, {
          method: "POST",
          headers: cleanHeaders(), // do NOT set content-type here
          body: form,
        });

        const ct = r.headers.get("content-type") || "";
        if (!ct.toLowerCase().includes("application/json")) {
          const text = await r.text();
          throw new Error(`Unexpected content-type: ${ct} | ${text.slice(0, 160)}`);
        }

        const j: UploadResp = await r.json();
        if (!r.ok || (j as any).error) {
          const msg = (j as any).error
            ? String((j as any).error)
            : `${r.status} ${r.statusText}`;
          throw new Error(msg);
        }

        const ok = j as Extract<UploadResp, { ok: true }>;
        setJobId(ok.job_id);
        setInfo("Uploaded. Processing…");
        startPolling(ok.job_id);
      } catch (e: any) {
        setError(e?.message || "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [prompt, cleanHeaders, startPolling]
  );

  const onChooseFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setInfo(null);
      setJob(null);
      setJobId(null);
      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      setFile(f);
      if (f) {
        void upload(f); // auto-start
      }
    },
    [upload]
  );

  const onDownload = useCallback(async () => {
    if (!jobId) return;
    setError(null);
    setInfo("Preparing download…");
    try {
      const r = await fetch(
        `${apiBase}/api/jobs/${encodeURIComponent(jobId)}/download`,
        { method: "GET", headers: cleanHeaders(), signal: pollAbort.current?.signal }
      );
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
  }, [jobId, cleanHeaders]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const isDone = job?.status === "done";
  const canManualUpload = useMemo(() => !!file && !busy, [file, busy]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-xl font-semibold tracking-tight">Cognomega</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className={`${cardCls} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">Sketch → App</h1>
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
                Upload starts automatically once you pick a file.
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
              >
                {busy ? "Uploading…" : "Upload"}
              </button>

              {jobId && (
                <span className="text-sm text-slate-600">
                  Job: <code className="text-xs">{jobId}</code>
                </span>
              )}
            </div>

            {(job || error || info) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
                {info && <div className="text-slate-700">{info}</div>}
                {error && <div className="text-rose-600">Error: {error}</div>}
                {isDone && (
                  <div className="pt-2">
                    <button
                      onClick={onDownload}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
                    >
                      Download result
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
