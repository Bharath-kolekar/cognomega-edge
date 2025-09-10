/* proxy/server.js — IPv4-only reverse proxy for Cloudflare Worker */
const express = require('express');
const fetch = require('node-fetch'); // v2 (CJS)
const https = require('https');
const dns = require('dns');

const PORT = process.env.PORT || 10000;
const TARGET = process.env.TARGET || 'https://api.cognomega.com';
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'https://app.cognomega.com,http://localhost:5174')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Force IPv4 lookups when connecting to Cloudflare
const agent = new https.Agent({
  keepAlive: true,
  lookup: (hostname, opts, cb) => dns.lookup(hostname, { family: 4 }, cb),
});

function cors(req, res, next) {
  const origin = req.headers.origin || '';
  const allow = ALLOWED.includes(origin) ? origin : (ALLOWED[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-User-Email');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors);

// Local readiness of the proxy itself
app.get('/ready', (req, res) => res.json({ ok: true, proxy: 'v4' }));

// Endpoints to proxy upstream to CF Worker
const PROXIED = [
  '/auth/guest',
  '/.well-known/jwks.json',
  '/api/credits',
  '/api/billing/usage',
  '/healthz',
  '/ready',
  '/api/ready',
  '/credits',
  '/usage',
  '/billing/usage'
];

app.all(PROXIED, async (req, res) => {
  try {
    const url = new URL(req.originalUrl, TARGET);
    const headers = {};
    for (const h of ['authorization','content-type','x-user-email']) {
      const v = req.header(h);
      if (v) headers[h] = v;
    }
    const init = {
      method: req.method,
      headers,
      agent
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length) {
      init.body = JSON.stringify(req.body);
    }

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10000);
    init.signal = ac.signal;

    const r = await fetch(url.toString(), init);
    clearTimeout(t);

    const text = await r.text();
    const ct = r.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(r.status).type(ct).send(text);
  } catch (err) {
    res.status(502).json({ error: 'proxy_failed', detail: String(err && err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`proxy up on :${PORT}, target=${TARGET}, allowed=${ALLOWED.join('|')}`);
});
