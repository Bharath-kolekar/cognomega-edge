
import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { useAppStore } from "../lib/store";

export default function Editor() {
  const files = useAppStore(s => s.files);
  const updateFile = useAppStore(s => s.updateFile);
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const active = Object.keys(files)[0];

  useEffect(() => {
    if (!ref.current) return;
    editorRef.current = monaco.editor.create(ref.current, {
      value: active ? files[active] : "// Generate to start",
      language: active?.endsWith(".tsx") ? "typescript" : "typescript",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false }
    });
    return () => editorRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (active) {
      editorRef.current.setValue(files[active]);
    }
  }, [active]);

  useEffect(() => {
    if (!editorRef.current || !active) return;
    const sub = editorRef.current.onDidChangeModelContent(() => {
      updateFile(active, editorRef.current!.getValue());
    });
    return () => sub.dispose();
  }, [active]);

  return <div className="h-[420px] border rounded-xl overflow-hidden" ref={ref}></div>;
}
