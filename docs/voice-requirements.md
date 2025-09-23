# Voice Assistant — Requirements & MVP Plan (Single Source of Truth)

> **Status**: Documentation-only. No runtime changes in this step.  
> **Targets**: Cloudflare Workers (edge), KV/R2, Neon (optional), Cartesia (TTS).  
> **Principles**: Keep prod stable, GitHub-only deploys, no feature drift.

---

## 1) Goals (from product brief)

- **AI‑first, voice‑first** assistant that can *plan, build, and ship* microservices apps.
- Real‑time **multilingual** voice I/O with accent handling.
- **Low/No cost first**: prefer browser/client resources; pay‑per‑use cloud.
- **Evolvable intelligence**: learn preferences (opt‑in), improve prompts and routing.
- **Accessibility**: hands‑free creation and navigation.

---

## 2) MVP 0.1 (ship fast, safe)

**In scope now (no breaking changes):**
- **TTS (Cartesia) proxy endpoints** *(already scaffolded, currently 501)* — we will wire these later.
- **User voice preferences** (KV) read/write API: `GET/PUT /api/voice/prefs`.
- **Client‑side STT** using browser APIs (Web Speech / SpeechRecognition) with **fallback to text**.
- **CORS + headers** remain unchanged; prefs APIs reuse existing CORS module.
- **Audit logging** in KV_BILLING (metadata only) when voice features are used.

**Out of scope for 0.1 (planned next):**
- Wake‑word, continuous listening, offline DeepSpeech, RL learning, mood detection.
- Server‑side STT providers (to avoid cost until needed).
- Multi‑party realtime sessions.

---

## 3) Architecture (MVP)

```
Browser (STT, hotkeys)
  └─ calls /api/voice/prefs (KV_PREFS)
  └─ calls /api/tts/cartesia/* → Cartesia (TTS)    [501 → to be enabled]
Edge (Worker)
  ├─ KV_PREFS: user voice prefs (per email)
  ├─ KV_BILLING: usage events (voice flags only)
  └─ AI (LLM): same orchestrator; optional prompt tweaks for voice
```

- **KV_PREFS** (new namespace): *not required* by existing code; safe to add later.
- **No route changes**; one API owner remains (`cognomega-api`).

---

## 4) Data model: KV_PREFS

Key format: `prefs:voice:<email>`

```jsonc
{
  "updated_at": "2025-09-23T06:45:00Z",
  "assistant_name": "Ava",              // string
  "lang": "en-US",                      // BCP-47
  "stt_client_only": true,              // true = browser STT only
  "tts_voice": "cartesia:ava-01",       // provider:voice-id
  "tts_speed": 1.0,                     // 0.5–2.0
  "tts_pitch": 0.0,                     // -12..+12 semitones
  "accessibility_mode": false,          // larger pauses, confirmations
  "proactive_tips": false,              // engage proactively
  "privacy_continuous_listen": false    // guardrail for future
}
```

---

## 5) API contracts (MVP)

### `GET /api/voice/prefs`
- **Auth**: same identity resolution as other endpoints (query/header/JWT).  
- **200**: returns prefs (or sensible defaults if not set).  
- **Headers**: inherits standard CORS + `X-Request-Id`.

### `PUT /api/voice/prefs`
- **Body**: partial object with keys from the schema above.  
- **Validation**: strict types; unknown keys ignored.  
- **200**: returns merged document.  
- **Side‑effect**: append usage meta to KV_BILLING (route: `/api/voice/prefs`).

> **Note**: This step is documentation only. Endpoint wiring will be a separate PR to avoid risk.

---

## 6) Acceptance criteria (MVP 0.1)

- No regressions to existing routes.  
- New doc reviewed & merged; no Wrangler changes yet.  
- Follow‑up PRs will:  
  1) Create KV namespace **KV_PREFS** in dashboard + bind in `wrangler.toml`.  
  2) Implement handlers `GET/PUT /api/voice/prefs` behind existing CORS.  
  3) Wire Cartesia batch TTS endpoint (replace 501) with feature flag.

---

## 7) Security & privacy

- Explicit opt‑in to store voice prefs.  
- No raw audio persisted in MVP.  
- Headers & CORS unchanged; same admin key model as today.  
- Future: signed wake‑word model download; privacy toggle for listening.

---

## 8) Rollout plan (next steps)

1. **Docs‑only PR** (this file).  
2. **Add KV_PREFS binding** (wrangler + dashboard) — *no code usage yet*.  
3. **Implement prefs endpoints** (small, isolated module).  
4. **Enable TTS (Cartesia)** behind flag and quotas.  
5. **Client integration**: Settings page + voice panel reading/writing prefs.

---

## 9) References

- OPS route audit & probes — `OPS.md`  
- API entrypoints — `api/src/index.ts`  
- Billing/usage module — `api/src/modules/auth_billing.ts`  
- Wrangler — `api/wrangler.toml`
