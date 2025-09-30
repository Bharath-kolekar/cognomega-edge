# Development Workflow

## Overview

This document describes the complete development workflow for contributing to Cognomega Edge, from environment setup to deploying code to production.

## Prerequisites

### Required Software (Windows)

- **Node.js**: 20.x or 22.x (LTS)
- **pnpm**: 10.15.1 or later
- **PowerShell**: 7.x (recommended)
- **Git**: Latest version
- **Cloudflare Wrangler**: 4.40+ (installed via npm)

### Optional Software

- **Docker Desktop**: For local inference service
- **VS Code**: Recommended IDE
- **GitHub CLI**: For easier PR management

### Installation Commands (PowerShell)

```powershell
# Install Node.js (via winget)
winget install OpenJS.NodeJS.LTS

# Install pnpm globally
npm install -g pnpm@10.15.1

# Install Wrangler CLI
npm install -g wrangler@4

# Verify installations
node --version
pnpm --version
wrangler --version
```

## Initial Setup

### 1. Clone Repository

```powershell
# Clone from GitHub
Set-Location C:\dev
git clone https://github.com/Bharath-kolekar/cognomega-edge.git
Set-Location C:\dev\cognomega-edge

# Verify you're on main branch
git branch
```

### 2. Install Dependencies

```powershell
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### 3. Configure API Environment

Create `.dev.vars` file in `packages/api/`:

```powershell
# Navigate to API package
Set-Location packages\api

# Create .dev.vars file
@"
# Core CORS & JWT
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
ISSUER=http://localhost:8787
JWT_TTL_SEC=3600
KID=k1

# Billing
CREDIT_PER_1K=0.05
WARN_CREDITS=5

# Providers (add your keys)
PREFERRED_PROVIDER=groq,cfai
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE=https://api.groq.com/openai/v1

# Cloudflare AI
CF_AI_MODEL=@cf/meta/llama-3.1-8b-instruct

# Optional: OpenAI
# OPENAI_API_KEY=your_openai_key_here
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_BASE=https://api.openai.com/v1

# Admin
ADMIN_API_KEY=dev_admin_key_12345
"@ | Out-File -FilePath .dev.vars -Encoding UTF8

# Return to root
Set-Location ..\..
```

### 4. Generate JWT Keys (Development)

```powershell
# Navigate to API package
Set-Location packages\api

# Generate RS256 key pair using Node.js
node -e @"
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log('Private Key:\n', privateKey);
console.log('\nPublic Key:\n', publicKey);
"@

# Copy private key and add to .dev.vars as PRIVATE_KEY_PEM
# (In production, use secure secret management)

Set-Location ..\..
```

## Development Commands

### Running Locally

#### Start API (Cloudflare Worker)

```powershell
# From root directory
pnpm --filter api dev

# Or navigate to API package
Set-Location packages\api
pnpm dev

# API will be available at http://localhost:8787
```

#### Start Frontend

```powershell
# From root directory
pnpm --filter frontend dev

# Or navigate to frontend package
Set-Location packages\frontend
pnpm dev

# Frontend will be available at http://localhost:5174
```

#### Run Both Simultaneously

Open two PowerShell terminals:

**Terminal 1 (API)**:
```powershell
pnpm --filter api dev
```

**Terminal 2 (Frontend)**:
```powershell
pnpm --filter frontend dev
```

### Building for Production

#### Build All Packages

```powershell
# From root directory
pnpm install
pnpm --filter api build
pnpm --filter frontend build
pnpm --filter si-core build
```

#### Build Individual Package

```powershell
# API (no explicit build, Wrangler handles it)
Set-Location packages\api
# No build step needed

# Frontend
Set-Location packages\frontend
pnpm build

# si-core
Set-Location packages\si-core
pnpm build
```

### Testing

#### Run All Tests

```powershell
# From root directory
pnpm test
```

#### Run Package-Specific Tests

```powershell
# Frontend tests
pnpm --filter frontend test

# API tests
pnpm --filter api test

# si-core tests
pnpm --filter si-core test
```

#### E2E Tests (Playwright)

```powershell
# Install Playwright browsers (first time only)
pnpm --filter frontend exec playwright install

# Run E2E tests
pnpm --filter frontend test:e2e
```

### Linting & Type Checking

#### Lint All Packages

```powershell
# From root directory
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

#### Type Check

