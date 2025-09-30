# GitHub Copilot Instructions for Cognomega Edge

This repository contains Cognomega, a production-grade, cost-efficient, super-intelligent full-stack application maker with deep AI integration. These instructions guide GitHub Copilot when working with this codebase.

## 🎯 Project Overview

**Mission**: Ship a production-grade, cost-efficient, super-intelligent full-stack application maker with deep AI integration (chat/voice/omni), end-to-end automation, and strict GitHub-only releases — without dropping any v0 features.

**Tech Stack**:
- **API**: Cloudflare Workers (Hono framework)
- **Frontend**: Vite + React
- **Core Library**: TypeScript (shared intelligence/skills)
- **Platform**: Windows (PowerShell for scripts)
- **Deployment**: GitHub-only (no direct deploys)

## 🔒 Non-Negotiable Rules

### 1. Preserve Everything (No Feature Drops)
- **NEVER** drop existing features, files, logic, routes, UX, AI/voice integrations, or "8 layers of super intelligence"
- Keep all 239 v0 files and their functionality
- When updating files: maintain backward compatibility, send full replacements (no diffs/snippets)
- Always include full file paths
- If a change is required, explicitly state it and seek approval

### 2. Quality Bar (No Hacks, No Temporary Fixes)
- No hacks, shims, guesswork, or temporary fixes
- Root-cause every issue; apply permanent, production solutions only
- No monkey-patching or R&D patching
- If quality bar cannot be met in one pass, stop and request guidance

### 3. One Step at a Time
- Work on one step of one task at a time
- Verify first, change later (no speculative edits)
- Wait for explicit confirmation before proceeding to next step
- No assumptions; verify existing code/docs before changes

### 4. GitHub-Only Deployment
- All prod code flows via PR → main → release
- No direct `wrangler publish` to production
- All environment changes tracked via repo config + CI
- No configuration drift between code, infra, and docs

### 5. Windows PowerShell First
- All commands/scripts must be PowerShell (Windows)
- **No bash** in instructions or scripts
- **No BOM** (Byte Order Mark) in committed text files

### 6. Security Guardrails
- No `gen-jwt` or `genJwt` helpers; only sanctioned token issuance paths
- Provider allow-list must be enforced in API (`ALLOW_PROVIDERS` guard)
- Admin endpoints are **never public**; keys only via headers and CI secrets
- Keep internal/admin routes non-public and header-gated

### 7. API Stability
- Keep public endpoints stable unless explicitly approved
- No breaking changes without migration plan and sign-off
- All responses must include/propagate `X-Request-Id` and expose billing/usage headers

### 8. CORS Implementation
- Single CORS implementation, environment-driven
- No duplicate CORS logic
- Respect `ALLOWED_ORIGINS` environment variable

## 📚 Documentation Policy

The repository maintains exactly **6 canonical documents** as the source of truth:

1. **README.md** — Product overview, quick start, public endpoints
2. **OPS.md** — Operations runbook, deploy, rollback, secrets, health
3. **architecture.md** — System design, components, data flow, intelligence layers
4. **ci-cd.md** — Branch strategy, pipelines, environments, releases
5. **tasks.md** — Decisions log, tasks, status, ownership
6. **roadmap.md** — Milestones, scope, delivery targets

All other docs/scripts are referenced through these six. Maintain this structure.

## 🗂️ Repository Structure

```
cognomega-edge/
├─ packages/
│  ├─ api/          # Cloudflare Worker (Hono) — API, auth/billing, jobs, SI routes
│  ├─ frontend/     # Vite + React app (Cognomega Builder UI)
│  └─ si-core/      # Shared TypeScript library (skills/intelligence core)
├─ scripts/         # Windows PowerShell utilities
├─ .github/         # CI/CD workflows
├─ docs/SOT/        # Source of Truth documents (00-RULES.md is binding)
└─ [6 canonical docs at root/docs level]
```

## 💻 Code Quality Standards

### General Guidelines
- Send **full, production-grade file replacements** (not diffs or snippets)
- **No trimmed or truncated sections** in code
- Include complete file paths when referencing files
- Validate backward compatibility before suggesting changes

### Testing & Validation
- Validate existing files for drift before edits
- Every working code and feature must go to production via GitHub CI
- No rework: design for permanence

### Observability
- Every API response must include `X-Request-Id`
- Expose billing/usage headers (`X-Provider`, `X-Model`, `X-Tokens-In`, `X-Tokens-Out`, `X-Credits-Used`, `X-Credits-Balance`)
- Log appropriately for debugging and monitoring

## 🎨 Communication Protocol

When working with this codebase:
- Keep replies **concise and production-grade**
- Don't ask speculative questions; make the safest minimal change and state assumptions
- List all files that need edits upfront before making changes
- Include acceptance criteria and PowerShell tests when applicable
- Explicitly call out any breaking changes or feature modifications

## 🔍 Key Features to Preserve

This project includes critical features that must be maintained:
- **8 layers of super intelligence**: Core AI intelligence system
- **Omni intelligence**: Multi-modal AI capabilities
- **Voice assistant & integrations**: Voice AI, navigation, processing
- **UI/UX components**: All existing user interface elements
- **Billing & credit system**: Token tracking, usage monitoring
- **CORS & authentication**: JWT, JWKS, secure endpoints
- **AI provider integrations**: Groq, Cloudflare AI, OpenAI support

## 🚫 Anti-Patterns to Avoid

- Dropping or removing existing features without approval
- Adding temporary workarounds or "TODO" items
- Creating configuration drift between environments
- Implementing duplicate CORS or authentication logic
- Adding public access to admin/internal endpoints
- Using bash scripts instead of PowerShell
- Making breaking API changes without migration plan
- Committing files with BOM
- Creating helper utilities like `gen-jwt`

## 📋 Acceptance Checklist

Before submitting any code changes, verify:
- [ ] Full file paths provided
- [ ] Full, untrimmed files (no diffs/snippets)
- [ ] PowerShell commands only (if any)
- [ ] No feature drops; backward compatibility validated
- [ ] Security & CORS intact; no public exposure added
- [ ] GitHub-only deployment path unaffected
- [ ] Drift check done; notes included if needed

## 🔗 Additional Resources

- Full operating rules: `docs/SOT/00-RULES.md` (binding authority)
- Operations guide: `OPS.md`
- Architecture details: `architecture.md` (when available)
- CI/CD processes: `ci-cd.md` (when available)

---

**Note**: These instructions are derived from `docs/SOT/00-RULES.md`, which is the binding authority for this project. In case of any conflict, `00-RULES.md` takes precedence.
