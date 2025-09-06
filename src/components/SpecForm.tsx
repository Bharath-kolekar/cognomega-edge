import React, { useEffect, useRef, useState } from "react";
import { SpecSchema, generateFromSpec, formatAll } from "../lib/generator";
import { useAppStore } from "../lib/store";

function readParams() {
  try {
    const u = new URL(window.location.href);
    const sp = u.searchParams;
    return {
      name: sp.get("name") || null,
      pages: sp.get("pages") || null,
      desc: sp.get("desc") || null,
      autogen: sp.get("autogen") === "1",
    };
  } catch {
    return { name: null, pages: null, desc: null, autogen: false };
  }
}

export default function SpecForm() {
  const setFiles = useAppStore((s) => s.setFiles);

  // Start with defaults; we’ll override in useEffect so even strict mode double-mount is fine.
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

  // Prefill and optionally autogenerate on first client render
  useEffect(() => {
    const p = readParams();
    if (p.name) setName(p.name);
    if (p.pages) setPages(p.pages);
    if (p.desc) setDesc(p.desc);
    if (p.autogen && !didAutoRun.current) {
      didAutoRun.current = true;
      setTimeout(() => { void handleGenerate(); }, 0);
    }
  }, []); // run once after mount

  return (
    <form
      className="flex flex-col gap-2 p-3 bg-white border rounded-xl"
      onSubmit={(e) => { e.preventDefault(); void handleGenerate(); }}
    >
      <div className="font-semibold">Specification • v2</div>
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
