# CI/CD Pipeline Documentation

## Overview

Cognomega Edge uses GitHub Actions for continuous integration and continuous deployment. All deployments go through GitHub—no direct local deployments to production.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          GitHub                                 │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Push to    │───→│  CI Workflow │───→│   Deploy     │     │
│  │   main       │    │  (lint/test) │    │   Workflow   │     │
│  └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                   │             │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                        ┌───────────────────────────┴──────────────┐
                        │                                          │
                        ▼                                          ▼
              ┌──────────────────┐                    ┌──────────────────┐
              │  Cloudflare      │                    │  Cloudflare      │
              │  Workers         │                    │  Pages           │
              │  (API)           │                    │  (Frontend)      │
              └──────────────────┘                    └──────────────────┘
```

## Workflows

### 1. CI Workflow (`ci.yml`)

**Purpose**: Run linting and type checking on all pull requests

**Location**: `.github/workflows/ci.yml`

**Triggers**:
- Pull request to `main` branch
- Manual workflow dispatch

**Jobs**:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - name: Install dependencies
        run: pnpm install
      - name: Lint
        run: pnpm lint
      - name: Type check
        run: pnpm typecheck
```

**Success Criteria**:
- All linting rules pass
- No TypeScript errors
- All dependencies install successfully

### 2. Deploy API Workflow (`deploy.yml` & `deploy-api.yml`)

**Purpose**: Deploy API to Cloudflare Workers

**Location**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch (when API files change)
- Manual workflow dispatch

**Path Filters**:
```yaml
paths:
  - "packages/api/**"
  - ".github/workflows/deploy.yml"
```

**Jobs**:

#### Job 1: Deploy

```yaml
deploy:
  name: Deploy API (CF Workers)
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: npm
        cache-dependency-path: packages/api/package-lock.json

    - name: Install API deps
      working-directory: packages/api
      run: |
        if [ -f pnpm-lock.yaml ]; then
          corepack enable
          pnpm i --no-frozen-lockfile
        elif [ -f package-lock.json ]; then
          npm ci
        else
          npm i
        fi

    - name: Deploy (npx wrangler@4)
      working-directory: packages/api
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: npx wrangler@4 deploy
```

**Required Secrets**:
- `CLOUDFLARE_API_TOKEN` - API token with Workers permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

#### Job 2: Smoke Tests

**Purpose**: Verify deployment health

**Tests**:
1. **JWKS & Request ID** - Verify JWKS endpoint and X-Request-Id header
2. **Guest JWT** - Test RS256 JWT generation
3. **Balance** - Test billing endpoints
4. **SI Ask** - Test metering headers
5. **Preflight** - Test CORS configuration
6. **Upload Caps** - Test file upload limits

**Example**:
```yaml
smoke:
  name: Post-deploy smoke (prod)
  needs: deploy
  runs-on: ubuntu-latest
  timeout-minutes: 10
  env:
    BASE: https://api.cognomega.com
    SMOKE_EMAIL: ${{ secrets.SMOKE_EMAIL }}
  steps:
    - name: JWKS + X-Request-Id
      run: |
        curl -sS -D jwks_headers.txt -o jwks.json "$BASE/.well-known/jwks.json"
        REQID=$(grep -i '^x-request-id:' jwks_headers.txt | awk '{print $2}')
        test -n "$REQID"

    - name: Guest JWT (RS256 + iss)
      run: |
        curl -sS -X POST "$BASE/auth/guest" -o guest.json
        # Validate JWT structure and claims
        
    - name: Upload proofs
      uses: actions/upload-artifact@v4
      with:
        name: post-deploy-proofs
        path: |
          proofs.txt
          jwks.json
```

**Artifacts**: Deployment proofs uploaded for verification

### 3. Deploy Frontend Workflow (`deploy-frontend.yml`)

**Purpose**: Deploy frontend to Cloudflare Pages

**Location**: `.github/workflows/deploy-frontend.yml`

**Triggers**:
- Push to `main` branch (when frontend files change)
- Manual workflow dispatch

**Path Filters**:
```yaml
paths:
  - "packages/frontend/**"
  - ".github/workflows/deploy-frontend.yml"
```

**Jobs**:

```yaml
deploy-frontend:
  name: Deploy Frontend to Cloudflare Pages
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node and pnpm
      uses: actions/setup-node@v4
      with:
        node-version: "20"
    
    - uses: pnpm/action-setup@v2
      with:
        version: 10

    - name: Install dependencies
      working-directory: packages/frontend
      run: pnpm install

    - name: Build
      working-directory: packages/frontend
      run: pnpm build
      env:
        VITE_API_BASE: https://api.cognomega.com

    - name: Deploy to Cloudflare Pages
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: pages deploy packages/frontend/dist --project-name=cognomega-frontend
```

