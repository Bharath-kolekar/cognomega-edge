### API: request-id everywhere, stricter CORS, env-driven WARN_CREDITS, admin env snapshot, type fixes

**What changed**
- CORS: unified/strict preflight + response headers; dynamic ACAO from ALLOWED_ORIGINS; credentials enabled; consistent Access-Control-Expose-Headers.
- Request ID: X-Request-Id on all responses (incl. OPTIONS & JWKS).
- Credits: WARN_CREDITS now env-driven (defaults to 10).
- Admin: /api/admin/env-snapshot (X-Admin-Key) returns redacted env overview.
- Types: Neon template generic usage + KV list typings fixed (tsc clean).
- Jobs: enqueue triggers internal /admin/process-one; cron as fallback.
- Wrangler: config tidy; no Logpush requirement.

**How to verify**
1) Preflight → `curl -i -X OPTIONS https://api.cognomega.com/api/si/ask`
2) SI ask → headers include X-Provider, X-Model, X-Tokens-In/Out, X-Credits-Used, X-Request-Id
3) Env snapshot → `/api/admin/env-snapshot` (X-Admin-Key)
4) Balance → `/api/billing/balance` returns `warn_credits`
5) JWKS → `/.well-known/jwks.json` exposes X-Request-Id
