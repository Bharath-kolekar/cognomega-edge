## What changed & why
<!-- brief summary -->

## Endpoints affected
<!-- list endpoints, e.g., /api/si/ask -->

## CORS / Headers
- [ ] Unchanged
- [ ] Changed (details below)

## Route ownership
- [ ] api.cognomega.com/* remains owned by the cognomega-api Worker

## Security / Secrets
- [ ] None
- [ ] Secret/env changes (list):

## Rollback
<!-- exact steps to revert -->

## Proofs (paste outputs)

**AI binding**
<paste curl/PowerShell output>

markdown
Copy code

**JWKS (first 120 chars)**
<paste text> ```
Preflight (OPTIONS /api/si/ask)

bash
Copy code
<paste headers>
Route audit (if routes changed)

bash
Copy code
<paste ops/proofs/*.txt or inline snippet>
Checklist
 Labels applied: codex:ready, ops:proofs-attached

 CI green (ci workflow)

 No direct CF edits; all via PR to main

 README/OPS updated if any public contract changed
