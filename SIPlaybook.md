````md
# Cognomega Super-Intelligence Playbook (Server Contracts)

**Endpoint:** `POST /api/si/ask`  
**Auth:** `Authorization: Bearer <jwt>` (guest or user)  
**CORS:** allow credential-less (Authorization header only).  
**Content-Type:** `application/json`  
**Streaming:** server may switch to `text/event-stream` (SSE) or chunked NDJSON.

---

## Request (canonical)

```jsonc
{
  "skill": "summarize",              // one of Skill enum below
  "input": "string | object",        // end-user prompt / payload
  "system": "optional system prompt",
  "attachments": [
    { "storage": "r2", "key": "r2/object/key.ext", "role": "context|input|image", "content_type": "optional" }
  ],
  "telemetry": {
    "tier": "human|advanced|super",
    "ab": "A|B",
    "client_id": "uuid-or-random",
    "client_ts": "epoch-ms-as-string",
    "source": "ask_console|builder",
    "page": "App.tsx|LaunchInBuilder",
    "skills_enabled": ["reasoning", "codegen", "..."],
    "api_base": "https://api.cognomega.com",
    "user_email": "optional",
    "stream_hint": "sse|off"
  }
}
````

### Required/Recommended Headers

| Header                | Example                          | Purpose              |
| --------------------- | -------------------------------- | -------------------- |
| `Authorization`       | `Bearer <jwt>`                   | AuthN                |
| `Content-Type`        | `application/json`               | Body format          |
| `X-Intelligence-Tier` | `human` \| `advanced` \| `super` | Routing/quality tier |
| `X-AB-Variant`        | `A` \| `B`                       | Experiment arm       |
| `X-Client-Id`         | `cid_...`                        | Sticky client        |
| `X-Client-TS`         | `1699999999999`                  | Client ts            |
| `X-Project-Name`      | `AskConsole` \| `AppMaker`       | Source app           |
| `X-Project-Pages`     | `Ask` \| `Builder`               | Page                 |
| `X-Skills`            | `comma,separated,toggles`        | Feature flags        |
| `X-Experiment`        | `Ask_<skill>_<tier>_<ab>`        | Human-readable tag   |
| (optional)            | `Accept: text/event-stream`      | Request SSE          |

**Idempotency (optional):** support `Idempotency-Key` to dedupe repeated requests.

### Response (non-stream)

```jsonc
{
  "ok": true,
  "result": {
    "content": "final answer markdown or text",
    "meta": {
      "model": "name@provider",
      "latency_ms": 532,
      "tokens_in": 1234,
      "tokens_out": 456,
      "attachments_used": ["r2/object/key.ext"],
      "skill": "summarize",
      "tier": "super"
    }
  }
}
```

### Streaming (SSE)

`Content-Type: text/event-stream`

```
event: message
data: {"delta":"partial text","index":0}

event: message
data: {"delta":" more text","index":1}

event: done
data: {"finish_reason":"stop","meta":{"latency_ms":532,"tokens_out":456}}
```

### Error

```json
{
  "ok": false,
  "error": { "code": "BAD_REQUEST|UNAUTHORIZED|RATE_LIMIT|INTERNAL", "message": "human-friendly message" }
}
```

### Billing Headers (response)

* `X-Credits-Used: <float>`
* `X-Credits-Balance: <float>`
* `X-Model: <string>`
* `X-Cache: HIT|MISS` (optional)

---

## Skills (enum + minimal contracts)

> Server SHOULD normalize each skill into a common planning/execution pipeline:
>
> 1. **Plan** → 2) **Retrieve** (attachments/context) → 3) **Execute** (LLM/tools) → 4) **Evaluate** → 5) **Respond**.

### 1) `summarize`

**Input:** string or { text, format? }
**Output:** concise summary (markdown allowed)

**Request**

```json
{ "skill":"summarize", "input":"Summarize the following...", "telemetry":{"tier":"advanced"} }
```

**Response**

```json
{ "ok":true, "result":{"content":"• ...", "meta":{"model":"...","tier":"advanced"}} }
```

---

### 2) `codegen`

**Input:** { spec: string, language?: "ts"|"py"|..., framework?: "react"|"fastapi"|... }
**Output:** code blocks + rationale

```json
{
  "skill":"codegen",
  "input":{"spec":"Build a React table...", "language":"ts", "framework":"react"},
  "attachments":[{"storage":"r2","key":"ui/wireframe.png","role":"image"}]
}
```

---

### 3) `refactor`

**Input:** { code: string, goals?: string\[] }
**Output:** refactored code + diff or migration steps

```json
{ "skill":"refactor", "input":{"code":"...","goals":["reduce complexity","extract hooks"]} }
```

---

### 4) `testgen`

**Input:** { code: string, framework?: "jest"|"pytest"|... }
**Output:** tests + coverage plan

```json
{ "skill":"testgen", "input":{"code":"...","framework":"jest"} }
```

---

### 5) `explain`

**Input:** { code: string, level?: "jr"|"sr" }
**Output:** explanation + caveats + examples

---

### 6) `plan`

**Input:** { objective: string, constraints?: string\[] }
**Output:** step-by-step plan, owners, timeboxes, risks

---

### 7) `api-design`

**Input:** { purpose: string, entities?: string\[] }
**Output:** endpoints, schemas, error model, versioning

---

### 8) `sql`

**Input:** { question: string, tables?: Schema\[], dialect?: "postgres" }
**Output:** SQL + explanation

---

### 9) `data-viz`

**Input:** { question: string, data\_sample?: object\[], lib?: "recharts" }
**Output:** chart spec + code

---

### 10) `translate`

**Input:** { text: string, to: string, style?: string }
**Output:** translated text

---

### 11) `vision-analyze`

**Input:** { prompt: string }, **Attachments:** image or pdf
**Output:** description, OCR, tasks

---

## Attachments

```json
{ "storage":"r2", "key":"path/in/bucket.ext", "role":"context|input|image", "content_type":"image/png" }
```

Server SHOULD:

* enforce size/type, generate `signed GET` for LLM tool if needed,
* redact secrets,
* log minimal keys for privacy.

---

## Rate Limits & Quotas

* `429` with `Retry-After`.
* Per `client_id`, `user_email`, and IP.

---

## Telemetry/Observability

* Log: skill, tier, ab, model, tokens, latency, status, credits, client\_id.
* Export RED/SLO metrics per skill+tier.

```

