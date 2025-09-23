# Cognomega — Tools & Technologies (Approved Stack)

> **Purpose:** Single-source list of tools we actively use (or are approved), aligned with our **Cloudflare + Neon + Cartesia** architecture and the **microservices** plan.  
> **Principles:** Cost-aware, CF‑native, OSS-first where it doesn't add risk, **GitHub-only deploys**, PowerShell ops.

---

## 1) Core Platform (kept)

| Area | Tool | Cost | Notes |
|---|---|---|---|
| Edge runtime | **Cloudflare Workers** | $ (low) | Our execution environment. Auto-scales globally. |
| Serverless KV | **Cloudflare KV** (`KEYS`, `KV_BILLING`) | $ (low) | **Source of Truth** for JWKS + credits/usage/jobs. |
| Object Storage | **Cloudflare R2** (`R2_UPLOADS`, legacy `R2`) | $ | Direct uploads; artifacts. |
| Models (default) | **Cloudflare Workers AI** | $ / free tier | Primary model path; fallbacks to Groq/OpenAI via router. |
| SQL (reporting/rollups) | **Neon Postgres** | $ / free tier | Used for rollups & analytics; **not** required for core billing. |
| Text‑to‑Speech | **Cartesia** | $ | Voice for “Voice Runbook” and voice-first UX. |

> We deliberately keep one **public route owner** (`cognomega-api`) to avoid route conflicts; internal microservices are introduced via **Service Bindings** behind the gateway (see `docs/architecture.md`).

---

## 2) Frontend (approved)

| Category | Tool | Cost | Why |
|---|---|---|---|
| UI runtime | **React 18** | Free (OSS) | Current app stack; no rework. |
| Build | **Vite** | Free (OSS) | Fast DX; Pages-compatible. |
| Language | **TypeScript** | Free (OSS) | Contracts & safer refactors. |
| Styling | **Tailwind CSS** (+ `tailwindcss-animate`) | Free (OSS) | Consistent design tokens; quick theming. |
| Components | **shadcn/ui** (on top of Radix UI) | Free (OSS) | Accessible primitives; consistent UX. |
| Icons | **Lucide React** | Free (OSS) | Lightweight, consistent icons. |
| Routing | **React Router v6** | Free (OSS) | SPA routing; Pages-friendly. |
| State (server) | **TanStack Query** | Free (OSS) | Cache/fetch/invalidations. |
| Forms | **React Hook Form** + **Zod** | Free (OSS) | Performant forms + type-safe validation. |
| Charts | **Recharts** | Free (OSS) | Usage/credit charts. |
| Dates | **date‑fns** | Free (OSS) | Pure functions, tree‑shakeable. |
| Calendar | **react-day-picker** | Free (OSS) | Scheduling UI. |
| Toasts | **sonner** | Free (OSS) | Lightweight notifications. |
| Carousel | **embla-carousel-react** | Free (OSS) | Template previews. |
| Drawer | **vaul** | Free (OSS) | Side panels/sheets. |
| Theme (optional) | **next-themes** | Free (OSS) | If already present; otherwise use Tailwind’s dark mode + CSS vars. |

**Guidelines**
- Keep bundle sizes in check; prefer dynamic imports for heavy feature areas (e.g., charts, voice).
- Follow the design system in `shadcn/ui`; avoid duplicate component libraries.

---

## 3) Backend Modules & Libraries

| Category | Tool | Cost | Notes |
|---|---|---|---|
| HTTP router | **Hono** | Free (OSS) | Small, Workers‑friendly. |
| SQL client | **@neondatabase/serverless** | Free (OSS) | When rollups/legacy endpoints need Postgres. |
| Type validation | **Zod** | Free (OSS) | Validate inbound/outbound payloads. |
| Build checks | **esbuild** (dev) | Free (OSS) | Quick TypeScript bundle sanity. |
| Testing | **Vitest** | Free (OSS) | Unit tests for handlers & utils. |
| E2E | **Playwright** | Free (OSS) | Synthetic flows against preview envs (when enabled). |

