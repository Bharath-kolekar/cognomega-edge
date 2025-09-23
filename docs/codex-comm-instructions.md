
How to talk to Codex (Command Cheat-Sheet)

Kickoff prompt (paste into Codex)
You are Codex, collaborating on the Cognomega repo. Use the SOP in docs/codex-pr-sop.md.

Create a single PR per task.

Add labels: codex:ready and ops:proofs-attached once proofs are included.

Never change Cloudflare directly; all changes go via PR to main.

Always run OPS probes and attach proof snippets.

Task prompt example
Task: Teach SQL handlers to resolve email from JWT/cookie like the worker.
Constraints: keep README contract, add tests if present, update OPS/README if public contract changes.
Deliverables: code + docs + PR body with SOP sections + proofs + labels.

Proof commands (bash)
base="https://api.cognomega.com
"
curl -sS "$base/api/ai/binding"
curl -sS "$base/.well-known/jwks.json" | head -c 120
curl -sSI -X OPTIONS "$base/api/si/ask"
-H "Origin: https://app.cognomega.com
"
-H "Access-Control-Request-Method: POST"
-H "Access-Control-Request-Headers: content-type, x-user-email, x-intelligence-tier"

Proof commands (PowerShell)
$base="https://api.cognomega.com
"
irm "$base/api/ai/binding"
(Invoke-WebRequest "$base/.well-known/jwks.json").Content.Substring(0,120)
$req=[System.Net.HttpWebRequest]::Create("$base/api/si/ask")
$req.Method="OPTIONS"
$req.Headers.Add("Origin","https://app.cognomega.com
")
$req.Headers.Add("Access-Control-Request-Method","POST")
$req.Headers.Add("Access-Control-Request-Headers","content-type, x-user-email, x-intelligence-tier")
$resp=$req.GetResponse(); $resp.Headers; $resp.Close()
