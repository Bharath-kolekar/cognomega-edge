import React from "react";
import { createRoot } from "react-dom/client";

// ✅ this line was missing
//import "./index.css";   // or "./styles.css" if that's your file

import RouterGate from "./RouterGate";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterGate />
  </React.StrictMode>
);
