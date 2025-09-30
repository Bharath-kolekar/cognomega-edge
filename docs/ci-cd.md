# CI/CD

## Overview

This repository implements production-grade CI/CD automation with comprehensive testing, security scanning, cost control, multi-cloud deployment, and automated release management.

## Core Workflows

### Build & Test
- **ci.yml**: Basic type-check, lint/build with path filters
- **ci-full.yml**: Comprehensive CI pipeline with parallel checks and integration tests
- **test.yml**: Unit tests (Vitest) and E2E tests (Playwright)
- **lint.yml**: ESLint, TypeScript checking, and Markdown linting
- **format.yml**: Prettier formatting checks with auto-fix on main

### Security
- **security.yml**: Secrets scanning (Gitleaks), dependency scanning (Snyk), CodeQL analysis
- **compliance.yml**: License compliance, dependency review, SBOM generation, policy checks

### Deployment
- **deploy.yml**: Cloudflare Workers deploy via Wrangler 4 with post-deploy smoke tests
- **deploy-api.yml**: API-specific deployment (packages/api)
- **deploy-frontend.yml**: Frontend deployment to Cloudflare Pages (packages/frontend)
- **deploy-builder.yml**: Builder deployment (packages/builder)
- **deploy-vercel.yml**: Vercel deployment (optional, controlled by `ENABLE_VERCEL_DEPLOY` var)

### Preview Environments
- **preview.yml**: PR-based preview deployments to Cloudflare Pages and Vercel with URL comments

### Release Management
- **release.yml**: Automated changelog generation, semantic versioning, GitHub releases
- Supports both automatic (conventional commits) and manual release triggers
- Generates release notes categorized by feature/fix/chore

### Documentation
- **docs.yml**: Documentation linting, link checking, structure validation, TOC generation

### Cost Control
- **cost-control.yml**: Bundle size monitoring (50KB threshold), cost estimation reports

### Operations
- **proofs-gate.yml**: Ensures JWKS/RS256/AI binding/preflight not regressed
- **uptime.yml**: 5-minute interval health checks (preflight CORS, /ready endpoint)
- **nightly-probes.yml**: Daily comprehensive smoke tests
- **codex-commands.yml**: Issue-comment parser for `/codex-*` (UI-only automation)

### Maintenance
- **dependabot.yml**: Automated dependency updates (weekly, Monday 09:00 UTC)
- Separate update schedules for root, API, frontend, and GitHub Actions

## Triggers

### Pull Request Triggers
- All quality checks (build, test, lint, format, security)
- Preview deployments (Cloudflare Pages, optional Vercel)
- Bundle size analysis
- Documentation validation
- Compliance checks

### Push to Main Triggers
- Full deployment pipeline (Cloudflare Workers, Pages)
- Changelog generation
- Smoke tests and health checks
- Audit logging

### Scheduled Triggers
- **Uptime checks**: Every 5 minutes
- **Nightly probes**: Daily at 02:00 UTC
- **Security scans**: Weekly on Monday
- **Dependency updates**: Weekly on Monday at 09:00 UTC

### Manual Triggers
- All workflows support `workflow_dispatch` for manual execution
- Release workflow accepts release type (patch/minor/major)

## Required Secrets

### Cloudflare (Required)
- `CLOUDFLARE_API_TOKEN`: API token for Workers and Pages deployment
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account identifier

### Vercel (Optional)
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `VERCEL_PRODUCTION_URL`: Production URL for verification

### Security Scanning (Optional)
- `SNYK_TOKEN`: Snyk vulnerability scanning token
- `GITLEAKS_LICENSE`: Gitleaks license key (optional)

### Testing (Optional)
- `SMOKE_EMAIL`: Email for post-deploy smoke tests

## Configuration Variables

- `ENABLE_VERCEL_PREVIEW`: Set to `'true'` to enable Vercel preview deployments
- `ENABLE_VERCEL_DEPLOY`: Set to `'true'` to enable Vercel production deployments

## PR Requirements

### Frontend Changes
- Screenshots/GIF (light/dark modes)
- Lighthouse score ≥ 90 (Performance & Accessibility)
- Bundle delta ≤ 50KB gzipped
- No route/CORS/header changes without ops review

