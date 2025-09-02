# Cognomega — Edge Production Stack (Serverless, $0 for first months)

**Production-only** deployment on Cloudflare (Workers + Pages) with Neon Postgres.

## Setup (Production)
1) Cloudflare resources
```powershell
npm i -g wrangler
wrangler login
cd api
wrangler kv namespace create COGNOMEGA_CREDITS
wrangler r2 bucket create cognomega-files
wrangler secret put JWT_SECRET
wrangler secret put NEON_DATABASE_URL
wrangler deploy
```
2) Frontend
```powershell
cd ../frontend
npm ci
npm run build
wrangler pages project create cognomega-frontend --production-branch main
wrangler pages deploy dist
```
