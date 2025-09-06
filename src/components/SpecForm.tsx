import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { SpecSchema, generateFromSpec, formatAll } from "../lib/generator";
import { useAppStore } from "../lib/store";

export default function SpecForm() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialName  = params.get("name")  ?? "MyApp";
  const initialPages = params.get("pages") ?? "Home, About, Dashboard";
  const initialDesc  = params.get("desc")  ?? "";

  const setFiles = useAppStore((s) => s.setFiles);
  const [name, setName] = useState(initialName);
  const [pages, setPages] = useState(initialPages);
  const [desc, setDesc] = useState(initialDesc);
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

  // Autogenerate if ?autogen=1
  useEffect(() => {
    if (params.get("autogen") === "1" && !didAutoRun.current) {
      didAutoRun.current = true;
      setTimeout(() => { void handleGenerate(); }, 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
