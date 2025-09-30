# Cognomega — Non-Negotiable Rules (Source of Truth)

> These rules govern **all conversations, decisions, code, docs, and workflows** between us until v1 is live in production. They apply every day, in every thread, not just for document creation.

---

## 0) Scope & Precedence
- This file is the **binding authority** for how we work until v1 ships.
- If any chat, script, doc, PR, or code conflicts with this file, **this file wins**.
- Changes to these rules require your explicit approval and must be committed via GitHub.

---

## 1) Delivery Discipline (One Step, No Drift)
- **One step of one task at a time.** I will not jump ahead.
- I will **wait for your confirmation** (“CONFIRMED”) before the next step.
- I will **verify first, change later**. No speculative edits.

---

## 2) Preserve Everything from v0 (No Feature Drops)
- **Do not drop** existing features, files, logic, routes, UX, AI/voice integrations, “8 layers of super intelligence,” or *any* v0 asset (all 239 files).
- When updating any file:
  - Keep behavior backward-compatible.
  - Send **full, production-grade replacements** (no diffs, no snippets) and **always include full file paths**.
  - **No trimmed or truncated sections.**
- If something *must* change, I will **call it out explicitly** and seek your approval first.

---

## 3) Quality Bar (No Hacks, No Shims, No Temp Fixes)
- **No hacks, no shims, no guesswork, no temporary fixes.**
- **Root-cause** every issue; apply **permanent, production solutions** only.
- **No monkey-patching / R&D patching.**
- If I can’t meet the bar in one pass, I’ll stop and request a decision.

---

## 4) Deployment & Environments (GitHub-Only)
- **GitHub-only deploys** to avoid drift. No direct `wrangler publish` to prod.
- All environment changes (Workers bindings, secrets, routes) are tracked via repo config + CI.
- Until v1 ships:
  - Keep **environment locked** to the decided policy (e.g., local-only options) as approved.
  - **No SLA risks** added (providers/tools that can break availability are excluded unless we add proper isolation and fallback).

---

## 5) Tooling & Commands (Windows PowerShell First)
- All commands/scripts I send are **PowerShell on Windows**.
- **No bash** in instructions.
- **No BOM** in files.

---

## 6) Security Guardrails
- **No `gen-jwt` / `genJwt`** helpers; only sanctioned token issuance paths.
- Provider allow-list must be enforced in the API (e.g., `ALLOW_PROVIDERS` guard).
- Admin endpoints are **never public**; keys only via headers and CI secrets.

---

## 7) API/Code Update Rules
- Keep **public endpoints stable** unless you approve a change.
- If we add internals (e.g., admin-only routes, local embeddings/reranker paths), they **remain non-public** and **header-gated**.
- **No breaking changes** without an explicit migration plan and your sign-off.

---

## 8) Observability & Consistency
- Every response must include/propagate `X-Request-Id` and expose billing/usage headers.
- CORS: **single implementation**, env-driven; no duplicates.
- **Zero configuration drift**: code, infra, docs must match.

---

## 9) Documentation Policy (Six Documents Max Until v1)
We will maintain exactly **six** documents as the living source of truth for v1; all other docs/scripts are linked *from these six*:

1. **`README.md` (root)** — Product overview, quick start, public endpoints, how to use Cognomega.
2. **`docs/OPS.md`** — Operations runbook (deploy, rollback, secrets, CORS, health, admin endpoints).
3. **`docs/ARCHITECTURE.md`** — System design, components, data flow, “8 layers of super intelligence,” and omni intelligence.
4. **`docs/ENGINEERING.md`** — Coding standards, module map, interfaces, error handling, testing approach.
5. **`docs/SECURITY.md`** — Provider allow-list policy, auth/JWKS, admin access, secrets, isolation, SLA posture.
6. **`docs/PRODUCT.md`** — Features/UX, voice assistant & integrations, builder flow, pricing/tiers roadmap.

> We **merge all existing documents** into these six (linking any external scripts/notes inside). We can refactor later **after v1**.

---

## 10) Work Intake & Task Flow
- I will **list any other files that need edits up front** before changing a file.
- Each step includes **acceptance criteria** and a **PowerShell test** when applicable.
- **No rework**: design for permanence; if a change risks rework, I’ll pause and request a decision.

---

## 11) Cost & SLA
- Prefer **FOSS/local** where performance & quality meet or exceed current outputs.
- Avoid tools that can **breach SLA** unless fenced with fallback and isolation.
- Any cost-bearing decision is **explicitly surfaced** for your approval.

---

## 12) Consistency & Anti-Drift
- **Every working code and feature must go to production** via GitHub CI once accepted.
- I will **validate existing files, code, infrastructure** for drift **before** edits.
- I will **not proceed to the next step** without your explicit confirmation (“CONFIRMED”).

---

## 13) Communication Protocol
- I will keep replies **concise and production-grade**.
- I will not ask speculative questions; if info is missing but the task is doable, I will **make the safest minimal change** and **state the assumptions** for your confirmation.
- You can stop me at any time with “PAUSE”; I will wait for “RESUME”.

---

## 14) Acceptance Checklist (per step)
- [ ] Full file paths provided.
- [ ] Full, untrimmed files (no diffs/snippets).
- [ ] PowerShell commands only (if any).
- [ ] No feature drops; backward compatibility validated.
- [ ] Security & CORS intact; no public exposure added.
- [ ] GitHub-only deployment path unaffected.
- [ ] Drift check done; notes included if needed.

