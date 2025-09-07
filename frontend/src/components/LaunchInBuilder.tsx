import React, { useMemo, useState } from "react";

type Props = {
  defaultName?: string;
  defaultPages?: string;
  defaultDesc?: string;
  baseUrl?: string; // allow overriding (falls back to builder.cognomega.com)
};

const fieldCls =
  "w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

export default function LaunchInBuilder({
  defaultName = "",
  defaultPages = "Home,Dashboard,Chat",
  defaultDesc = "",
  baseUrl,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [pages, setPages] = useState(defaultPages);
  const [desc, setDesc] = useState(defaultDesc);

  // Use the same origin as the page if we're already under /builder/,
  // otherwise fall back to the canonical domain.
  const builderBase = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      const h = window.location.hostname;
      if (h.includes("cognomega.com") && h.startsWith("builder.")) {
        return `${window.location.origin}`;
      }
    } catch {}
    return "https://builder.cognomega.com";
  }, [baseUrl]);

  const launch = () => {
    const url =
      `${builderBase}/?` +
      `name=${encodeURIComponent(name || "MyApp")}` +
      `&pages=${encodeURIComponent(pages || "Home,Dashboard,Chat")}` +
      `&desc=${encodeURIComponent(desc || "")}` +
      `&autogen=1`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Realtime Builder</h2>
        <span className="text-xs text-slate-500">Opens in a new tab</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          className={fieldCls}
          placeholder="Sketch/App name (e.g. Sales Dashboard)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={fieldCls}
          placeholder="Pages (comma-separated)"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
        />
        <button
          onClick={launch}
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          Launch in Builder
        </button>
      </div>

      <textarea
        className={fieldCls}
        placeholder="Description (optional)"
        rows={2}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
    </div>
  );
}
