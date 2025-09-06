
import React from "react";
import { useAppStore } from "../lib/store";
import { filesToZip } from "../lib/zip";

export default function TopBar() {
  const files = useAppStore(s => s.files);
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-10">
      <div className="font-semibold">Cognomega — Realtime App Builder</div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded bg-black text-white text-sm"
          onClick={async () => {
            const blob = await filesToZip(files, "generated-app");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "generated-app.zip";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download ZIP
        </button>
      </div>
    </div>
  );
}
