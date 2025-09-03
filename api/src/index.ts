import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import * as jose from 'jose'
import { neon, neonConfig } from '@neondatabase/serverless'

type Bindings = {
  CREDITS: KVNamespace
  FILES: R2Bucket
  JWT_SECRET: string
  JWT_ISS?: string
  JWT_AUD?: string
  NEON_DATABASE_URL?: string
  TURNSTILE_SECRET?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ---------- Config ----------
const ALLOWED_ORIGINS = new Set<string>([
  'https://app.cognomega.com',
])

const REQUIRE_TS_GUEST = false          // keep guest auth snappy
const REQUIRE_TS_UPLOAD = true          // protect uploads

// ---------- Helpers ----------
const enc = new TextEncoder()

function setCors(c: any) {
  const origin = c.req.header('Origin') || ''
  if (ALLOWED_ORIGINS.has(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
    c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, CF-Turnstile-Token')
    c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  }
}
app.use('*', async (c, next) => {
  setCors(c)
  if (c.req.method === 'OPTIONS') return c.body(null, 204)
  return next()
})

async function signJwt(env: Bindings, role: string, sub = role, ttl = '5m') {
  const token = await new jose.SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISS || 'cognomega')
    .setAudience(env.JWT_AUD || 'cognomega-clients')
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(enc.encode(env.JWT_SECRET))
  return token
}

async function verifyJwt(env: Bindings, token: string) {
  const secret = enc.encode(env.JWT_SECRET)
  await jose.jwtVerify(token, secret, {
    issuer: env.JWT_ISS || 'cognomega',
    audience: env.JWT_AUD || 'cognomega-clients',
  })
}

async function verifyTurnstileWithEnv(env: Bindings, token: string, remoteIp?: string) {
  if (!token) return { success: false, 'error-codes': ['missing-input'] }
  // If no secret is configured, soft-pass so the feature still works.
  if (!env.TURNSTILE_SECRET) return { success: true }
  const form = new FormData()
  form.set('secret', env.TURNSTILE_SECRET)
  form.set('response', token)
  if (remoteIp) form.set('remoteip', remoteIp)
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    return await r.json()
  } catch {
    return { success: false, 'error-codes': ['network-error'] }
  }
}

// ---------- Middlewares ----------
const requireAuth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const hdr = c.req.header('Authorization') || ''
  const [, token] = hdr.split(' ')
  if (!token) return c.text('Unauthorized', 401)
  try {
    await verifyJwt(c.env, token)
  } catch {
    return c.text('Unauthorized', 401)
  }
  await next()
})

const requireTurnstile = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const token = c.req.header('CF-Turnstile-Token') || ''
  const ip = c.req.header('CF-Connecting-IP') || undefined
  const out: any = await verifyTurnstileWithEnv(c.env, token, ip)
  if (!out?.success) {
    console.log('TURNSTILE_FAIL', JSON.stringify(out))
    return c.json({ error: 'turnstile_failed' }, 403)
  }
  await next()
})

// ---------- Health ----------
app.get('/ready', async (c) => {
  try {
    if (c.env.NEON_DATABASE_URL) {
      neonConfig.fetchConnectionCache = true
      const sql = neon(c.env.NEON_DATABASE_URL)
      await sql`select 1 as ok`
    }
    return c.json({ ok: true })
  } catch {
    return c.json({ ok: false }, 500)
  }
})

// ---------- Auth ----------
app.post('/auth/guest', async (c) => {
  if (REQUIRE_TS_GUEST) {
    const token = c.req.header('CF-Turnstile-Token') || ''
    const ip = c.req.header('CF-Connecting-IP') || undefined
    const out: any = await verifyTurnstileWithEnv(c.env, token, ip)
    if (!out?.success) {
      console.log('TURNSTILE_FAIL /auth/guest', JSON.stringify(out))
      return c.json({ error: 'turnstile_failed' }, 403)
    }
  }
  const token = await signJwt(c.env, 'guest', 'guest', '10m')
  return c.json({ token, expires_in: 600 })
})

// ---------- Files ----------
app.post('/v1/files/upload', requireAuth, (REQUIRE_TS_UPLOAD ? requireTurnstile : async (_c,_n)=>{}), async (c) => {
  const form = await c.req.formData().catch(() => null)
  const f = form?.get('file') as File | null
  if (!f) return c.json({ error: 'missing_file' }, 400)
  const now = Date.now()
  const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `up/${now}_${safeName}`
  const put = await c.env.FILES.put(key, await f.arrayBuffer())
  return c.json({ key, etag: put?.etag })
})

// ---------- Credits ----------
app.get('/v1/credits', requireAuth, async (c) => {
  try {
    const raw = await c.env.CREDITS.get('balance')
    const balance = raw ? Number(raw) : 1000
    return c.json({ balance })
  } catch {
    return c.json({ balance: 1000 })
  }
})

// ---------- Stubs ----------
app.post('/v1/text/ask', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const prompt = body?.prompt ?? ''
  return c.json({ ok: true, mode: 'client-llm', prompt })
})

app.post('/v1/interview/start', requireAuth, async (_c) => {
  return _c.json({ sid: (crypto as any).randomUUID() })
})

export default app
