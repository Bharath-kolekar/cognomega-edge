import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = "https://api.cognomega.com";

// Dev: proxy API paths so requests are same-origin (no CORS).
// Preview/build: unchanged.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // covers /api, /v1, /auth, /gen-jwt, /credits, /billing
      "^/(api|v1|auth|gen-jwt|credits|billing)(/.*)?": {
        target: API,
        changeOrigin: true,
        secure: true,
        // no rewrite — keep paths as-is
      }
    }
  },
  preview: { port: 4173 }
});