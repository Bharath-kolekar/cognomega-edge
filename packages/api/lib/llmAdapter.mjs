const BASE = process.env.LLM_BASE_URL || "http://127.0.0.1:8000";
const PATH = process.env.LLM_COMPLETE_PATH || "/api/v1/llm/complete";

export async function llmComplete({prompt, system=null, max_tokens=512, temperature=0.2}) {
  try {
    const r = await fetch(`${BASE}${PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, system, max_tokens, temperature })
    });
    if (!r.ok) throw new Error(`LLM HTTP ${r.status}`);
    const j = await r.json();
    const text = j?.text ?? j?.choices?.[0]?.message?.content ?? "";
    return String(text || "").trim();
  } catch (e) {
    const head = (prompt||"").slice(0, 240).replace(/\s+/g," ").trim();
    return `[DEGRADED:LLM] Unable to reach model. Showing a concise extract:\n${head}`;
  }
}