**Build Output**: `packages/frontend/dist/`

**Environment Variables**:
- `VITE_API_BASE` - API endpoint URL

### 4. Deploy Builder Workflow (`deploy-builder.yml`)

**Purpose**: Deploy builder interface to Cloudflare Pages

**Location**: `.github/workflows/deploy-builder.yml`

**Similar to frontend deployment but**:
- Different project name: `cognomega-builder`
- Different build configuration
- Different environment variables

### 5. Uptime Monitoring (Optional)

**Purpose**: Monitor production endpoints

**Schedule**: Every 5 minutes

**Checks**:
- API health endpoint (`/ready`)
- Frontend accessibility
- Response times

```yaml
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  uptime:
    runs-on: ubuntu-latest
    steps:
      - name: Check API health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://api.cognomega.com/ready)
          if [ "$response" != "200" ]; then
            echo "API health check failed: $response"
            exit 1
          fi
```

## Deployment Flow

### Standard Deployment

```
1. Developer creates PR
      ↓
2. CI workflow runs (lint, typecheck)
      ↓
3. Code review and approval
      ↓
4. Merge to main
      ↓
5. Deploy workflows trigger automatically
      ↓
6. API deploys to Cloudflare Workers
      ↓
7. Frontend deploys to Cloudflare Pages
      ↓
8. Smoke tests run
      ↓
9. Deployment complete (or rollback on failure)
```

### Emergency Deployment

For urgent fixes:

1. Create hotfix branch from `main`
2. Make minimal fix
3. Fast-track review
4. Merge to `main`
5. Monitor deployment

## Environment Management

### Secrets Configuration

**GitHub Repository Secrets**:

Required for CI/CD:
```
CLOUDFLARE_API_TOKEN      # Workers and Pages deployment
CLOUDFLARE_ACCOUNT_ID     # Cloudflare account
SMOKE_EMAIL               # (Optional) For smoke tests
```

API Worker Secrets (configured in Cloudflare):
```
PRIVATE_KEY_PEM          # RS256 private key for JWT
ADMIN_API_KEY            # Admin endpoint protection
GROQ_API_KEY            # Groq AI provider
OPENAI_API_KEY          # OpenAI provider (optional)
CARTESIA_API_KEY        # TTS (optional)
```

### Environment Variables

**API Worker** (`wrangler.toml` or Cloudflare dashboard):
```toml
[vars]
ALLOWED_ORIGINS = "https://app.cognomega.com,https://www.cognomega.com,..."
ISSUER = "https://api.cognomega.com"
JWT_TTL_SEC = "3600"
KID = "k1"
PREFERRED_PROVIDER = "groq,cfai,openai"
GROQ_MODEL = "llama-3.1-8b-instant"
CF_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct"
OPENAI_MODEL = "gpt-4o-mini"
CREDIT_PER_1K = "0.05"
MAX_UPLOAD_BYTES = "10485760"
```

**Frontend/Builder** (Cloudflare Pages):
```
VITE_API_BASE=https://api.cognomega.com
VITE_BUILDER_BASE=https://builder.cognomega.com
VITE_TURNSTILE_SITE_KEY=<site-key>
```

### Bindings

**API Worker Bindings**:
- `AI` - Workers AI binding
- `KEYS` - KV namespace for JWKS
- `KV_BILLING` - KV namespace for billing data
- `KV_PREFS` - KV namespace for user preferences
- `R2_UPLOADS` - R2 bucket for uploads
- `R2` - R2 bucket (legacy/optional)

Configured in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KEYS"
id = "your-kv-id"

[[r2_buckets]]
binding = "R2_UPLOADS"
bucket_name = "cognomega-uploads"

[ai]
binding = "AI"
```

## Cloudflare Pages Configuration

### Project Settings

**Frontend Project**:
- **Name**: `cognomega-frontend`
- **Production Branch**: `main`
- **Build Command**: `pnpm build`
- **Build Output**: `packages/frontend/dist`
- **Node Version**: 20
- **Custom Domain**: `app.cognomega.com`

**Builder Project**:
- **Name**: `cognomega-builder`
- **Production Branch**: `main`
- **Build Command**: `pnpm build`
- **Build Output**: `packages/frontend/dist`
- **Node Version**: 20
- **Custom Domain**: `builder.cognomega.com`

### Pages Functions

Located in `packages/frontend/functions/`:
- Auto-deployed with Pages
- Edge functions for auth, etc.

## Rollback Procedures

### Automatic Rollback

If smoke tests fail:
1. Deployment marked as failed
2. Previous version remains active
3. Alerts sent to team
4. Manual intervention required

### Manual Rollback

#### API (Workers)

```powershell
# List deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback <deployment-id>

