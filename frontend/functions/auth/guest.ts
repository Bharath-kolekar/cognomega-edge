// frontend/functions/auth/guest.ts
/* eslint-env worker */
/// <reference types="@cloudflare/workers-types" />
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  TURNSTILE_SECRET: string;
  VITE_API_BASE?: string;
};

type VerifyResp = { success?: boolean; ['error-codes']?: string[] };
type Json = Record<string, unknown>;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin');
  const CORS = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, CORS);
  }

  try {
    // Turnstile token from header or form-data
    let token = request.headers.get('CF-Turnstile-Token') ?? '';
    if (!token) {
      try {
        const fd = await request.clone().formData();
        const v = fd.get('cf-turnstile-response');
        if (typeof v === 'string') token = v;
      } catch {
        /* not form-data; ignore */
      }
    }
    if (!token) return json({ error: 'missing_turnstile' }, 400, CORS);

    // Verify Turnstile
    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
        }),
      }
    );
    const verify: VerifyResp = await verifyRes.json();
    if (!verify?.success) {
      return json(
        { error: 'turnstile_failed', code: verify['error-codes'] ?? null },
        403,
        CORS
      );
    }

    // Proxy to API to mint JWT
    const apiBase = (env.VITE_API_BASE || 'https://api.cognomega.com').replace(/\/+$/, '');
    const upstream = await fetch(`${apiBase}/auth/guest`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{}',
    });

    const ct = (upstream.headers.get('content-type') || '').toLowerCase();
    const body = ct.includes('application/json') ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      const msg = typeof body === 'string' ? body : (body as Json)['error'] ?? upstream.statusText;
      return json({ error: String(msg) }, upstream.status, CORS);
    }

    return new Response(
      ct.includes('application/json') ? JSON.stringify(body) : String(body),
      {
        status: 200,
        headers: {
          ...CORS,
          'content-type': ct.includes('application/json')
            ? 'application/json; charset=utf-8'
            : 'text/plain; charset=utf-8',
        },
      }
    );
  } catch {
    return json({ error: 'server_error' }, 500, CORS);
  }
};

function corsHeaders(origin: string | null) {
  const allow =
    origin && /^https?:\/\/(localhost(:\d+)?|app\.cognomega\.com)$/i.test(origin)
      ? origin
      : 'https://app.cognomega.com';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'CF-Turnstile-Token, Content-Type, Accept',
    vary: 'Origin',
  };
}

function json(obj: Json, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}