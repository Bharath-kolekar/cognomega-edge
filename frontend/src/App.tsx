/* global window */
import React, { useEffect, useRef, useState } from "react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

declare global {
  interface Window { turnstile?: any }
}

const API_BASE  = (import.meta as any).env.VITE_API_BASE ?? "";
const TS_SITE   = (import.meta as any).env.VITE_TURNSTILE_SITE_KEY ?? "";

export default function App() {
  const [ready, setReady]       = useState(false);
  const [resp, setResp]         = useState<string>("");
  const [health, setHealth]     = useState<string>("checking...");
  const [authMsg, setAuthMsg]   = useState<string>("initializing...");
  const [authReady, setAuthReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  const engineRef   = useRef<any>(null);
  const [prompt, setPrompt] = useState("Summarize Cognomega in one line.");

  const fileRef   = useRef<HTMLInputElement | null>(null);
  const tsDivRef  = useRef<HTMLDivElement | null>(null);
  const widRef    = useRef<any>(null);

  // In-memory JWT & timer
  const jwtRef         = useRef<string>("");
  const refreshTimer   = useRef<any>(null);

  useEffect(() => {
    // Health
    fetch(`${API_BASE}/ready`)
      .then(r => r.json())
      .then(j => setHealth(JSON.stringify(j)))
      .catch(() => setHealth("down"));

    // WebLLM (best-effort)
    (async () => {
      try {
        engineRef.current = await CreateWebWorkerMLCEngine(new URL("/"), {
          model: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
        });
        setReady(true);
      } catch {
        setResp("WebLLM not available on this browser.");
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
            size: "invisible",
          });
          clearInterval(iv);
          iv = null;
          refreshJwt(); // proceed once widget rendered
        }
      }, 200);

      // Fallback: if Turnstile still not available after 5s, proceed without it
      fb = setTimeout(() => {
        if (!widRef.current) {
          setAuthMsg("turnstile unavailable; proceeding without it");
          refreshJwt(); // server allows guest without Turnstile
        }
      }, 5000);
    } else {
      // No Turnstile configured → proceed immediately
      refreshJwt();
    }

    return () => {
      if (iv) clearInterval(iv);
      if (fb) clearTimeout(fb);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  const getTurnstileToken = async (): Promise<string> => {
    if (!TS_SITE || !window.turnstile || !widRef.current) return "";
    return await new Promise<string>((resolve) => {
      window.turnstile.execute(widRef.current, {
        async: true,
        action: "guest",
        callback: (t: string) => resolve(t),
      });
    });
  };

  const refreshJwt = async () => {
    try {
      setAuthMsg("auth: requesting token...");
      let ts = "";
      try { ts = await getTurnstileToken(); } catch { ts = ""; }
      const r = await fetch(`${API_BASE}/auth/guest`, {
        method: "POST",
        headers: ts ? { "CF-Turnstile-Token": ts } : {},
      });
      if (!r.ok) throw new Error(`auth failed: ${r.status}`);
      const j = await r.json();
      jwtRef.current = j.token;
      setAuthReady(true);
      const ttl = Math.max(60, (j.expires_in ?? 600)); // default 10m
      setAuthMsg(`token ready (exp ${ttl}s)`);

      // Auto-refresh ~60s before expiry
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const next = Math.max(10, ttl - 60);
      refreshTimer.current = setTimeout(refreshJwt, next * 1000);
    } catch (e: any) {
      const msg = e?.message || e;
      setAuthMsg(`auth error: ${msg} – retrying in 30s`);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(refreshJwt, 30000);
    }
  };

  const ask = async () => {
    if (!engineRef.current) return;
    const reply = await engineRef.current.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      stream: false,
    });
    setResp(reply.choices[0]?.message?.content ?? "");
  };

  const upload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return alert("Choose a file first.");
    if (!authReady || !jwtRef.current) return alert("Still obtaining auth… try again in a moment.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      let ts = "";
      try { ts = await getTurnstileToken(); } catch { ts = ""; }

      const r = await fetch(`${API_BASE}/v1/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtRef.current}`,
          ...(ts ? { "CF-Turnstile-Token": ts } : {}),
        },
        body: fd,
      });

      if (!r.ok) {
        const txt = await r.text();
        if (r.status === 401) { setResp("Upload error: 401 Unauthorized (JWT expired)"); return; }
        if (r.status === 403 && txt.includes("turnstile_failed")) { setResp("Upload error: 403 Turnstile failed/expired"); return; }
        setResp(`Upload error: ${r.status} ${txt}`);
        return;
      }
      const j = await r.json();
      setResp(JSON.stringify(j));
    } catch (e: any) {
      const msg = (e?.message || e)?.toString?.() || "";
      if (msg.toLowerCase().includes("failed to fetch")) {
        setResp("Upload error: network/CORS (preflight blocked or offline)");
      } else {
        setResp(`Upload error: ${msg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Cognomega</h1>
      <p>API readiness: {health}</p>
      <p>Auth: {authMsg}</p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={ask} disabled={!ready}>
          Ask
        </button>
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

      <hr />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Upload file (to R2 via API): </label>
        <input type="file" ref={fileRef} required />
        <button type="button" onClick={upload} disabled={!authReady || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Invisible Turnstile container */}
      <div ref={tsDivRef} />
    </div>
  );
}
