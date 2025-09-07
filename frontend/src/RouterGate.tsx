import React from "react";
import SketchToApp from "./pages/SketchToApp";
import App from "./App";

/**
 * Minimal route gate:
 * - If path starts with /tools/sketch-to-app -> render SketchToApp
 * - Otherwise render the existing App
 */
export default function RouterGate() {
  const path =
    (typeof window !== "undefined" ? window.location.pathname : "/") || "/";
  if (path.startsWith("/tools/sketch-to-app")) {
    return <SketchToApp />;
  }
  return <App />;
}