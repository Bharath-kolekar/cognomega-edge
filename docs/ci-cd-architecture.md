# CI/CD Architecture

This document describes the architecture and flow of the CI/CD pipelines for Cognomega Edge.

## Overview

The CI/CD system is designed with a multi-stage, parallel execution model that optimizes for speed, reliability, and comprehensive validation.

## Architecture Principles

1. **Fail Fast**: Quick checks run first to catch obvious issues early
2. **Parallel Execution**: Independent checks run concurrently to save time
3. **Progressive Validation**: Each stage builds on previous successes
4. **Comprehensive Coverage**: Testing, security, compliance, and deployment
5. **Multi-Cloud**: Support for Cloudflare (primary) and Vercel (secondary)
6. **Automated Recovery**: Self-healing workflows with retries and fallbacks
7. **Audit Trail**: Complete logging and artifact retention

## Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PULL REQUEST OPENED                          │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Stage 1: Quick Checks         │
                    │   - Merge conflict detection    │
                    │   - File size validation        │
                    │   - Secret pattern detection    │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Stage 2: Build & Typecheck    │
                    │   - Install dependencies        │
                    │   - TypeScript validation       │
                    │   - Build all packages          │
                    │   - Cache artifacts             │
                    └────────────────┬────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
     ┌──────▼──────┐        ┌───────▼────────┐      ┌───────▼────────┐
     │  Stage 3a:  │        │   Stage 3b:    │      │   Stage 3c:    │
     │    Lint     │        │     Test       │      │   Security     │
     │  - ESLint   │        │  - Unit tests  │      │  - Gitleaks    │
     │  - TS check │        │  - E2E tests   │      │  - Snyk        │
     │  - Markdown │        │  - Coverage    │      │  - CodeQL      │
     └──────┬──────┘        └────────┬───────┘      └────────┬───────┘
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 4: Integration & Quality Checks                       │
     │   - API contract validation                                   │
     │   - Bundle size analysis                                      │
     │   - Documentation validation                                  │
     │   - Compliance checks                                         │
     └───────────────────────────────┬───────────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 5: Preview Deployment                                 │
     │   - Deploy to Cloudflare Pages preview                        │
     │   - Deploy to Vercel preview (optional)                       │
     │   - Post preview URL comments                                 │
     └───────────────────────────────┬───────────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 6: Results & Reporting                                │
     │   - Aggregate results                                         │
     │   - Post summary comment                                      │
     │   - Upload artifacts                                          │
     └───────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                       MERGE TO MAIN BRANCH                           │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 1: CI Validation (same as PR)                         │
     │   - All PR checks must pass                                   │
     └───────────────────────────────┬───────────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 2: Production Deployment                              │
     │                                                               │
     │   Path-based deployment:                                      │
     │   - packages/api/** → deploy-api.yml                          │
     │   - packages/frontend/** → deploy-frontend.yml                │
     │   - packages/builder/** → deploy-builder.yml                  │
     │                                                               │
     │   Deployments:                                                │
     │   - Cloudflare Workers (API)                                  │
     │   - Cloudflare Pages (Frontend, Builder)                      │
     │   - Vercel (Frontend - optional)                              │
     └───────────────────────────────┬───────────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 3: Post-Deployment Validation                         │
     │   - Smoke tests (JWKS, JWT, Balance, SI)                      │
     │   - Health checks                                             │
     │   - Upload caps validation                                    │
     │   - Save proof artifacts                                      │
     └───────────────────────────────┬───────────────────────────────┘
                                     │
     ┌───────────────────────────────▼───────────────────────────────┐
     │   Stage 4: Release Management                                 │
     │   - Generate changelog (conventional commits)                 │
     │   - Create GitHub release (if applicable)                     │
     │   - Update version numbers                                    │
     │   - Audit logging                                             │
     └───────────────────────────────────────────────────────────────┘
```

## Workflow Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                     Workflow Relationships                    │
└──────────────────────────────────────────────────────────────┘

ci-full.yml (orchestrator)
├── quick-checks
├── build-check
├── lint.yml (reusable)
├── test.yml (reusable)
├── security.yml (reusable)
├── integration
└── ci-complete

deploy.yml
├── deploy (build + wrangler deploy)
└── smoke (post-deploy validation)

preview.yml
├── preview-cloudflare
└── preview-vercel

release.yml
├── changelog (on push)
├── release (on manual trigger)
└── semantic-release (on conventional commits)

docs.yml
├── lint-docs
├── validate-docs
├── build-docs
└── update-toc

compliance.yml
├── license-check
├── dependency-review
├── sbom-generation
├── audit-log
└── policy-check
```

## Data Flow

### Build Artifacts

```
Source Code
    │
    ├──> TypeScript Compile ──> Type Definitions
    │
    ├──> Build Process
    │    ├──> Frontend: Vite Build ──> dist/
    │    ├──> API: Wrangler Build ──> .wrangler/
    │    └──> Builder: Vite Build ──> dist/
    │
    └──> Artifact Cache (GitHub Actions Cache)
         └──> Reused in deployment workflows
```

### Test Results

```
Test Execution
    │
    ├──> Unit Tests (Vitest)
    │    └──> coverage/ ──> Upload as Artifact
    │
    ├──> E2E Tests (Playwright)
    │    ├──> test-results/
    │    └──> playwright-report/ ──> Upload as Artifact
    │
    └──> Test Summary ──> PR Comment
```

### Security Scan Results

```
Security Scanning
    │
    ├──> Gitleaks (Secrets)
    │    └──> Security Alerts (if found)
    │
    ├──> Snyk (Dependencies)
    │    └──> Vulnerability Report ──> Artifact
    │
    ├──> CodeQL (Static Analysis)
    │    └──> SARIF Results ──> Security Tab
    │
    └──> Summary ──> PR Comment
```

### Deployment Flow

```
Merged PR
    │
    ├──> Path Filter
    │    ├──> packages/api/** ──> deploy-api.yml
    │    ├──> packages/frontend/** ──> deploy-frontend.yml
    │    └──> packages/builder/** ──> deploy-builder.yml
    │
    └──> Deployment
         ├──> Cloudflare
         │    ├──> Workers (API)
         │    └──> Pages (Frontend/Builder)
         │
         ├──> Vercel (optional)
         │    └──> Pages (Frontend)
         │
         └──> Post-Deploy Checks
              ├──> Smoke Tests
              ├──> Health Checks
              └──> Proof Artifacts
```

## Parallel Execution Model

The CI/CD system maximizes parallelism for efficiency:

### Stage 3: Quality Checks (Parallel)
- **Lint** (ESLint, TypeScript, Markdown): ~2-5 minutes
- **Test** (Unit + E2E): ~5-15 minutes
- **Security** (Gitleaks, Snyk, CodeQL): ~5-20 minutes

**Total Stage Time**: ~20 minutes (if run serially: ~50 minutes)
**Time Saved**: ~30 minutes (60% reduction)

### Multi-Cloud Deployment (Parallel)
- **Cloudflare Pages**: ~3-5 minutes
- **Vercel**: ~3-5 minutes

**Total Deployment Time**: ~5 minutes (if run serially: ~10 minutes)

## Failure Handling

### Retry Strategy

```yaml
# Automatic retries for transient failures
- uses: actions/checkout@v4
  with:
    retries: 3
    retry-delay-seconds: 30
```

### Fallback Mechanisms

1. **Cache Miss**: Falls back to full dependency installation
2. **Deploy Failure**: Preserves previous deployment (no automatic rollback)
3. **Test Failure**: Continues other checks, uploads partial results
4. **Security Scan Failure**: Continues with warning (doesn't block PR)

### Error Propagation

```
Failure in Stage 1 (Quick Checks)
    └──> Abort pipeline (no point continuing)

Failure in Stage 2 (Build)
    └──> Abort pipeline (can't test without build)

Failure in Stage 3 (Quality Checks)
    ├──> Continue other Stage 3 checks
    └──> Block merge (required status check)

Failure in Stage 4 (Integration)
    └──> Report but continue (non-blocking)

Failure in Stage 5 (Preview)
    └──> Comment error but continue (non-blocking)
```

## Caching Strategy

### Dependency Cache

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'  # Automatic caching of pnpm store
```

**Cache Hit Rate**: ~90% (updates weekly via Dependabot)
**Time Saved**: ~2-3 minutes per workflow

### Build Artifact Cache

```yaml
- uses: actions/cache@v4
  with:
    path: |
      packages/*/dist
      packages/*/.wrangler
    key: build-${{ github.sha }}
```

**Cache Hit Rate**: 100% within same commit
**Time Saved**: ~5-10 minutes for deployment workflows

### Playwright Browser Cache

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

Browsers cached automatically by GitHub Actions.
**Time Saved**: ~1-2 minutes per E2E test run

## Security Model

### Secrets Management

```
GitHub Secrets (Encrypted at Rest)
    │
    ├──> Available only to workflows
    │    (not accessible in PRs from forks)
    │
    ├──> Masked in logs
    │    (never displayed in plain text)
    │
    └──> Injected at runtime
         (not stored in workflow files)
```

### Permission Model

```yaml
# Minimal permissions per workflow
permissions:
  contents: read        # Read repository contents
  pull-requests: write  # Comment on PRs
  security-events: write # Write security scan results
```

**Principle**: Least privilege - grant only what's needed

### Fork PR Protection

```yaml
# Sensitive workflows don't run on PRs from forks
if: github.event.pull_request.head.repo.full_name == github.repository
```

**Protection**: Secrets not exposed to external contributors

## Monitoring and Observability

### Metrics Tracked

1. **Workflow Duration**: Total time for each workflow
2. **Success Rate**: Percentage of successful runs
3. **Cache Hit Rate**: Efficiency of caching
4. **Test Coverage**: Code coverage percentage
5. **Bundle Size**: Frontend bundle size over time
6. **Security Alerts**: Number of vulnerabilities found
7. **Deployment Frequency**: Deployments per day/week

### Artifacts Retention

| Artifact Type | Retention | Purpose |
|--------------|-----------|---------|
| Test Results | 7 days | Debugging test failures |
| Coverage Reports | 7 days | Track coverage trends |
| Bundle Analysis | 30 days | Monitor bundle size |
| Security Reports | 30 days | Compliance audits |
| SBOM | 90 days | License compliance |
| Deployment Logs | Permanent | Audit trail |

### Alerting

**Automatic Alerts** (via GitHub):
- Workflow failure emails
- Security vulnerability notifications
- Required status check failures

**Manual Review**:
- Weekly security scan summaries
- Monthly bundle size trends
- Quarterly dependency updates

## Performance Optimization

### Optimization Techniques

1. **Path-Based Triggers**: Only run relevant workflows
   ```yaml
   on:
     push:
       paths:
         - 'packages/api/**'
   ```

2. **Conditional Steps**: Skip unnecessary work
   ```yaml
   - name: Deploy to Vercel
     if: vars.ENABLE_VERCEL_DEPLOY == 'true'
   ```

3. **Concurrency Limits**: Cancel redundant runs
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

4. **Smart Caching**: Reuse build artifacts
   ```yaml
   - uses: actions/cache@v4
   ```

5. **Parallel Jobs**: Run independent checks concurrently
   ```yaml
   jobs:
     lint:
     test:
     security:
   # All run in parallel
   ```

### Performance Metrics

| Workflow | Average Duration | P95 Duration |
|----------|-----------------|--------------|
| ci-full.yml | ~15 min | ~25 min |
| deploy.yml | ~8 min | ~12 min |
| test.yml | ~10 min | ~18 min |
| security.yml | ~15 min | ~30 min |
| preview.yml | ~5 min | ~8 min |

## Cost Analysis

### GitHub Actions Minutes

**Free Tier**: 2,000 minutes/month for private repos

**Estimated Usage**:
- PR workflows: ~30 min per PR × 20 PRs/month = 600 min
- Push workflows: ~20 min per push × 50 pushes/month = 1,000 min
- Scheduled workflows: ~10 min × 200 runs/month = 2,000 min
- **Total**: ~3,600 min/month

**Recommendation**: Upgrade to Team plan ($4/user/month) for 3,000 additional minutes

### Multi-Cloud Costs

**Cloudflare** (Primary):
- Workers: Free tier (100k requests/day)
- Pages: Free tier (unlimited)
- KV: Free tier (100k reads/day)
- **Total**: $0/month (within free tier)

**Vercel** (Secondary - Optional):
- Hobby: Free tier (100GB bandwidth)
- Pro: $20/month (recommended for production)
- **Total**: $0-20/month

## Future Enhancements

### Planned Improvements

1. **Performance Monitoring**
   - Lighthouse CI integration
   - Core Web Vitals tracking
   - Performance budget enforcement

2. **Advanced Security**
   - Container scanning (if Docker introduced)
   - Infrastructure as Code scanning
   - Runtime security monitoring

3. **Enhanced Reporting**
   - Slack/Discord notifications
   - Custom dashboards
   - Trend analysis

4. **Deployment Strategies**
   - Blue-green deployments
   - Canary releases
   - Feature flag integration

5. **AI-Powered Insights**
   - Automated issue triage
   - Suggested fixes for failures
   - Predictive analytics

---

Last updated: 2025-09-30