### API Changes
- Route audit proof if wrangler.toml modified
- No changes to public contracts without OPS.md update
- Post-deploy smoke tests must pass

### Documentation Changes
- Markdown linting passes
- No broken links
- Cross-references validated

## Branch Protection

Recommended branch protection rules for `main`:
- Require pull request reviews before merging
- Require status checks to pass before merging:
  - `ci-full / CI Complete`
  - `security / Secrets Scanning`
  - `lint / ESLint Check`
  - `test / Unit Tests`
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

## Release Process

### Automatic (Conventional Commits)
1. Commits following conventional format (feat:, fix:, etc.) trigger semantic-release
2. Version is automatically bumped based on commit types
3. CHANGELOG.md is generated and committed
4. GitHub release is created with categorized notes

### Manual
1. Run "Release & Changelog" workflow manually
2. Select release type (patch/minor/major)
3. Version is bumped and tagged
4. Release notes are generated from commits
5. GitHub release is published

## Monitoring & Observability

### Health Checks
- `/ready` endpoint checked every 5 minutes
- CORS preflight validation
- JWKS availability
- Guest JWT generation

### Post-Deploy Verification
- JWKS format and X-Request-Id header
- RS256 JWT validation
- Balance endpoint (header + bearer auth)
- SI ask metering headers
- Upload capability tests (1MB OK, >10MB rejected)

### Artifacts & Reports
- Test results and coverage
- Playwright reports
- Bundle size analysis
- License compliance reports
- SBOM (Software Bill of Materials)
- Cost estimates
- Policy compliance reports

## Cost Optimization

### Bundle Size Limits
- Frontend JS (gzipped): 50KB threshold
- Exceeding threshold fails the build
- PR comments show bundle size delta

### Deployment Cost Monitoring
- Cloudflare free tier limits documented
- Vercel bandwidth tracking
- Monthly cost estimates generated

## Compliance & Auditing

### License Compliance
- Approved licenses: MIT, Apache-2.0, BSD-2/3-Clause, ISC, CC0-1.0
- Flagged licenses: GPL-2.0, GPL-3.0, AGPL-3.0
- License report generated on every PR

### Security Scanning
- Secret detection with Gitleaks
- Dependency vulnerabilities with Snyk
- CodeQL static analysis
- Weekly comprehensive scans

### Audit Trail
- Deployment logs in `.audit/` directory
- Commit SHA, actor, timestamp tracked
- Automated commit on each deployment

## Multi-Cloud Strategy

### Primary: Cloudflare
- **API**: Workers (api.cognomega.com)
- **Frontend**: Pages (app.cognomega.com)
- **Storage**: KV, R2
- **CDN**: Global edge network

### Secondary: Vercel (Optional)
- **Frontend**: Preview and production deployments
- Controlled via feature flags
- Useful for A/B testing and redundancy

## Troubleshooting

### Workflow Failures
- Check workflow logs in GitHub Actions tab
- Review artifact uploads for detailed reports
- Verify all required secrets are set

### Preview Deployment Issues
- Ensure CLOUDFLARE_API_TOKEN has Pages permissions
- Check Vercel token if Vercel previews enabled
- Verify build succeeds locally

### Release Workflow Issues
- Ensure conventional commit format is followed
- Check semantic-release configuration in `.releaserc.json`
- Verify GitHub token has write permissions

## Best Practices

1. **Always use conventional commits** for automatic versioning
2. **Run checks locally** before pushing: `pnpm run check && pnpm run build`
3. **Keep bundle sizes small** - review bundle analysis on every PR
4. **Update documentation** when changing routes or public contracts
5. **Use workflow_dispatch** for testing new workflows
6. **Monitor security scans** and address vulnerabilities promptly
7. **Review dependency updates** from Dependabot regularly

## References

- GitHub Actions: https://docs.github.com/en/actions
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Wrangler: https://developers.cloudflare.com/workers/wrangler/
- Vercel: https://vercel.com/docs
- Conventional Commits: https://www.conventionalcommits.org/
- Semantic Release: https://semantic-release.gitbook.io/

