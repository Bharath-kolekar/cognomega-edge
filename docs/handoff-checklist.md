
---

# 3) “Bring-to-chat” Checklist (full file)

**Path:** `C:\dev\cognomega-edge\docs\handoff-checklist.md`

```markdown
# Cognomega — What to Share at the Start of Each New Chat

Purpose: keep me fully in sync; avoid drift; accelerate decisions.

## 1) Current proofs (paste or attach)
- First 120 chars of JWKS JSON:
- First 120 chars of `/api/ai/binding` JSON:
- Latest CORS preflight header set (OPTIONS /api/si/ask; origin app.cognomega.com).

## 2) Current versions (paste env snapshot)
- Output of `/api/admin/env-snapshot` (redact secrets booleans are fine).
- Current `api/wrangler.toml` route block (pattern + zone_name).
- Any changes to `ALLOWED_ORIGINS`, model/provider order, or MAX_UPLOAD_BYTES.

## 3) Documents you touched since last chat
- `OPS.md` (which section)
- `README.md` (which section)
- Any service docs in `/docs/services/*`
- Proofs added in `/ops/proofs/*`

## 4) Open tasks you want me to drive next (task IDs from docs/tasks.md)

## 5) Incidents or anomalies (if any)
- Route conflicts, CORS blocks, provider failures, queue backlogs, credit drift.
