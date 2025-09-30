# GitHub Actions Workflows

This directory contains all CI/CD workflows for Cognomega Edge.

## Workflow Status

| Workflow | Status | Purpose |
|----------|--------|---------|
| [ci-full.yml](./ci-full.yml) | [![Full CI](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/ci-full.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/ci-full.yml) | Complete CI pipeline |
| [ci.yml](./ci.yml) | [![CI](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/ci.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/ci.yml) | Basic type-check & build |
| [test.yml](./test.yml) | [![Tests](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/test.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/test.yml) | Unit & E2E tests |
| [lint.yml](./lint.yml) | [![Lint](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/lint.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/lint.yml) | Code quality checks |
| [format.yml](./format.yml) | [![Format](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/format.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/format.yml) | Code formatting |
| [security.yml](./security.yml) | [![Security](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/security.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/security.yml) | Security scanning |
| [compliance.yml](./compliance.yml) | [![Compliance](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/compliance.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/compliance.yml) | License & policy checks |
| [deploy.yml](./deploy.yml) | [![Deploy](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/deploy.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/deploy.yml) | Production deployment |
| [preview.yml](./preview.yml) | [![Preview](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/preview.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/preview.yml) | PR preview deploys |
| [release.yml](./release.yml) | [![Release](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/release.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/release.yml) | Release automation |
| [docs.yml](./docs.yml) | [![Docs](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/docs.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/docs.yml) | Documentation checks |
| [uptime.yml](./uptime.yml) | [![Uptime](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/uptime.yml/badge.svg)](https://github.com/Bharath-kolekar/cognomega-edge/actions/workflows/uptime.yml) | Health monitoring |

## Workflow Categories

### 🧪 Testing & Quality
- **ci.yml** - Basic type-check, lint, and build
- **ci-full.yml** - Comprehensive CI pipeline with all checks
- **test.yml** - Unit tests (Vitest) and E2E tests (Playwright)
- **lint.yml** - ESLint, TypeScript checking, Markdown linting
- **format.yml** - Prettier formatting validation and auto-fix

### 🔒 Security & Compliance
- **security.yml** - Secrets scanning (Gitleaks), dependency scanning (Snyk), CodeQL analysis
- **compliance.yml** - License compliance, SBOM generation, policy validation
- **proofs-gate.yml** - Contract validation (JWKS, RS256, AI binding)

### 🚀 Deployment
- **deploy.yml** - Main deployment workflow with smoke tests
- **deploy-api.yml** - API-specific deployment (packages/api)
- **deploy-frontend.yml** - Frontend deployment (packages/frontend)
- **deploy-builder.yml** - Builder deployment (packages/builder)
- **deploy-vercel.yml** - Vercel production deployment (optional)
- **preview.yml** - PR-based preview deployments

### 📝 Release Management
- **release.yml** - Automated versioning, changelog, GitHub releases
- **nightly-probes.yml** - Daily comprehensive smoke tests

### 📚 Documentation
- **docs.yml** - Documentation validation, link checking, TOC generation

### 💰 Cost & Performance
- **cost-control.yml** - Bundle size monitoring, cost estimation

### 🔧 Operations
- **uptime.yml** - Health checks every 5 minutes
- **codex-commands.yml** - Issue comment automation
- **labeler.yml** - Auto-label PRs by changed paths
- **neon-migrations.yml** - Database migration workflows

## Workflow Triggers Summary

| Trigger | Workflows |
|---------|-----------|
| **Pull Request** | ci-full, test, lint, format, security, compliance, preview, docs, cost-control |
| **Push to main** | ci-full, test, lint, format, security, compliance, deploy*, release, docs, cost-control |
| **Schedule (5 min)** | uptime |
| **Schedule (daily)** | nightly-probes |
| **Schedule (weekly)** | security, compliance |
| **Manual** | All workflows support `workflow_dispatch` |
| **Issue Comment** | codex-commands |

## Quick Actions

### Manual Triggers
Run workflows manually from the Actions tab or CLI:

```bash
# Deploy to production
gh workflow run deploy.yml

# Run full test suite
gh workflow run test.yml

# Trigger release
gh workflow run release.yml -f release_type=patch

# Run security scan
gh workflow run security.yml
```

### View Status
```bash
# List recent runs
gh run list

# Watch latest run
gh run watch

# View specific run
gh run view <run-id>
```

## Workflow Files

Total workflows: 23
- New workflows added: 15
- Existing workflows: 8
- Total lines of workflow code: ~1,800

## Dependencies

### GitHub Actions Used
- `actions/checkout@v4` - Repository checkout
- `actions/setup-node@v4` - Node.js setup
- `actions/cache@v4` - Caching dependencies/artifacts
- `actions/upload-artifact@v4` - Upload build artifacts
- `github/codeql-action@v3` - Security analysis
- `gitleaks/gitleaks-action@v2` - Secret scanning
- `snyk/actions/node@master` - Dependency scanning
- `cloudflare/pages-action@v1` - Cloudflare Pages deployment
- `amondnet/vercel-action@v25` - Vercel deployment
- `DavidAnson/markdownlint-cli2-action@v18` - Markdown linting
- `actions/github-script@v7` - GitHub API interactions

### External Tools
- **pnpm** - Package management
- **wrangler** - Cloudflare Workers deployment
- **playwright** - E2E testing
- **vitest** - Unit testing
- **eslint** - Code linting
- **prettier** - Code formatting
- **gitleaks** - Secret scanning
- **snyk** - Vulnerability scanning
- **semantic-release** - Version management

## Configuration Files

Related configuration files in `.github/`:
- `dependabot.yml` - Dependency update automation
- `CODEOWNERS` - Code ownership and review assignment
- `cliff.toml` - Changelog generation config
- `markdown-link-check.json` - Link validation config
- `labeler.yml` - Auto-labeling rules

Root configuration files:
- `.releaserc.json` - Semantic release configuration
- `.gitignore` - Ignore CI artifacts

## Documentation

Comprehensive documentation available:
- [CI/CD Overview](../../docs/ci-cd.md) - Complete workflow reference
- [Setup Guide](../../docs/ci-cd-setup.md) - Step-by-step setup instructions
- [Architecture](../../docs/ci-cd-architecture.md) - System design and data flow
- [Quick Reference](../../docs/ci-cd-quickref.md) - Developer quick reference

## Recent Updates

### 2025-09-30 - Major CI/CD Overhaul
- ✅ Added 15 new production-grade workflows
- ✅ Comprehensive testing (unit + E2E)
- ✅ Security scanning (secrets, dependencies, static analysis)
- ✅ Multi-cloud deployment (Cloudflare + Vercel)
- ✅ Automated releases and changelogs
- ✅ Cost control and bundle monitoring
- ✅ Complete documentation suite

## Support

For questions or issues:
1. Check workflow logs in the Actions tab
2. Review documentation in `docs/ci-cd*.md`
3. Open an issue with `ci-cd` label
4. Contact repository maintainers

---

**Maintained by**: @Bharath-kolekar
**Last Updated**: 2025-09-30
