# Ops / Routing / CORS / Headers Change

## What changed
- [ ] `api/wrangler.toml` route(s)
- [ ] CORS allow/expose list
- [ ] Exposed billing headers
- [ ] Health/JWKS/Auth endpoints

## Mandatory Proofs (attach under ops/proofs/)
- [ ] `ai/binding` → `{ ai_bound: true }`
- [ ] JWKS head (first ~120 chars)
- [ ] `/auth/guest` → RS256 + `iss=https://api.cognomega.com`
- [ ] Preflight OPTIONS to `/api/si/ask` (with `X-Intelligence-Tier`)
- [ ] If credits/jobs changed: sample usage row & balance headers

## Docs updated
- [ ] `OPS.md`
- [ ] README segment (endpoints + exposed headers)

## Labels
- Apply: `change:routes` / `change:cors` / `change:headers`, `ops:proofs-attached`, `codex:ready`

## Rollback
- How to revert routes / disable flag / restore previous `wrangler.toml`.
