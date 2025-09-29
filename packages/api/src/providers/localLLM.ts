// packages/api/src/providers/localLLM.ts
// Minimal OpenAI-compatible client for your LOCAL inference server.
// Works with vLLM/Ollama/llama.cpp gateways that expose /v1/chat/completions.

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool" | "function";
  content: string;
  name?: string;
  tool_call_id?: string;
};

export type CompletionInput = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;    // we call non-stream here; streaming can be added later
  tools?: unknown[];   // if your server supports tool spec passthrough
};

export type CompletionResult = {
  text: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    [k: string]: any;
  };
  raw: any;
};

function asUrl(env: Record<string, string | unknown>): string {
  const u =
    (env as any)?.LOCAL_LLM_URL ||
    (globalThis as any)?.LOCAL_LLM_URL ||
    "http://127.0.0.1:8000/v1/chat/completions";
  return String(u);
}

export async function localChatComplete(
  env: Record<string, string | unknown>,
  input: CompletionInput
): Promise<CompletionResult> {
  const url = asUrl(env);

  const body: any = {
    model: input.model,
    messages: input.messages,
    temperature: input.temperature ?? 0.2,
    max_tokens: input.maxTokens ?? 512,
    stream: false, // keep first integration simple & robust
  };

  if (Array.isArray(input.tools) && input.tools.length > 0) {
    // Most OpenAI-compatible servers accept `tools` + `tool_choice`
    body.tools = input.tools;
    body.tool_choice = "auto";
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    // Throw a Response so upstream can return the exact status
    throw new Response(
      `local LLM HTTP ${r.status} ${r.statusText} — ${t.slice(0, 400)}`,
      { status: r.status }
    );
  }

  const data = await r.json().catch(() => ({}));
  // Parse the common shapes returned by OpenAI-compatible servers
  let text = "";
  if (Array.isArray(data?.choices) && data.choices.length > 0) {
    const ch = data.choices[0];
    text =
      ch?.message?.content ??
      ch?.delta?.content ?? // some servers send delta even when non-streaming
      ch?.text ??
      "";
  } else if (typeof data?.message?.content === "string") {
    text = data.message.content;
  }

  return {
    text: String(text ?? ""),
    usage: data?.usage,
    raw: data,
  };
}
