# CI/CD Quick Reference

Quick reference card for developers working with Cognomega Edge CI/CD.

## Common Commands

```bash
# Run checks locally before pushing
pnpm install --frozen-lockfile
pnpm run check              # TypeScript type checking
pnpm run build             # Build all packages
pnpm test                  # Run unit tests

# Trigger workflows manually
gh workflow run deploy.yml
gh workflow run test.yml --ref feat/my-branch
gh workflow run release.yml -f release_type=patch

# View workflow status
gh run list
gh run view <run-id>
gh run watch              # Watch the latest run

# Download artifacts
gh run download <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning:

```bash
# Features (triggers minor release)
git commit -m "feat: add user authentication"
git commit -m "feat(api): add new endpoint for billing"

# Bug fixes (triggers patch release)
git commit -m "fix: resolve memory leak in worker"
git commit -m "fix(ui): correct button alignment"

# Other types (no release)
git commit -m "docs: update API documentation"
git commit -m "chore: update dependencies"
git commit -m "refactor: simplify auth logic"
git commit -m "test: add unit tests for billing"
git commit -m "style: format code with prettier"
git commit -m "perf: optimize database queries"

# Breaking changes (triggers major release)
git commit -m "feat!: redesign API authentication"
git commit -m "feat: redesign API\n\nBREAKING CHANGE: auth tokens now use RS256"
```

## Workflow Triggers

| Workflow | PR | Push | Schedule | Manual |
|----------|-----|------|----------|--------|
| ci-full.yml | ✅ | ✅ | - | ✅ |
| test.yml | ✅ | ✅ | - | ✅ |
| lint.yml | ✅ | ✅ | - | ✅ |
| format.yml | ✅ | ✅ | - | ✅ |
| security.yml | ✅ | ✅ | Weekly | ✅ |
| preview.yml | ✅ | - | - | - |
| deploy*.yml | - | ✅ (paths) | - | ✅ |
| uptime.yml | - | - | Every 5 min | ✅ |
| release.yml | - | ✅ (auto) | - | ✅ (manual) |

## PR Checklist

Before opening a PR:

- [ ] **Commit messages** follow conventional commits format
- [ ] **Tests pass** locally: `pnpm test`
- [ ] **Types check**: `pnpm run check`
- [ ] **Build succeeds**: `pnpm run build`
- [ ] **Code formatted**: Auto-formatted by Prettier on PR
- [ ] **Bundle size** acceptable (check PR comment)
- [ ] **Documentation** updated if needed
- [ ] **Breaking changes** clearly documented

After opening a PR:

- [ ] All **CI checks pass** (green checkmarks)
- [ ] **Preview deployment** successful
- [ ] **Bundle size** within limits (≤50KB)
- [ ] **Security scans** clean (no high/critical issues)
- [ ] **Code review** approved
- [ ] **PR description** complete with checklist

## Required Status Checks

These must pass before merging:

1. ✅ **ci-full / CI Complete** - Full CI pipeline
2. ✅ **security / Secrets Scanning** - No secrets leaked
3. ✅ **lint / ESLint Check** - Code quality passes
4. ✅ **test / Unit Tests** - All tests pass

## Deployment Paths

Changes to these paths trigger automatic deployment:

| Path | Workflow | Target |
|------|----------|--------|
| `packages/api/**` | deploy-api.yml | Cloudflare Workers |
| `packages/frontend/**` | deploy-frontend.yml | Cloudflare Pages |
| `packages/builder/**` | deploy-builder.yml | Cloudflare Pages |

## Preview URLs

Preview deployments are automatically created for PRs:

- **Cloudflare Pages**: Always enabled
- **Vercel**: Enabled if `ENABLE_VERCEL_PREVIEW=true`

URLs are posted as PR comments within 5-10 minutes.

## Bundle Size Limits

| Package | Gzipped Limit | Warning Threshold |
|---------|--------------|-------------------|
| Frontend | 50KB | 45KB |
| API Worker | 1MB | 900KB |

Exceeding limits fails the build. Optimize or adjust threshold in `cost-control.yml`.

## Security Scanning

### What's Scanned

- **Secrets**: Gitleaks checks for API keys, tokens, passwords
- **Dependencies**: Snyk checks for vulnerabilities
- **Code**: CodeQL analyzes for security issues
- **Licenses**: Ensures only approved licenses

### False Positives

Add to `.gitleaksignore`:
```
docs/example.md:generic-api-key:abc123
```

### Approved Licenses

- MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0

### Blocked Licenses

- GPL-2.0, GPL-3.0, AGPL-3.0

## Troubleshooting

### "Workflow permission error"

```bash
# Fix: Settings → Actions → General → Workflow permissions
# Select: "Read and write permissions"
```

### "Cache miss - slow CI"

```bash
# Dependencies changed, cache invalidated
# Wait for new cache to be created (next run will be faster)
```

### "Bundle size exceeded"

```bash
# 1. Check bundle analysis in PR comment
# 2. Identify large dependencies
# 3. Use dynamic imports: import('module')
# 4. Remove unused code
# 5. Or adjust threshold (last resort)
```

### "Tests fail in CI but pass locally"

```bash
# Run in CI mode locally:
CI=true pnpm test

# Common causes:
# - Hardcoded file paths
# - Timezone differences
# - Missing environment variables
# - Race conditions
```

### "Deployment failed"

```bash
# Check Cloudflare dashboard for errors
# Verify secrets are set correctly
# Check worker logs: gh run view <run-id>
# Review smoke test results
```

### "Preview URL not working"

```bash
# Wait 2-3 minutes for DNS propagation
# Check Cloudflare Pages deployment logs
# Verify build succeeded: dist/ directory exists
# Check CORS if API calls fail
```

## Release Process

### Automatic Release (Recommended)

1. Merge PR with `feat:` or `fix:` commits
2. Workflow automatically:
   - Bumps version (based on commit types)
   - Generates changelog
   - Creates GitHub release
   - Publishes release notes

### Manual Release

```bash
# Trigger release workflow
gh workflow run release.yml -f release_type=patch   # 1.0.0 → 1.0.1
gh workflow run release.yml -f release_type=minor   # 1.0.0 → 1.1.0
gh workflow run release.yml -f release_type=major   # 1.0.0 → 2.0.0
```

## Health Checks

Production health is monitored every 5 minutes:

- ✅ `/ready` endpoint (200 OK)
- ✅ CORS preflight (OPTIONS)
- ✅ JWKS availability
- ✅ Guest JWT generation

Failed checks trigger GitHub notifications.

## Useful GitHub Paths

- **Actions Dashboard**: https://github.com/Bharath-kolekar/cognomega-edge/actions
- **Security Alerts**: https://github.com/Bharath-kolekar/cognomega-edge/security
- **Dependabot**: https://github.com/Bharath-kolekar/cognomega-edge/security/dependabot
- **Secrets**: https://github.com/Bharath-kolekar/cognomega-edge/settings/secrets/actions
- **Branch Protection**: https://github.com/Bharath-kolekar/cognomega-edge/settings/branches

## Support

- **Workflow Issues**: Check [ci-cd.md](./ci-cd.md)
- **Setup Help**: Check [ci-cd-setup.md](./ci-cd-setup.md)
- **Architecture**: Check [ci-cd-architecture.md](./ci-cd-architecture.md)
- **GitHub Actions Docs**: https://docs.github.com/en/actions

## Environment Variables

### Required (in GitHub Secrets)

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

### Optional (in GitHub Secrets)

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VERCEL_PRODUCTION_URL` - Production URL for verification
- `SNYK_TOKEN` - Snyk API token
- `SMOKE_EMAIL` - Email for smoke tests

### Optional (in GitHub Variables)

- `ENABLE_VERCEL_PREVIEW` - Set to `true` to enable Vercel previews
- `ENABLE_VERCEL_DEPLOY` - Set to `true` to enable Vercel production

## Performance Tips

1. **Use caching**: Dependencies cached automatically
2. **Parallel tests**: Write independent tests
3. **Incremental builds**: Only changed files rebuilt
4. **Path filters**: Workflows run only when needed
5. **Cancel in-progress**: Old runs cancelled on new push

## Best Practices

✅ **DO:**
- Commit frequently with descriptive messages
- Run checks locally before pushing
- Keep PRs small and focused
- Update docs with code changes
- Review security alerts promptly
- Monitor bundle size trends

❌ **DON'T:**
- Skip CI checks (can't merge anyway)
- Commit secrets or credentials
- Make large PRs (>500 lines)
- Bypass required status checks
- Ignore security warnings
- Push directly to main (protected)

---

**Last updated**: 2025-09-30
**Version**: 1.0.0
