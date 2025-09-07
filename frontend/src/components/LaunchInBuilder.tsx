import React, { useState } from "react";

const BASE = "https://builder.cognomega.com";

export default function LaunchInBuilder() {
  const [name, setName]   = useState("");
  const [pages, setPages] = useState("Home,Dashboard,Chat");
  const [desc, setDesc]   = useState("From Sketch to App");

  const launch = () => {
    const url =
      `${BASE}/?` +
      `name=${encodeURIComponent(name || "MyApp")}` +
      `&pages=${encodeURIComponent(pages)}` +
      `&desc=${encodeURIComponent(desc)}` +
      `&autogen=1`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="mt-4 rounded-xl border p-3 flex flex-col gap-2">
      <div className="font-semibold">Realtime Builder</div>
      <input
        className="border rounded px-2 py-1"
        placeholder="Sketch/App name (e.g. Sales Dashboard)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Pages (comma-separated)"
        value={pages}
        onChange={(e) => setPages(e.target.value)}
      />
      <textarea
        className="border rounded px-2 py-1"
        placeholder="Description (optional)"
        rows={2}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button onClick={launch} className="px-3 py-2 rounded bg-black text-white">
        Launch in Builder
      </button>
    </div>
  );
}
