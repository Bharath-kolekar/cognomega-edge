# Cognomega — Tools & Technologies (Cost Profile + Rationale)

Status: SOURCE OF TRUTH

## Platform & Infra
- **Cloudflare Workers** (gateway + microservices), **Service Bindings**, **Queues**, **KV**, **R2**, **Durable Objects**, **Cron** — usage-based, very low idle cost.
- **Neon Postgres** — serverless PG; ledger, analytics, pgvector; pay-as-you-go.
- **Cartesia TTS** — paid usage; kept for quality; can add Workers-AI TTS fallback.

## Frontend (OSS, free)
- **React 18**, **Vite**, **TypeScript**, **ESLint**
- **Tailwind CSS**, **tailwindcss-animate**
- **shadcn/ui** + **Radix UI** primitives
- **Lucide** icons; **clsx**, **tailwind-merge**, **class-variance-authority**
- **TanStack React Query**
- **React Hook Form**, **@hookform/resolvers**, **Zod**
- **React Router DOM**
- **date-fns**, **react-day-picker**, **recharts**, **sonner**, **embla-carousel-react**, **vaul**
- **next-themes**

## Backend Libraries (edge-safe)
- `@neondatabase/serverless` (fetch-based), **Hono** framework for Workers
- No Node-only dependencies (keep fetch/WHATWG APIs).

## AI Providers
- **Workers AI** (default), **Groq**, **OpenAI** — orchestrated via env order `groq,cfai,openai`.
- **pgvector** in Neon for embeddings & retrieval.

## CI/CD & Ops
- **GitHub Actions** (main-only deploys to prod Worker/Pages).
- **OPS.md** as runbook; **Route Audit proofs** under `/ops/proofs/`.
- **Wrangler** for deploy/tail; **Logpush** dashboards.

## Why this set?
- Lowest operational overhead at global scale (edge compute + queues).
- Cloudflare services cover caching, jobs, storage, and realtime without extra vendors.
- Neon provides strong SQL + vectors with good cold-start behavior for Workers.

## Optional future adds (only if needed)
- Analytics warehouse mirror (ClickHouse/BigQuery) via queue tap.
- Advanced charting (`visx` or ECharts) if dashboards demand it.
- Workers AI image/STT to reduce third-party spend where acceptable.

