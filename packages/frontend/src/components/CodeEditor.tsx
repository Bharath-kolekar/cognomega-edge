 
import React, { useRef, useEffect, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";

loader.init().then(_monaco => {
  // Optionally configure monaco here
});

export default function CodeEditor({ language = "typescript", value, onChange }) {
  const [code, setCode] = useState(value || "");
  const [fixing, setFixing] = useState(false);
  const [errors, setErrors] = useState([]);
  const editorRef = useRef();

  useEffect(() => {
    if (onChange) onChange(code);
  }, [code, onChange]);

  const handleFix = async () => {
    setFixing(true);
    setErrors([]);
    const res = await fetch("/api/si/autocorrect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });
    const { ok, code: fixedCode, errors: errs } = await res.json();
    if (ok && fixedCode) setCode(fixedCode);
    setFixing(false);
    if (errs) setErrors(errs);
  };

  return (
    <div>
      <Editor
        height="400px"
        defaultLanguage={language}
        value={code}
        onChange={val => setCode(val || "")}
        theme="vs-dark"
        onMount={editor => { editorRef.current = editor; }}
      />
      <button className="btn btn-outline" onClick={handleFix} disabled={fixing}>
        {fixing ? "Fixing..." : "Regenerate/Fix Code"}
      </button>
      {errors.length > 0 && (
        <div className="code-errors">
          <strong>Static Analysis Errors:</strong>
          <ul>
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}