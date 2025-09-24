# OPS: Runbooks & Operations

## Environments
- **API**: Cloudflare Workers (`wrangler@4`)
- Storage: Cloudflare KV/R2
- Issuer: `https://api.cognomega.com`, RS256 (`kid=k1`), JWKS at `/.well-known/jwks.json`

## Health & Smoke
1. **JWKS** returns keys and exposes `X-Request-Id`.
2. **Guest JWT**: alg=RS256, correct `iss`, exp ~1h.
3. **/api/billing/balance** works with header/bearer auth.
4. **/api/si/ask** returns provider/model/tokens/credits headers.
5. **/api/upload/direct** accepts ≤1MB, 10MB+ => 413.

## Deploy
- GitHub Actions: `deploy.yml` (manual `workflow_dispatch` or gated push).
- Required Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- CLI: `gh workflow run deploy --ref main` and `gh run watch`.

## SLOs & Guardrails
- API p95 < 500ms for light endpoints.
- Frontend **Lighthouse ≥ 90** Perf & Accessibility for PRs.
- No changes to routes/CORS/headers without ops review.

