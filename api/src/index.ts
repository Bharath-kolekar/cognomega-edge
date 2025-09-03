import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import { v4 as uuidv4 } from 'uuid';
import * as jose from 'jose';
import { neon, neonConfig } from '@neondatabase/serverless';

type Bindings = {
  CREDITS: KVNamespace;
  FILES: R2Bucket;
  JWT_SECRET: string;
  JWT_ISS?: string;
  JWT_AUD?: string;
  NEON_DATABASE_URL: string;
};
const app = new Hono<{ Bindings: Bindings }>();

const corsOptions = {
  origin: (origin: string | undefined) => {
    if (!origin) return false;
    if (origin === 'https://cognomega-frontend.pages.dev') return true;
    if (origin.endsWith('.cognomega-frontend.pages.dev')) return true; // hashed deploy URLs
    return false;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
};
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '';
    const allow = [
      /^https:\/\/([a-z0-9-]+\.)?cognomega-frontend\.pages\.dev$/,
      /^https:\/\/app\.cognomega\.com$/
    ];
    return allow.some(re => re.test(origin)) ? origin : '';
  },
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  maxAge: 86400,
}));
app.use('*', async (c, next) => {
  const id = uuidv4();
  c.set('reqId', id);
  await next();
  c.header('X-Request-ID', id);
  c.header('Cache-Control', 'no-store');
  // Security headers (global)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
});

const rateLimit = (limit: number, windowSec: number) => createMiddleware(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'unknown';
  const key = `rl:${ip}:${Math.floor(Date.now()/1000/windowSec)}`;
  const used = parseInt((await c.env.CREDITS.get(key)) || '0');
  if (used >= limit) return c.text('Too Many Requests', 429);
  await c.env.CREDITS.put(key, String(used + 1), { expirationTtl: windowSec * 2 });
  await next();
});

const auth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.text('Unauthorized', 401);
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    await jose.jwtVerify(token, secret, {
      issuer: c.env.JWT_ISS || 'cognomega',
      audience: c.env.JWT_AUD || 'cognomega-clients',
    });
  } catch { return c.text('Unauthorized', 401) }
  await next();
});

app.get('/health', (c) => c.json({ ok: true }));
app.get('/ready', async (c) => {
  try {
    neonConfig.fetchConnectionCache = true;
    const sql = neon(c.env.NEON_DATABASE_URL);
    const rows = await sql`select 1 as ok`;
    return c.json({ ok: rows[0]?.ok === 1 });
  } catch (e) { return c.json({ ok: false, error: String(e) }, 503) }
});

app.get('/v1/credits', auth, rateLimit(60, 60), async (c) => {
  return c.json({ balance: 1000 });
});

app.post('/v1/files/upload', auth, rateLimit(30, 60), async (c) => {
  const ct = c.req.header('content-type') || '';
  if (!ct.startsWith('multipart/form-data')) return c.text('Bad Request', 400);
  const form = await c.req.parseBody();
  const file = form['file'];
  if (!(file instanceof File)) return c.text('No file', 400);
  const key = `up/${Date.now()}_${file.name}`;
  const putRes = await c.env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  return c.json({ key, etag: putRes?.etag });
});

app.all('*', (c) => c.json({ error: 'Not Found' }, 404));
export default app;







