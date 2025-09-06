// frontend/src/pages/SketchToApp.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  createSketchToAppJob,
  getJobStatus,
  downloadJobArtifact,
} from "../lib/api/sketchToApp";

type JobInfo = {
  id: string;
  status: string;
  progress?: number;
  r2_url?: string | null;
  result_text?: string | null;
};

export default function SketchToAppPage() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimer = useRef<number | null>(null);

  // --- Helpers ---------------------------------------------------------------

  const clearPoll = () => {
    if (pollTimer.current) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const pollOnce = async (id: string) => {
    try {
      const j = await getJobStatus(id);
      const info = j?.job as JobInfo;
      setJob(info);
      // Continue polling until done / error
      if (info?.status && info.status.toLowerCase() === "done") {
        clearPoll();
        return;
      }
      if (info?.status && info.status.toLowerCase() === "error") {
        clearPoll();
        return;
      }
      // backoff a bit between polls
      pollTimer.current = window.setTimeout(() => pollOnce(id), 2000);
    } catch (e: any) {
      // On transient failure, keep polling but with a larger delay
      pollTimer.current = window.setTimeout(() => pollOnce(id), 4000);
    }
  };

  const startPolling = (id: string) => {
    clearPoll();
    pollTimer.current = window.setTimeout(() => pollOnce(id), 1000);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const onCreate = async () => {
    if (!file) return;
    setError(null);
    setCreating(true);
    setJob(null);
    setJobId(null);

    try {
      const res = await createSketchToAppJob(file, prompt.trim());
      if (!res.ok || !res.jobId) {
        throw new Error("No job id returned from upload");
      }
      setJobId(res.jobId);
      setJob({ id: res.jobId, status: res.status || "queued" });
      startPolling(res.jobId);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setCreating(false);
    }
  };

  const onDownload = () => {
    if (!jobId) return;
    downloadJobArtifact(jobId);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => clearPoll();
  }, []);

  const canCreate = !!file && !creating;

  // --- UI --------------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Sketch → App</h1>
        <p className="text-sm text-gray-600">
          Upload a sketch/spec to create a job, then watch status and download the result.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="file"
            onChange={onPickFile}
            className="block w-full text-sm"
            // Accept common image types, PDFs or zips; backend accepts any file
            accept=".png,.jpg,.jpeg,.webp,.pdf,.zip,.txt,.md,.json,*/*"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Optional prompt / notes</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="Describe the sketch or add instructions (optional)"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreate}
            disabled={!canCreate}
            className={`px-4 py-2 rounded text-white ${canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {creating ? "Uploading…" : "Create Job"}
          </button>

          {jobId && (
            <span className="text-sm text-gray-700">
              Job:&nbsp;<code className="px-1 py-0.5 bg-gray-100 rounded">{jobId}</code>
            </span>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Status</h2>
        {!jobId && <div className="text-sm text-gray-600">No job yet.</div>}

        {jobId && (
          <div className="text-sm">
            <div>
              <span className="font-medium">State:</span>{" "}
              <span>{job?.status ?? "queued"}</span>
              {typeof job?.progress === "number" && (
                <span> — {Math.round(job.progress)}%</span>
              )}
            </div>

            {job?.status?.toLowerCase() === "done" && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={onDownload}
                  className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                >
                  Download
                </button>
                {job?.r2_url && (
                  <span className="text-gray-600">
                    Artifact: <code className="bg-gray-100 px-1 py-0.5 rounded">{job.r2_url}</code>
                  </span>
                )}
              </div>
            )}

            {job?.status?.toLowerCase() === "error" && (
              <div className="text-red-600 mt-2">
                Failed to process job. {job?.result_text ? <span>Details: {String(job.result_text)}</span> : null}
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="text-xs text-gray-500">
        Tip: this page calls <code>/v1/files/upload</code>, then polls <code>/api/jobs/:id</code>, and downloads via <code>/api/jobs/:id/download</code>.
      </footer>
    </div>
  );
}
