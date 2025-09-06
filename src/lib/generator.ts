
import { z } from "zod";
import { useAppStore } from "./store";
import prettier from "prettier/standalone";
import parserTs from "prettier/plugins/typescript";
import parserBabel from "prettier/plugins/babel";

export const SpecSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  pages: z.array(z.string().min(1)).min(1),
  realtime: z.boolean().default(true),
});

// Deterministic, no-LLM fallback generator (always works)
export function generateFromSpec(spec: z.infer<typeof SpecSchema>) {
  const files: Record<string,string> = {};
  const pkg = {
    name: spec.name.toLowerCase().replace(/\W+/g, "-"),
    private: true,
    version: "0.0.1",
    type: "module",
    scripts: { dev: "vite", build: "tsc -b && vite build", preview: "vite preview" },
    dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
    devDependencies: { vite: "^5.4.2", typescript: "^5.6.2", "@vitejs/plugin-react": "^4.3.1" }
  };
  files["package.json"] = JSON.stringify(pkg, null, 2);
  files["index.html"] = `<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>${spec.name}</title></head><body><div id='root'></div><script type='module' src='/src/main.tsx'></script></body></html>`;
  files["src/main.tsx"] = `import React from 'react';import {createRoot} from 'react-dom/client';import App from './App';createRoot(document.getElementById('root')!).render(<App/>);`;
  const routes = spec.pages.map(p => ({
    name: p,
    id: p.toLowerCase().replace(/\s+/g, "-")
  }));
  files["src/App.tsx"] = `import React from 'react';${routes.map(r=>`function ${r.id}(){return <div className='p-6 text-xl font-semibold'>${r.name} Page</div>}`).join("\n")}export default function App(){return <div>${routes.map(r=>`<${r.id}/>`).join("")}</div>}`;

  return files;
}

export async function formatAll(files: Record<string,string>) {
  const out: Record<string,string> = {};
  for (const [path, code] of Object.entries(files)) {
    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      out[path] = await prettier.format(code, { parser: path.endsWith(".tsx") ? "babel-ts" : "babel-ts", plugins: [parserTs, parserBabel] });
    } else if (path.endsWith(".json")) {
      out[path] = JSON.stringify(JSON.parse(code), null, 2);
    } else {
      out[path] = code;
    }
  }
  return out;
}
