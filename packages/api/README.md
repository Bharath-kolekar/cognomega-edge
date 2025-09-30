# @cognomega/api

Cognomega API microservice - Cloudflare Worker with Hono framework providing REST API endpoints, authentication, billing, and AI orchestration.

## Overview

This microservice is the core API layer providing:
- RESTful API endpoints
- JWT-based authentication
- Billing and credit management
- AI model routing and orchestration
- Multi-agent system coordination
- Super Intelligence Engine integration

## Technology Stack

- **Framework**: Hono (lightweight web framework)
- **Runtime**: Cloudflare Workers
- **Database**: Neon Postgres (serverless)
- **Storage**: Cloudflare KV, R2
- **AI**: Cloudflare AI, integrated AI providers
- **Type Safety**: TypeScript with strict mode

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.17.1
- Wrangler CLI

### Install Dependencies

From the monorepo root:
```powershell
pnpm install
```

### Configuration

Create `.dev.vars` file in this directory with required secrets:

```env
# Core CORS & JWT
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
ISSUER=https://api.cognomega.com

# JWT Keys
JWT_SECRET=your-secret-key
JWKS_URL=https://your-jwks-url

# Database
DATABASE_URL=postgresql://...

# AI Providers
GROQ_API_KEY=your-groq-key
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Billing
STRIPE_SECRET_KEY=your-stripe-key
```

### Run Development Server

From the monorepo root:
```powershell
pnpm -C packages/api dev
```

Or using the root script:
```powershell
pnpm dev:api
```

The API will be available at `http://localhost:8787`

### Build for Production

```powershell
pnpm -C packages/api build
```

### Type Checking

```powershell
pnpm -C packages/api typecheck
```

### Deploy

**Note**: Always deploy through GitHub CI/CD, not directly.

For dry-run testing:
```powershell
pnpm -C packages/api deploy:dry
```

## Architecture

This microservice is designed to operate independently:

- **Standalone Development**: Can be developed and tested with local secrets
- **Independent Deployment**: Deploys to Cloudflare Workers edge network
- **Service Integration**: Connects to external services (databases, AI providers)
- **Type Safety**: Uses TypeScript project references with si-core library

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /api/status` - Detailed status information

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### AI & Intelligence
- `POST /api/ai/chat` - Chat completion
- `POST /api/ai/generate` - Code generation
- `GET /api/agents/status` - Multi-agent system status
- `POST /api/agents/build` - Full-stack project build
- `POST /api/agents/execute` - Execute agent task

### Billing
- `GET /api/billing/credits` - Get user credits
- `POST /api/billing/purchase` - Purchase credits

For complete API documentation, see `/openapi` directory in the monorepo root.

## Project Structure

```
packages/api/
├── src/
│   ├── routes/           # API route handlers
│   ├── middleware/       # Request middleware
│   ├── lib/             # Utilities and helpers
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main application entry
├── config/              # Configuration files
├── .dev.vars           # Local development secrets (not committed)
├── wrangler.toml       # Cloudflare Workers configuration
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Integration Points

### SI-Core Library
- Imports shared AI intelligence types and utilities
- Uses multi-agent system for complex tasks
- Maintains type safety through workspace references

### Frontend & Builder Services
- Provides API endpoints for UI applications
- CORS configured for allowed origins
- JWT authentication for secure access

### External Services
- **Cloudflare**: KV storage, R2 buckets, AI inference
- **Neon**: PostgreSQL database
- **Groq**: AI model inference
- **Stripe**: Payment processing

## Environment Variables

Required environment variables (set in Cloudflare Workers dashboard or `.dev.vars`):

- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `ISSUER` - JWT token issuer
- `JWT_SECRET` - Secret for JWT signing
- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - Groq API key
- `STRIPE_SECRET_KEY` - Stripe API key

For complete list, see `OPS.md` in the monorepo root.

## Deployment

This microservice uses GitHub-only deployment:

1. **PR**: Create pull request with changes
2. **Review**: Code review and CI checks
3. **Merge**: Merge to main branch
4. **Deploy**: Automatic deployment via GitHub Actions

Never use `wrangler publish` directly to production.

## Monitoring

- **Logs**: `pnpm tail` - Stream worker logs
- **Analytics**: Cloudflare Workers dashboard
- **Errors**: Sentry integration (if configured)

## Contributing

When making changes to this microservice:

1. Maintain backward compatibility with API contracts
2. Update OpenAPI specifications if endpoints change
3. Run type checking before committing: `pnpm typecheck`
4. Test locally with development server
5. Ensure builds succeed before creating PR
6. Update environment variables in both `.dev.vars` and CI secrets

## Notes

- This package uses `composite: true` in tsconfig.json for TypeScript project references
- Depends on `@cognomega/si-core` for shared intelligence functionality
- Configured with strict TypeScript for type safety
- Uses workspace protocol for internal dependencies
