
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Spec = {
  name: string;
  description: string;
  pages: string[];
  realtime: boolean;
  collabRoom?: string;
};

export type FileMap = Record<string, string>;

type State = {
  spec: Spec;
  files: FileMap;
  setSpec: (s: Partial<Spec>) => void;
  setFiles: (f: FileMap) => void;
  updateFile: (path: string, content: string) => void;
};

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      spec: { name: "MyApp", description: "", pages: ["Home"], realtime: true },
      files: {},
      setSpec: (s) => set({ spec: { ...get().spec, ...s } }),
      setFiles: (f) => set({ files: f }),
      updateFile: (p, c) => set({ files: { ...get().files, [p]: c } }),
    }),
    { name: "realtime-app-builder" }
  )
);