**Security & Auth**
- **RS256 JWT** (guest) via `PRIVATE_KEY_PEM` + **JWKS** served from KV (`/.well-known/jwks.json`).  
- No `genJwt` scripts; keys managed via CF Secrets; rekey with overlapping KIDs.

---

## 4) DevEx, CI/CD & Ops

| Area | Tool | Cost | Notes |
|---|---|---|---|
| Repo | **GitHub** | Free / $ | **Single deploy surface** (branch protection; required checks). |
| CI | **GitHub Actions** | Free quotas | Lint/test + route audit probes + uptime checks. |
| Lint | **ESLint** + `@typescript-eslint` | Free | Consistent code quality. |
| Format | **Prettier** | Free | Consistent formatting. |
| Docs | **Markdown** in `/docs` + `/OPS.md` | Free | Source of truth; proofs in `/ops/proofs`. |
| Probes | **PowerShell** scripts | Free | Preflight/JWKS/AI binding/guest JWT checks; produce proof files. |
| Logs | `wrangler tail` | Free | Spot‑checks; Logpush kept **off** unless needed. |

**Policies**
- **GitHub-only deploys** to `main`. No direct CF dashboard edits to routes/vars.  
- **Proofs required** for any route/DNS/CORS changes (`ops/proofs/*.txt`).  
- **PowerShell‑only** commands in docs (no bash snippets).

---

## 5) AI Providers (router order & cost posture)

| Provider | Binding/Key | Cost posture | Notes |
|---|---|---|---|
| **Workers AI** | CF `AI` binding | Default (lowest cost path) | Primary target for SI features. |
| **Groq** | `GROQ_API_KEY` | Variable | Fast Llama for latency‑sensitive paths. |
| **OpenAI** | `OPENAI_API_KEY` | $$ | Fallback for specific capabilities. |
| **Cartesia TTS** | `CARTESIA_API_KEY` | Variable | Voice; non‑blocking if unconfigured. |

The **model router** picks provider/model by latency/cost policy; responses include `X-Provider`, `X-Model`, token counts, and credit billing headers.

---

## 6) Optional / Later (approved alternates, no rework now)

| Need | Primary | Alternate (later) | When to consider |
|---|---|---|---|
| Vector DB | **KV / R2 + index** | **Cloudflare Vectorize** | When retrieval quality or scale requires approximate NN. |
| Orchestration | In‑house router | **LangGraph**/**LangChain** | If graphs/agents become complex; avoid lock‑in early. |
| Analytics | Neon rollups | Workers Analytics Engine | If dashboarding on CF is preferred over SQL. |
| Feature flags | KV | Unleash/Flagsmith (SaaS) | If targeting non‑edge consumers or SDKs across platforms. |
| Secrets mgmt | CF Secrets | Doppler/1Password | If multi‑cloud secrets unify is needed. |

> These are vetted; we will only introduce them **behind the gateway** with service bindings and PR‑first proofs.

---

## 7) Approved/Forbidden List

**Approved**
- Cloudflare Workers/KV/R2/AI, Neon, Cartesia
- React+Vite+TS, Tailwind, shadcn/ui, Radix, Lucide
- TanStack Query, React Hook Form, Zod
- Hono, esbuild, Vitest, Playwright
- GitHub Actions, ESLint, Prettier
- PowerShell scripts for ops

**Forbidden for now**
- Direct Cloudflare dashboard edits to routes/vars (must come via PR)  
- Monolithic services with public routes other than `cognomega-api`  
- Bash ops snippets in docs  
- Ad‑hoc JWT generators or home‑rolled crypto

---

## 8) Version & Change Policy

- Pin minor versions in `package.json` for stability; update via scheduled PRs.  
- Changes to **public contracts** (routes/headers/CORS) require OPS.md update and a new proof file.  
- Secrets rotated quarterly; JWKS overlap window for RS256 key changes.

---

## 9) File Map (where this fits)

- `/OPS.md` — Runbook & probes  
- `/docs/architecture.md` — System shape & service bindings plan  
- `/docs/roadmap.md` — Milestones & gates  
- `/docs/tasks.md` — Executable backlog (IDs referenced in roadmap)  
- `/docs/tools-and-tech.md` — **This file** (stack & policies)

_Last updated from chat alignment on production state and goals._
