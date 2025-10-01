
import React from "react";
import TopBar from "./components/TopBar";
import SpecForm from "./components/SpecForm";
import Editor from "./components/Editor";
import LivePreview from "./components/LivePreview";

export default function App() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <SpecForm />
          <Editor />
        </div>
        <div>
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
