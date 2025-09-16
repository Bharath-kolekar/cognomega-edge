import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const target = "https://api.cognomega.com";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // ---- specific health/ready rewrites ----
      "/ready":       { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/v1/healthz" },
      "/api/ready":   { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/v1/healthz" },
      "/health":      { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/v1/healthz" },
      "/healthz":     { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/v1/healthz" },
      "/api/health":  { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/v1/healthz" },
      "/api/healthz": { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/v1/healthz" },

      // ---- specific USAGE rewrites (canonical → /api/billing/usage) ----
      "/usage":                 { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/billing/usage" },
      "/api/usage":             { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/billing/usage" },
      "/api/v1/usage":          { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/billing/usage" },
      "/billing/usage":         { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/billing/usage" },
      "/api/v1/billing/usage":  { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/billing/usage" },

      // ---- specific CREDITS rewrites (canonical → /api/credits) ----
      "/credits":               { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },
      "/v1/credits":            { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },
      "/api/credits":           { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },
      "/api/v1/credits":        { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },
      "/billing/credits":       { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },
      "/api/billing/credits":   { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },
      "/api/v1/billing/credits":{ target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost", rewrite: () => "/api/credits" },

      // ---- general API proxies (fallback) ----
      "/api":     { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost" },
      "/v1":      { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost" },
      "/auth":    { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost" },
      "/billing": { target, changeOrigin: true, secure: true, cookieDomainRewrite: "localhost" }
    }
  }
});

