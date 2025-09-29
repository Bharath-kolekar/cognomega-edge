// packages/api/src/qualityRouter.ts
//
// Decide which LOCAL model to use per request to keep/better quality with zero $ spend.
// - Small/fast model for short/general prompts
// - Bigger/safer model for JSON/tools/code/long prompts
//
// Env knobs (already added in 5C/5D):
//   LOCAL_LLM_FAST     = qwen2.5-7b-instruct-q5_k_m
//   LOCAL_LLM_QUALITY  = qwen2.5-14b-instruct-q4_k_m
//
// This file is pure logic. We'll call it from /api/si/ask in the next step.

export type ModelChoice = {
  provider: "local";
  model: string;
  temperature: number;
  maxTokens: number;
};

export type PickInput = {
  // Plain text prompt (and optional system)
  prompt: string;
  system?: string;

  // If your handler passes OpenAI-style messages, you can also pass a joined string here.
  joinedMessages?: string;

  // Tools/functions present?
  tools?: unknown[];

  // Caller/requested max context window (used as an upper bound for maxTokens)
  maxContext?: number;
};

function hasStructuredHints(s: string): boolean {
  const t = s.toLowerCase();
  return (
    /```json/.test(t) ||
    /"type"\s*:\s*"object"/.test(t) ||
    /jsonschema|json schema|strict json/.test(t) ||
    /"required"\s*:/.test(t)
  );
}

function hasCodeHints(s: string): boolean {
  return /```|import\s|\bfunction\s|\bclass\s|\binterface\s|\btype\s/.test(s);
}

export function pickModel(input: PickInput): ModelChoice {
  const base = `${input.prompt || ""}\n${input.system || ""}\n${input.joinedMessages || ""}`;
  const L = base.length;

  const structured = hasStructuredHints(base);
  const withTools = (input.tools?.length ?? 0) > 0 || /\btools?\s*[:=]\s*\[/.test(base);
  const codey = hasCodeHints(base);
  const longish = L > 2000; // rough heuristic; adjust as you like

  // Quality path for JSON/tools/code/long prompts
  if (structured || withTools || codey || longish) {
    return {
      provider: "local",
      model: process.env.LOCAL_LLM_QUALITY ?? "qwen2.5-14b-instruct-q4_k_m",
      temperature: 0.2,
      maxTokens: Math.min(2048, input.maxContext ?? 8192),
    };
  }

  // Fast path for short/general prompts
  return {
    provider: "local",
    model: process.env.LOCAL_LLM_FAST ?? "qwen2.5-7b-instruct-q5_k_m",
    temperature: 0.5,
    maxTokens: Math.min(1024, input.maxContext ?? 8192),
  };
}
