# CI/CD Setup Guide

This guide walks through setting up and configuring the CI/CD pipelines for Cognomega Edge.

## Quick Start

### Prerequisites
- GitHub repository with appropriate permissions
- Cloudflare account with API access
- (Optional) Vercel account for multi-cloud deployment
- (Optional) Snyk account for enhanced security scanning

### Required Secrets Setup

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

#### 1. Cloudflare Secrets (Required)

```bash
# Get your Cloudflare API Token
# 1. Go to https://dash.cloudflare.com/profile/api-tokens
# 2. Create token with "Edit Cloudflare Workers" template
# 3. Add the token as CLOUDFLARE_API_TOKEN

# Get your Account ID
# 1. Go to https://dash.cloudflare.com/
# 2. Select your domain
# 3. Copy the Account ID from the right sidebar
# 4. Add as CLOUDFLARE_ACCOUNT_ID
```

Add to GitHub Secrets:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

#### 2. Vercel Secrets (Optional - for multi-cloud)

```bash
# Get Vercel Token
# 1. Go to https://vercel.com/account/tokens
# 2. Create new token
# 3. Add as VERCEL_TOKEN

# Get Project IDs
# Run: npx vercel link
# Then: cat .vercel/project.json
```

Add to GitHub Secrets:
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `VERCEL_PRODUCTION_URL`: Production URL (e.g., https://app.cognomega.com)

Add to GitHub Variables:
- `ENABLE_VERCEL_PREVIEW`: Set to `true` to enable preview deployments
- `ENABLE_VERCEL_DEPLOY`: Set to `true` to enable production deployments

#### 3. Security Scanning (Optional)

```bash
# Snyk Token
# 1. Sign up at https://snyk.io
# 2. Go to Account Settings → API Token
# 3. Add as SNYK_TOKEN
```

Add to GitHub Secrets:
- `SNYK_TOKEN`: Snyk API token
- `GITLEAKS_LICENSE`: Gitleaks license key (if you have one)

#### 4. Testing (Optional)

Add to GitHub Secrets:
- `SMOKE_EMAIL`: Email address for post-deploy smoke tests

### Branch Protection Setup

1. Go to Settings → Branches → Branch protection rules
2. Add rule for `main` branch

Recommended settings:
```yaml
Branch name pattern: main

✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale pull request approvals when new commits are pushed
  
✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  
  Required status checks:
  - ci-full / CI Complete
  - security / Secrets Scanning
  - lint / ESLint Check
  - test / Unit Tests
  
✅ Require conversation resolution before merging
✅ Do not allow bypassing the above settings
```

## Workflow Configuration

### Enable/Disable Workflows

#### Disable Vercel Deployment
If you don't want Vercel deployment, the workflows will automatically skip when the variables are not set.

#### Adjust Schedule Triggers

Edit `.github/workflows/uptime.yml` to change health check frequency:
```yaml
on:
  schedule:
    - cron: "*/5 * * * *"  # Every 5 minutes (default)
    # Change to "*/15 * * * *" for every 15 minutes
```

Edit `.github/workflows/nightly-probes.yml` for comprehensive checks:
```yaml
on:
  schedule:
    - cron: "0 2 * * *"  # 2 AM UTC daily (default)
```

### Customize Bundle Size Limits

Edit `.github/workflows/cost-control.yml`:
```yaml
threshold=51200  # 50KB in bytes
# Change to your desired limit
```

### Customize License Compliance

Edit `.github/workflows/compliance.yml`:
```javascript
const approved = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0'];
// Add or remove approved licenses
```

Also in `compliance.yml` dependency review:
```yaml
- name: Dependency Review
  uses: actions/dependency-review-action@v4
  with:
    fail-on-severity: moderate  # Change to: low, moderate, high, critical
    deny-licenses: GPL-2.0, GPL-3.0, AGPL-3.0  # Add licenses to block
```

## Testing the Setup

### 1. Test Workflows Manually

Go to Actions tab and manually trigger workflows:

1. **Test CI Pipeline**
   - Go to Actions → "Full CI Pipeline" → "Run workflow"
   - Select branch: `main`
   - Click "Run workflow"

2. **Test Deployment** (only if you have proper credentials)
   - Go to Actions → "Deploy" → "Run workflow"
   - Select branch: `main`
   - Click "Run workflow"

3. **Test Security Scanning**
   - Go to Actions → "Security Scans" → "Run workflow"
   - Select branch: `main`
   - Click "Run workflow"

### 2. Test with a Pull Request

Create a test branch and PR:

```bash
git checkout -b test/ci-cd-setup
echo "# Test PR" > test.md
git add test.md
git commit -m "test: verify CI/CD workflows"
git push origin test/ci-cd-setup
```

Open a PR and observe:
- ✅ All status checks should run
- ✅ Preview deployment should be created
- ✅ Bundle size report should be posted
- ✅ Security scans should complete

### 3. Verify Health Checks

Check uptime monitoring:
- Go to Actions → "Uptime"
- Should run every 5 minutes
- Check recent runs for green checkmarks

## Troubleshooting

### Common Issues

#### 1. Workflow Permission Errors

**Error**: "Resource not accessible by integration"

**Solution**: 
1. Go to Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"

#### 2. Cloudflare Deployment Fails

**Error**: "Authentication error" or "Invalid token"

**Solution**:
```bash
# Verify your token has the correct permissions
# Required scopes:
# - Account:Workers Scripts:Edit
# - Account:Workers Routes:Edit
# - Zone:Workers Routes:Edit

# Check token in Cloudflare dashboard
# https://dash.cloudflare.com/profile/api-tokens
```

#### 3. Bundle Size Check Fails

**Error**: "Bundle size exceeds 50KB threshold"

**Solution**:
1. Review bundle analysis in PR comments
2. Optimize imports (use tree-shaking)
3. Use dynamic imports for large dependencies
4. Or adjust threshold in `cost-control.yml`

#### 4. Test Failures

**Error**: Tests fail in CI but pass locally

**Solution**:
```bash
# Ensure dependencies are locked
pnpm install --frozen-lockfile

# Run tests locally in CI mode
CI=true pnpm test

# Check for environment-specific issues
# (file paths, timezones, etc.)
```

#### 5. Security Scan False Positives

**Error**: Gitleaks detects false positive

**Solution**: Create `.gitleaksignore` in repository root:
```
# Format: filepath:ruleId:hash
docs/example.md:generic-api-key:abc123def456
```

#### 6. Preview Deployment Issues

**Error**: Preview URL not working

**Solution**:
1. Check Cloudflare Pages deployment logs
2. Verify build command succeeds: `pnpm run build`
3. Check dist directory exists: `packages/frontend/dist`
4. Verify API token has Pages permissions

## Monitoring and Maintenance

### View Workflow Status

Dashboard locations:
- **Actions tab**: All workflow runs
- **Pull Requests**: Status checks on each PR
- **Settings → Branches**: Branch protection status

### Review Reports

Artifacts are available for 7-30 days:
- Test results and coverage
- Bundle size analysis
- Security scan reports
- License compliance reports
- Cost estimates

Access via:
1. Actions tab → Select workflow run → Artifacts section

### Update Dependencies

Dependabot automatically creates PRs weekly:
1. Review the PR
2. Check CI status
3. Merge if all checks pass

Manual update:
```bash
# Update all dependencies
pnpm update --latest

# Update specific package
pnpm update package-name --latest

# Test changes
pnpm install --frozen-lockfile
pnpm run build
pnpm test
```

### Rotate Secrets

Quarterly secret rotation:
1. Generate new API tokens/keys
2. Update GitHub Secrets
3. Test with workflow dispatch
4. Delete old tokens after verification

## Advanced Configuration

### Custom Workflows

Add custom workflow in `.github/workflows/`:

```yaml
name: Custom Check
on:
  pull_request:
    branches: [main]

jobs:
  custom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Custom check
        run: |
          # Your custom logic here
          echo "Running custom checks..."
```

### Conditional Workflows

Run workflows only on specific paths:

```yaml
on:
  push:
    paths:
      - 'packages/frontend/**'
      - '!**/*.md'  # Exclude markdown files
```

### Matrix Builds

Test across multiple Node versions:

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

### Reusable Workflows

Create reusable workflows:

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test
on:
  workflow_call:
    inputs:
      package:
        required: true
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test ${{ inputs.package }}
        run: pnpm --filter ${{ inputs.package }} test
```

Use it:
```yaml
jobs:
  test-frontend:
    uses: ./.github/workflows/reusable-test.yml
    with:
      package: frontend
```

## Performance Optimization

### Caching

Workflows already use caching for:
- pnpm dependencies (`cache: 'pnpm'`)
- Build artifacts
- Playwright browsers

### Concurrency Control

Prevent redundant runs:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Timeout Configuration

Adjust timeouts as needed:
```yaml
jobs:
  deploy:
    timeout-minutes: 20  # Default: 360 (6 hours)
```

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Use least privilege** - Grant minimal permissions to tokens
3. **Review Dependabot PRs** - Check for breaking changes
4. **Monitor security alerts** - Enable Dependabot security updates
5. **Rotate secrets quarterly** - Update API tokens regularly
6. **Enable 2FA** - On GitHub and all service accounts
7. **Review workflow logs** - Check for suspicious activity

## Support and Resources

### Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Vercel Docs](https://vercel.com/docs)

### Getting Help
- Check workflow logs in Actions tab
- Review error messages in PR comments
- Consult this setup guide
- Check main CI/CD docs: `docs/ci-cd.md`

### Common Commands

```bash
# Local development
pnpm install
pnpm run build
pnpm test
pnpm run check  # TypeScript checking

# Trigger specific workflow
gh workflow run deploy.yml
gh workflow run test.yml --ref feat/my-branch

# View workflow status
gh run list
gh run view <run-id>

# Download artifacts
gh run download <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

## Migration from Old CI/CD

If migrating from a previous CI/CD setup:

1. **Backup existing workflows**
   ```bash
   mkdir -p .github/workflows-backup
   cp .github/workflows/*.yml .github/workflows-backup/
   ```

2. **Test new workflows on feature branch**
   ```bash
   git checkout -b feat/new-cicd
   # Add new workflows
   git push origin feat/new-cicd
   # Open PR and verify all checks pass
   ```

3. **Gradually migrate**
   - Enable new workflows one at a time
   - Monitor for issues
   - Disable old workflows after verification

4. **Clean up**
   - Remove old workflow files
   - Update documentation
   - Archive old deployment logs

## Appendix: Complete Workflow List

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| ci.yml | Basic type-check, build | PR, Push to main |
| ci-full.yml | Full CI pipeline | PR, Push to main |
| test.yml | Unit & E2E tests | PR, Push to main |
| lint.yml | Code quality checks | PR, Push to main |
| format.yml | Code formatting | PR, Push to main |
| security.yml | Security scanning | PR, Push, Weekly |
| compliance.yml | License & policy | PR, Push, Weekly |
| deploy.yml | Production deploy (CF) | Push to main, Manual |
| deploy-api.yml | API deploy | Push to main, Manual |
| deploy-frontend.yml | Frontend deploy (CF) | Push to main, Manual |
| deploy-builder.yml | Builder deploy | Push to main, Manual |
| deploy-vercel.yml | Vercel deploy | Push to main, Manual |
| preview.yml | PR preview deploys | Pull request |
| release.yml | Release automation | Push to main, Manual |
| docs.yml | Documentation checks | PR (docs/), Push |
| cost-control.yml | Bundle size monitoring | PR, Push to main |
| uptime.yml | Health checks | Every 5 minutes |
| nightly-probes.yml | Daily smoke tests | Daily 2 AM UTC |
| proofs-gate.yml | Contract validation | Pull request |
| codex-commands.yml | Issue automation | Issue comment |

---

Last updated: 2025-09-30
