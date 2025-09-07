// frontend/src/pages/SketchToApp.tsx
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
} from "react";
import { apiBase, authHeaders } from "../lib/api/apiBase";
// Lazy-load the panel so the main page paints faster
const LaunchInBuilder = lazy(() => import("../components/LaunchInBuilder"));

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

export default function SketchToApp() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");

  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // polling control
  const pollAbort = useRef<AbortController | null>(null);
  const pollTimer = useRef<number | null>(null);
  const pollStart = useRef<number>(0);

  // ---------- helpers ----------

  const cleanHeaders = useCallback((): Record<string, string> => {
    // Use auth headers, but DO NOT set Content-Type for multipart/form-data
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
      } catch {
        /* no-op */
      }
    }
    pollAbort.current = null;
    if (pollTimer.current) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      // reset previous loop (if any)
      stopPolling();
      pollAbort.current = new AbortController();
      pollStart.current = Date.now();

      const loop = async () => {
        try {
          // stop if timed out
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

          // schedule next tick
          pollTimer.current = window.setTimeout(loop, POLL_INTERVAL_MS);
        } catch (e: any) {
          // if aborted, just stop
          if (pollAbort.current?.signal.aborted) return;

          // transient failure: retry within the timeout window
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

      // kick off
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
          headers: cleanHeaders(), // never set content-type here
          body: form,
        });

        const ct = r.headers.get("content-type") || "";
        if (!ct.toLowerCase().includes("application/json")) {
          const text = await r.text();
          throw new Error(
            `Unexpected content-type: ${ct} | ${text.slice(0, 160)}`
          );
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
        // AUTO-START upload to match current UI (“no Create Job” button)
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
      // if user navigated away mid-download, don't overwrite UI with an error
      if (!pollAbort.current?.signal.aborted) {
        setError(e?.message || "Download failed");
      }
    }
  }, [jobId, cleanHeaders]);

  // cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const isDone = job?.status === "done";
  const canManualUpload = useMemo(() => !!file && !busy, [file, busy]); // optional manual button

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sketch → App</h1>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Sketch file</label>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf,.gif"
          onChange={onChooseFile}
          className="block w-full"
        />
        <p className="text-xs text-gray-500">
          Upload starts automatically once you pick a file.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Prompt (optional)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full border rounded p-2"
          placeholder="Add any notes about the UI or behavior…"
        />
      </div>

      {/* Optional manual button for power users; harmless if ignored */}
      <div className="flex items-center gap-3">
        <button
          disabled={!canManualUpload}
          onClick={() => file && upload(file)}
          className={`px-4 py-2 rounded text-white ${
            canManualUpload ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {busy ? "Uploading…" : "Upload"}
        </button>

        {jobId && (
          <span className="text-sm text-gray-600">
            Job: <code className="text-xs">{jobId}</code>
          </span>
        )}
      </div>

      {(job || error || info) && (
        <div className="rounded border p-3 bg-gray-50 space-y-1">
          {job && (
            <>
              <div className="text-sm">
                <span className="font-medium">Status:</span> {job.status}
                {typeof job.progress !== "undefined" && job.progress !== null && (
                  <> — {String(job.progress)}%</>
                )}
              </div>
              {isDone && (
                <div className="pt-2">
                  <button
                    onClick={onDownload}
                    className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    Download result
                  </button>
                </div>
              )}
            </>
          )}
          {info && <div className="text-sm text-gray-700">{info}</div>}
          {error && <div className="text-sm text-red-600">Error: {error}</div>}
        </div>
      )}

      {/* Realtime App Builder launcher (native, lazy) */}
      <div className="border-t pt-4">
        <Suspense fallback={<div className="text-sm text-gray-500">Loading builder launcher…</div>}>
          <LaunchInBuilder />
        </Suspense>
      </div>
    </div>
  );
}
