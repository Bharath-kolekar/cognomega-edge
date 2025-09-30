/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/DirectR2Upload.tsx
import React, { useRef, useState } from "react";
import { apiUrl } from "@/lib/api/apiBase";

/**
 * DirectR2Upload — drop-in React uploader for POST /api/upload/direct
 *
 * Server expects:
 *  - Method: POST
 *  - Raw body (File/Blob), not multipart
 *  - Content-Type header (browser sets fine; we set explicitly)
 *  - Content-Length (browser sends automatically for File bodies)
 *  - Caller identity via X-User-Email header (or JWT/cookie/query)
 *
 * Props:
 *  - apiBase?: Optional API origin override. If a non-empty string is provided, we use it.
 *              Otherwise we always build URLs via apiUrl() (preferred).
 *  - email   : caller email to attribute usage (required)
 *  - maxBytes: client-side size cap (default 10 MB — match server default)
 */

type UploadOk = {
  ok: true;
  key: string;
  size: number;
  etag: string | null;
  version: string | null;
  content_type: string;
};

type UploadErr = { error: string; [k: string]: any };

type Props = {
  apiBase?: string | unknown;
  email: string;
  maxBytes?: number;
};

export default function DirectR2Upload({
  apiBase,
  email,
  maxBytes = 10 * 1024 * 1024,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100
  const [msg, setMsg] = useState<string>("");
  const [result, setResult] = useState<UploadOk | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const resolvedBase =
    typeof apiBase === "string" && apiBase.trim()
      ? apiBase.trim().replace(/\/+$/, "")
      : null;

  function buildUrl(path: string): string {
    const clean = `/${String(path || "").replace(/^\/+/, "")}`;
    if (resolvedBase) return `${resolvedBase}${clean}`;
    return apiUrl(clean);
  }

  function displayApiBase(): string {
    // show the explicit override if provided; otherwise show the discovered base
    return resolvedBase || apiUrl("");
  }

  function fmtBytes(n: number) {
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  async function handleUpload() {
    setMsg("");
    setErr(null);
    setResult(null);
    setProgress(0);

    const input = fileRef.current;
    if (!input || !input.files || input.files.length === 0) {
      setErr("Choose a file first.");
      return;
    }
    if (!email) {
      setErr("Missing email (X-User-Email).");
      return;
    }
    const file = input.files[0];
    if (file.size > maxBytes) {
      setErr(`File too large (${fmtBytes(file.size)}). Max ${fmtBytes(maxBytes)}.`);
      return;
    }

    const url = buildUrl(`/api/upload/direct?filename=${encodeURIComponent(file.name)}`);

    setBusy(true);

    try {
      const res = await xhrUpload(url, file, {
        email,
        onProgress: (p) => setProgress(Math.max(0, Math.min(100, p))),
      });
      setResult(res);
      setMsg("Upload complete.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl w-full p-4 rounded-2xl shadow border border-gray-200 bg-white">
      <h2 className="text-xl font-semibold mb-2">Upload to R2</h2>
      <p className="text-sm text-gray-600 mb-4">
        Files go to your R2 bucket via <code>/api/upload/direct</code>. Make sure your
        backend allows this origin and you provide an email.
      </p>

      <div className="flex items-center gap-3 mb-3">
        <input
          ref={fileRef}
          type="file"
          className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-gray-200 file:bg-gray-50 file:hover:bg-gray-100 file:text-gray-700"
          disabled={busy}
          onChange={() => {
            setErr(null);
            setResult(null);
            setMsg("");
            setProgress(0);
          }}
        />
        <button
          onClick={handleUpload}
          disabled={busy}
          className={`px-4 py-2 rounded-xl text-white ${busy ? "bg-gray-400" : "bg-black hover:bg-gray-800"}`}
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>

      {busy && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-black" style={{ width: `${progress}%`, transition: "width .2s" }} />
        </div>
      )}

      <div className="text-xs text-gray-500 mb-3">
        Max size: {fmtBytes(maxBytes)} · API: {displayApiBase()}
      </div>

      {msg && <div className="text-sm text-green-700 mb-2">{msg}</div>}
      {err && (
        <div className="text-sm text-red-700 whitespace-pre-wrap mb-2">
          {err}
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm rounded-xl border border-gray-200 p-3 bg-gray-50">
          <div className="font-medium mb-1">Stored</div>
          <div>
            <span className="text-gray-500">Key:</span>{" "}
            <code className="break-all">{result.key}</code>
          </div>
          <div>
            <span className="text-gray-500">Size:</span> {fmtBytes(result.size)}
          </div>
          <div>
            <span className="text-gray-500">ETag:</span> {result.etag ?? "—"}
          </div>
          <div>
            <span className="text-gray-500">Type:</span> {result.content_type}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Retrieve via Wrangler:{" "}
            <code className="break-all">
              {`wrangler r2 object get --remote "cognomega-uploads/${result.key}"`}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

function xhrUpload(
  url: string,
  file: File,
  opts: { email: string; onProgress?: (pct: number) => void }
): Promise<UploadOk> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("X-User-Email", opts.email);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const pct = (ev.loaded / ev.total) * 100;
      opts.onProgress?.(pct);
    };

    xhr.onload = () => {
      try {
        const status = xhr.status;
        const text = xhr.responseText || "";
        const json = text ? (JSON.parse(text) as UploadOk | UploadErr) : ({} as any);
        if (status === 200 && (json as any).ok) return resolve(json as UploadOk);

        // Map server errors to friendly messages
        if ((json as any).error) {
          const e = json as UploadErr;
          if (e.error === "length_required")
            return reject(new Error("Length required (browser didn’t include Content-Length)."));
          if (e.error === "payload_too_large")
            return reject(new Error("Payload too large (exceeds server limit)."));
          if (e.error === "missing_email")
            return reject(new Error("Missing email (X-User-Email)."));
          if (e.error === "r2_not_bound")
            return reject(new Error("R2 binding missing on server."));
          return reject(new Error(`${e.error}`));
        }
        return reject(new Error(`HTTP ${status}`));
      } catch (err) {
        return reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("Upload timed out."));

    try {
      xhr.send(file);
    } catch (e) {
      reject(e);
    }
  });
}
