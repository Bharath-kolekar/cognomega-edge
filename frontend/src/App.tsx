import React, { useEffect, useRef, useState } from "react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? "";

export default function App() {
  const [ready, setReady] = useState(false);
  const [resp, setResp] = useState<string>("");
  const [health, setHealth] = useState<string>("checking...");
  const [jwt, setJwt] = useState<string>("");
  const engineRef = useRef<any>(null);
  const [prompt, setPrompt] = useState("Summarize Cognomega in one line.");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Health check
    fetch(`${API_BASE}/ready`)
      .then((r) => r.json())
      .then((j) => setHealth(JSON.stringify(j)))
      .catch(() => setHealth("down"));

    // Initialize WebLLM lazily
    (async () => {
      try {
        engineRef.current = await CreateWebWorkerMLCEngine(new URL("/"), {
          model: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
        });
        setReady(true);
      } catch (e) {
        setResp("WebLLM not available on this browser.");
      }
    })();
  }, []);

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
    if (!f) {
      alert("Choose a file first.");
      return;
    }
    if (!jwt) {
      alert("Paste a JWT (Bearer token) to authenticate the upload.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`${API_BASE}/v1/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: fd,
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Upload failed: ${r.status} ${txt}`);
      }
      const j = await r.json();
      setResp(JSON.stringify(j));
    } catch (e: any) {
      setResp(`Upload error: ${e?.message || e}`);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Cognomega</h1>
      <p>API readiness: {health}</p>

      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Bearer JWT (paste here for protected calls):{" "}
          <input
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."
            style={{ width: "100%", padding: 8 }}
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
          />
        </label>
      </div>

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
        <button type="button" onClick={upload}>
          Upload
        </button>
      </div>
    </div>
  );
}
