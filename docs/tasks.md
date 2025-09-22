# Cognomega — Task Backlog (Atomic, Verifiable)

Status: SOURCE OF TRUTH  
Each task has: intent, exact outputs, acceptance checks (PowerShell first).

## Legend
P0 = immediate, P1 = near-term, P2 = next, P3 = later  
Own = DRI/Owner (fill in)  Effort = S/M/L  Blockers = deps

---

### P0-1 Route Ownership Audit (prod)
- **Intent**: ensure `api.cognomega.com/*` is owned only by `cognomega-api`.
- **Steps**:
  1. Verify `api\wrangler.toml` route block (committed).  
  2. In CF Dashboard: Workers → **cognomega-api** → Domains & Routes: confirm sole route.  
     Pages → (all projects) → Functions: confirm **no** routes hit `api.cognomega.com/*`.
  3. Capture proofs file (JWKS&AI 120-char head).
- **Acceptance (PowerShell)**:
  ```powershell
  Invoke-RestMethod "https://api.cognomega.com/api/ai/binding" # => ai_bound True
  Invoke-RestMethod "https://api.cognomega.com/.well-known/jwks.json" # => keys[]
Output: ops/proofs/api-route-audit-YYYYMMDD-HHMMSS.txt committed.

Own: ___ Effort: S Blockers: none

P0-2 CORS Preflight Sanity (prod)

Intent: confirm headers stable and exposed list correct.

Acceptance:

$req = [System.Net.HttpWebRequest]::Create("https://api.cognomega.com/api/si/ask")
$req.Method="OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","Content-Type, X-User-Email, X-Intelligence-Tier")
$resp=$req.GetResponse(); $resp.StatusCode # => NoContent


Output: paste header set into task comment; link in OPS.

Own: ___ Effort: S

P0-3 README Docs Segment

Intent: Add explicit statement: single /auth/guest (RS256) + /.well-known/jwks.json; list exposed headers; note KV is ST for credits/usage/jobs; “Operator probes” link to OPS.

Acceptance: PR merged to main with that block.

Own: ___ Effort: S

P1-1 Introduce usage-svc (ingress) + usage-writer (queue)

Intent: async usage writes.

Steps:

Create Workers: usage-svc (POST/GET), usage-writer (Queue consumer).

Update Gateway to call service binding on SI responses.

Acceptance: /api/si/ask p90 latency drops vs baseline under 5x load; queue drain < 2m.

Own: ___ Effort: M

P1-2 billing-svc with KV cache

Intent: KV hot path, Neon authoritative.

Steps:

GET /credits hit KV; on writes, update Neon and KV.

Acceptance: KV/Neon drift auto-reconciles in ≤ 60s; admin backfill works.

Own: ___ Effort: M

P2-1 Extract auth-svc

Intent: move RS256 and JWKS serving to dedicated Worker.

Acceptance: all three guest endpoints continue to work; JWKS cache-control remains.

Own: ___ Effort: S

P2-2 Extract orchestrator-svc + rate-limiter DO

Intent: provider routing + per-tenant budgets.

Acceptance: throttling visible under synthetic abuse; normal traffic unaffected.

Own: ___ Effort: M

P2-3 Extract files-svc

Intent: R2 direct uploads, AV queue hook (optional).

Acceptance: 10MB upload path is stable; content-type preserved.

Own: ___ Effort: S/M

P3-1 jobs-svc (queues)

Intent: robust job processing.

Acceptance: queue depth monitored; job retry policy verified.

Own: ___ Effort: M

P3-2 voice-svc (Cartesia; STT; DO sessions)

Intent: voice-first UX.

Acceptance: TTS latency within SLO; STT accuracy baseline set; session reconnections safe.

Own: ___ Effort: M/L

P4-1 pgvector enablement & feedback loop

Intent: evolving intelligence (bandit A/B).

Acceptance: skill versions tracked; success rate uplift observed in metrics.

Own: ___ Effort: M