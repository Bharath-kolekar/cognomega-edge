import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { SpecSchema, generateFromSpec, formatAll } from "../lib/generator";
import { useAppStore } from "../lib/store";

export default function SpecForm() {
  const setFiles = useAppStore((s) => s.setFiles);
  const [name, setName] = useState("MyApp");
  const [pages, setPages] = useState("Home, About, Dashboard");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const didAutoRun = useRef(false);

  const handleGenerate = async () => {
    setBusy(true);
    const spec = SpecSchema.parse({
      name,
      description: desc,
      pages: pages.split(",").map((s) => s.trim()).filter(Boolean),
      realtime: true,
    });
    const files = generateFromSpec(spec);
    const formatted = await formatAll(files);
    setFiles(formatted);
    setBusy(false);
  };

  // Prefill from URL and optionally autogenerate (?name=&pages=&desc=&autogen=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qpName = params.get("name");
    const qpPages = params.get("pages");
    const qpDesc = params.get("desc");
    const auto = params.get("autogen") === "1";

    if (qpName) setName(qpName);
    if (qpPages) setPages(qpPages);
    if (qpDesc) setDesc(qpDesc);

    if (auto && !didAutoRun.current) {
      didAutoRun.current = true;
      setTimeout(() => { void handleGenerate(); }, 0);
    }
  }, []);

  return (
    <form
      className="flex flex-col gap-2 p-3 bg-white border rounded-xl"
      onSubmit={(e) => { e.preventDefault(); void handleGenerate(); }}
    >
      <div className="font-semibold">Specification</div>
      <label className="text-sm">App name</label>
      <input className="border rounded px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="text-sm">Pages (comma-separated)</label>
      <input className="border rounded px-2 py-1" value={pages} onChange={(e) => setPages(e.target.value)} />
      <label className="text-sm">Description (optional)</label>
      <textarea className="border rounded px-2 py-1" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button className="px-3 py-1 rounded bg-black text-white mt-2 disabled:opacity-60" disabled={busy}>
        {busy ? "Generating…" : "Generate App"}
      </button>
    </form>
  );
}
