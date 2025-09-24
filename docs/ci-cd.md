# CI/CD

## Workflows
- **ci.yml**: type-check, lint/build, path filters.
- **codex-commands.yml**: issue-comment parser for `/codex-*` (UI-only automation).
- **deploy.yml**: Cloudflare Workers deploy via Wrangler 4.
- **proofs-gate**: Ensures JWKS/RS256/AI binding/preflight not regressed.

## Triggers
- UI-only PRs: Label `area:frontend` and run Codex commands.
- Deploy: Manual `workflow_dispatch` or path-gated push under `api/**`.

## Secrets
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` for API.
- Frontend has no new secrets.

## PR Requirements (UI)
- Screenshots/GIF (light/dark), LH ≥ 90, bundle delta ≤ 50KB gz.
- No route/CORS/header changes.

