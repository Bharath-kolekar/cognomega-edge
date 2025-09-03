# Cognomega — Production Runbook
App: https://app.cognomega.com
API: https://api.cognomega.com
Health: GET /ready -> {"ok":true}
Deploy (Pages): cd frontend; npm run build; wrangler pages deploy dist
Deploy (API):   cd api; wrangler deploy
Secrets (Worker): JWT_SECRET, NEON_DATABASE_URL, TURNSTILE_SECRET
Vars (Worker):   JWT_ISS=cognomega, JWT_AUD=cognomega-clients
Vars (Pages):    VITE_API_BASE=https://api.cognomega.com, VITE_TURNSTILE_SITE_KEY=<site key>
Uptime: .github/workflows/uptime.yml (5 min)
Infra: R2=cognomega-files, KV=CREDITS, Neon autoscale 0.25–2 CU (5-min suspend)
