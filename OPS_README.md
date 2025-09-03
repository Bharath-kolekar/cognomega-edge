# Cognomega – Ops Quickstart

## Endpoints
- API readiness: https://api.cognomega.com/ready  → `{"ok":true}`
- Guest auth (Turnstile): POST https://api.cognomega.com/auth/guest
- Protected upload: POST https://api.cognomega.com/v1/files/upload (Bearer JWT)

## Deploy
### API (Workers)
cd api
wrangler deploy

### Frontend (Pages)
cd frontend
npm run build
wrangler pages deploy dist

## JWT (local mint for CLI tests)
cd api
$env:JWT = "<same value as Worker secret JWT_SECRET>"
node .\gen-jwt.mjs   # prints a short-lived token

## Secrets / Config (Workers)
wrangler secret put JWT_SECRET
wrangler secret put NEON_DATABASE_URL

## Storage
- KV (credits): binding `CREDITS`
- R2 (files): bucket `cognomega-files`, binding `FILES`

## CORS / WAF
- Allowed origin (prod): https://app.cognomega.com
- WAF rule: block POST /v1/files/upload when Origin ≠ prod
- Turnstile required on /auth/guest (can be feature-flagged) and on upload

## Troubleshooting
- Tail logs:
  wrangler tail cognomega-api --format pretty

- 403 with {"error":"turnstile_failed"}:
  Token expired/duplicate → refresh the page or wait for auto-refresh.

- 401 on upload:
  Guest JWT expired → refresh token (frontend auto-refreshes), or mint a new one for CLI.

- CORS/preflight issues:
  Check Origin header and Pages domain; `ready` should return 200 with ACAO.