# Or via Cloudflare dashboard:
# Workers > cognomega-api > Deployments > Select previous > Rollback
```

#### Frontend/Builder (Pages)

Via Cloudflare dashboard:
1. Pages > Select project
2. Deployments tab
3. Find last working deployment
4. Click "Rollback to this deployment"

Or redeploy from specific commit:
```powershell
git checkout <working-commit>
wrangler pages deploy packages/frontend/dist --project-name=cognomega-frontend
```

## Monitoring & Alerts

### Deployment Notifications

Configure in `.github/workflows/*.yml`:

```yaml
- name: Notify on failure
  if: failure()
  uses: some/notification-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    message: 'Deployment failed!'
```

### Health Checks

**API Health**: `GET /ready`
```json
{
  "ok": true,
  "provider": "groq",
  "model": "llama-3.1-8b-instant"
}
```

**Frontend Health**: HTTP 200 on root path

### Cloudflare Analytics

Monitor via Cloudflare dashboard:
- Request volume
- Error rates
- Latency (p50, p95, p99)
- Cache hit rates
- Bandwidth usage

## Build Optimization

### Caching Strategy

**Node Modules Cache**:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'
    cache-dependency-path: 'pnpm-lock.yaml'
```

**Build Cache** (Pages):
- Automatic caching of `node_modules`
- Incremental builds when possible

### Parallel Jobs

Where possible, run jobs in parallel:
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    # ...
  
  typecheck:
    runs-on: ubuntu-latest
    # ...
  
  test:
    runs-on: ubuntu-latest
    # ...
```

## Security Considerations

### Secret Management

- **Never commit secrets** to repository
- Use GitHub Secrets for CI/CD
- Use Cloudflare secret storage for Workers
- Rotate secrets regularly

### Permissions

GitHub Actions workflows use:
```yaml
permissions:
  contents: read
  deployments: write
```

Minimal permissions for security.

### Audit Trail

All deployments logged:
- GitHub Actions run history
- Cloudflare deployment logs
- Artifact uploads (proofs)

## Troubleshooting

### Deployment Fails

**Check**:
1. GitHub Actions logs
2. Cloudflare dashboard logs
3. Wrangler output
4. Syntax errors in workflow files

**Common Issues**:
- Missing secrets
- Invalid API tokens
- Path filters incorrect
- Build output path wrong
- Dependencies not installed

### Smoke Tests Fail

**Check**:
1. API endpoint accessibility
2. CORS configuration
3. Environment variables
4. Secret availability
5. KV/R2 bindings

### Build Timeout

**Solutions**:
- Increase `timeout-minutes`
- Optimize dependencies
- Use build cache
- Parallel jobs

### Pages Deployment Issues

**Common Issues**:
- Build command incorrect
- Output directory wrong
- Environment variables missing
- Node version mismatch

**Debugging**:
```powershell
# Test build locally
cd packages/frontend
pnpm build

# Verify output
ls -la dist/

# Check build logs in Pages dashboard
```

## Best Practices

1. **Always review changes** before merging to main
2. **Monitor deployments** during rollout
3. **Run smoke tests** after deployment
4. **Keep secrets secure** and rotated
5. **Use path filters** to avoid unnecessary deploys
6. **Version lock dependencies** for reproducibility
7. **Test locally** before pushing
8. **Document changes** in commit messages
9. **Monitor metrics** post-deployment
10. **Have rollback plan** ready

## Workflow Maintenance

### Updating Workflows

1. Edit workflow file in `.github/workflows/`
2. Test changes in feature branch
3. Review workflow execution
4. Merge when validated

### Adding New Workflows

1. Create new YAML file
2. Define triggers, jobs, steps
3. Add required secrets
4. Test thoroughly
5. Document in this file

### Deprecating Workflows

1. Comment out triggers
2. Add deprecation notice
3. Monitor for usage
4. Remove after grace period

---

*See also*:
- [Development Workflow](./development-workflow.md)
- [OPS.md](../../OPS.md)
- [Best Practices](./best-practices.md)
