
import React from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { useAppStore } from "../lib/store";

export default function LivePreview() {
  const files = useAppStore(s => s.files);
  const spFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) spFiles[`/${k}`] = v;

  return (
    <div className="border rounded-xl overflow-hidden">
      <Sandpack
        template="react-ts"
        files={spFiles}
        options={{
          externalResources: [],
          showNavigator: true,
          showTabs: true,
          recompileMode: "delayed",
          recompileDelay: 400
        }}
      />
    </div>
  );
}