```powershell
# Check all TypeScript files
pnpm typecheck

# Or per package
pnpm --filter frontend typecheck
pnpm --filter api typecheck
pnpm --filter si-core typecheck
```

## Branching Strategy

### Branch Types

1. **main** - Production-ready code
2. **feature/** - New features (`feature/add-voice-commands`)
3. **fix/** - Bug fixes (`fix/cors-headers`)
4. **refactor/** - Code refactoring (`refactor/agent-architecture`)
5. **docs/** - Documentation updates (`docs/update-readme`)
6. **chore/** - Maintenance tasks (`chore/upgrade-dependencies`)

### Creating a New Branch

```powershell
# Update main branch
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/my-new-feature

# Push branch to GitHub
git push -u origin feature/my-new-feature
```

### Branch Naming Convention

Format: `<type>/<brief-description>`

**Examples**:
- `feature/multi-agent-chat`
- `fix/billing-calculation`
- `refactor/api-routes`
- `docs/sot-documentation`

## Making Changes

### Code Changes Workflow

1. **Create feature branch** (as shown above)
2. **Make changes** in your editor
3. **Test changes** locally
4. **Commit changes** with clear messages
5. **Push to GitHub**
6. **Create Pull Request**

### Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```
feat(api): add voice preferences endpoint

Add GET/PUT endpoints for user voice preferences.
Stored in KV_PREFS namespace with TTL.

Closes #123
```

```
fix(frontend): correct CORS headers in builder

Update ALLOWED_ORIGINS to include builder subdomain.

Fixes #456
```

### Committing Changes

```powershell
# Stage changes
git add .

# Or stage specific files
git add packages/api/src/index.ts

# Commit with message
git commit -m "feat(api): add new endpoint"

# Push to GitHub
git push origin feature/my-new-feature
```

## Adding New Packages

### Create New Package in Workspace

1. **Create directory** under `packages/`

```powershell
mkdir packages\my-new-package
Set-Location packages\my-new-package
```

2. **Initialize package.json**

```powershell
pnpm init
```

Edit `package.json`:
```json
{
  "name": "@cognomega/my-new-package",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.9.2",
    "vitest": "^1.0.0"
  }
}
```

3. **Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

4. **Create source directory**

```powershell
mkdir src
New-Item src\index.ts
```

5. **Install dependencies**

```powershell
# From root directory
Set-Location ..\..
pnpm install
```

6. **Add to documentation**

Update:
- `docs/SOT/monorepo-structure.md`
- Root `README.md` if public-facing
- This file (development-workflow.md)

## Adding New Services

### API Route/Endpoint

1. **Create route file** in `packages/api/src/routes/`

```typescript
// packages/api/src/routes/myNewRoute.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/my-endpoint', async (c) => {
  return c.json({ message: 'Hello from new endpoint' });
});

export default app;
```

2. **Mount in main API** (`packages/api/src/index.ts`)

```typescript
import myNewRoute from './routes/myNewRoute';

// ... existing code ...

app.route('/api/my-new', myNewRoute);
```

3. **Test locally**

```powershell
pnpm --filter api dev
```

```powershell
# In another terminal
curl http://localhost:8787/api/my-new/my-endpoint
```

4. **Add tests**

Create `packages/api/src/routes/myNewRoute.test.ts`

5. **Update documentation**

Update `docs/SOT/microservices.md`

### Frontend Component

1. **Create component file** in `packages/frontend/src/components/`

```tsx
// packages/frontend/src/components/MyNewComponent.tsx
import React from 'react';

interface Props {
  title: string;
}

export default function MyNewComponent({ title }: Props) {
  return (
    <div className="glass-card">
      <h2>{title}</h2>
    </div>
  );
}
```

2. **Use in page** or other component

```tsx
import MyNewComponent from './components/MyNewComponent';

function MyPage() {
  return <MyNewComponent title="Hello" />;
}
```

3. **Add tests**

Create `packages/frontend/src/components/MyNewComponent.test.tsx`

### Multi-Agent

1. **Create agent file** in `packages/si-core/src/v0/agents/`

```typescript
// packages/si-core/src/v0/agents/my-new-agent.ts
import { BaseAgent } from './base-agent';
import type { Task, TaskResult, AgentCapability } from './types';

export class MyNewAgent extends BaseAgent {
  async initialize(): Promise<void> {
    this.status = 'ready';
  }

  async execute(task: Task): Promise<TaskResult> {
    // Implementation
    return {
      success: true,
      output: {},
      metadata: {}
    };
  }

  getCapabilities(): AgentCapability[] {
    return ['my-capability'];
  }
}
```

2. **Export from index** (`packages/si-core/src/v0/agents/index.ts`)

```typescript
export { MyNewAgent } from './my-new-agent';
```

3. **Register in orchestrator** (if needed)

Update `fullstack-ai-assistant.ts` to include new agent.

4. **Update documentation**

Update `docs/SOT/microservices.md`

## Testing Changes

### Manual Testing Checklist

Before creating a PR, verify:

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Feature works in dev environment
- [ ] No console errors
- [ ] Responsive design (if frontend)
- [ ] Dark mode works (if frontend)
- [ ] API returns expected responses
- [ ] Error handling works
- [ ] Documentation updated

### Automated Testing

Run full test suite:

```powershell
# Lint
pnpm lint

# Type check
pnpm typecheck

# Unit tests
pnpm test

# E2E tests (if applicable)
pnpm --filter frontend test:e2e

# Build
pnpm --filter api build
pnpm --filter frontend build
pnpm --filter si-core build
```

## Debugging

### API Debugging

#### Using Wrangler Logs

```powershell
# View logs in real-time
wrangler tail

# With formatting
wrangler tail --format=pretty
```

#### Adding Debug Logs

```typescript
console.log('[DEBUG]', 'Variable value:', myVar);
console.error('[ERROR]', 'Something went wrong:', error);
```

### Frontend Debugging

#### React DevTools

Install React DevTools browser extension for component inspection.

#### Console Debugging

```typescript
console.log('[MyComponent]', 'State:', state);
```

#### Enable Debug Mode

```typescript
if (import.meta.env.DEV) {
  console.debug('[DEBUG]', data);
}
```

### TypeScript Debugging

Enable source maps for better debugging:

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

## Code Review Guidelines

### Before Requesting Review

1. **Self-review** your own code
2. **Run all checks** (lint, test, typecheck)
3. **Update documentation**
4. **Write clear PR description**
5. **Add screenshots** (if UI changes)
6. **Link related issues**

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No breaking changes (or documented)
- [ ] Reviewed own code
```

## Common Issues & Solutions

### Issue: pnpm install fails

**Solution**:
```powershell
# Clear cache
pnpm store prune

# Remove node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force packages\*\node_modules

# Reinstall
pnpm install
```

### Issue: Wrangler dev fails to start

**Solution**:
```powershell
# Check .dev.vars exists
Test-Path packages\api\.dev.vars

# Verify wrangler.toml configuration
Get-Content packages\api\wrangler.toml

# Clear Wrangler cache
wrangler dev --local --persist-to=./.wrangler/state
```

### Issue: TypeScript errors after pulling changes

**Solution**:
```powershell
# Rebuild dependencies
pnpm install

# Clear TypeScript cache
Remove-Item -Recurse -Force .tsbuildinfo
Remove-Item -Recurse -Force packages\*\.tsbuildinfo

# Restart TS server in VS Code
# Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### Issue: Port already in use

**Solution**:
```powershell
# Find process using port 8787
Get-NetTCPConnection -LocalPort 8787 | Select-Object OwningProcess

# Kill process
Stop-Process -Id <PID>

# Or use different port
wrangler dev --port 8788
```

## Environment-Specific Configuration

### Development (.dev.vars)

- Local API keys
- Debug flags enabled
- Relaxed CORS
- Short token TTL

### Staging (via GitHub Secrets)

- Test API keys
- Moderate logging
- Staging-specific URLs
- Standard TTL

### Production (via GitHub Secrets)

- Production API keys
- Minimal logging
- Production URLs
- Long TTL

## Best Practices

1. **Always work on a branch** - Never commit directly to main
2. **Write clear commit messages** - Follow conventional commits
3. **Test before pushing** - Run lints, tests, typecheck
4. **Keep PRs focused** - One feature/fix per PR
5. **Update documentation** - Code and docs stay in sync
6. **Handle errors** - Never swallow errors silently
7. **Use TypeScript** - Leverage type safety
8. **Follow conventions** - Consistent code style
9. **Review your own code** - Before requesting review
10. **Communicate** - Ask questions, share progress

---

*See also*:
- [Contribution Guide](./contribution-guide.md)
- [CI/CD Pipeline](./ci-cd.md)
- [Best Practices](./best-practices.md)
