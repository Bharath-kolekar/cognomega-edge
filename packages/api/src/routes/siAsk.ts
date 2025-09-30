/* eslint-disable @typescript-eslint/no-explicit-any */
// packages/api/src/routes/siAsk.ts
// Wires the public /api/si/ask endpoint to your local inference via the quality router.

import { pickModel } from "../qualityRouter";
import { localChatComplete, type ChatMessage } from "../providers/localLLM";
import { assertProviderAllowed } from "../providerGuard";

type Env = Record<string, unknown>;

function normalizeMessages(body: any): ChatMessage[] {
  // Accept OpenAI-style { messages } or a simple { prompt, system }
  const msgs: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : (() => {
        const out: ChatMessage[] = [];
        const sys = typeof body?.system === "string" && body.system.trim() ? body.system.trim() : "";
        const prompt = typeof body?.prompt === "string" ? body.prompt : "";
        if (sys) out.push({ role: "system", content: sys });
        out.push({ role: "user", content: prompt || "" });
        return out;
      })();

  // Ensure minimal shape
  return msgs
    .filter(Boolean)
    .map((m: any) => ({
      role: (m?.role || "user") as ChatMessage["role"],
      content: String(m?.content ?? ""),
      name: m?.name,
      tool_call_id: m?.tool_call_id,
    }));
}

function joinForHeuristics(messages: ChatMessage[], system?: string): string {
  const sys = system || "";
  const text = messages
    .map((m) => (m?.content ? `${m.role}: ${m.content}` : ""))
    .join("\n");
  return `${sys}\n${text}`;
}

export async function handleSiAsk(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // keep default {}
  }

  const messages = normalizeMessages(body);
  const tools = Array.isArray(body?.tools) ? body.tools : undefined;
  const system = typeof body?.system === "string" ? body.system : undefined;
  const requestedMaxCtx =
    Number.isFinite(Number(body?.max_tokens)) ? Number(body.max_tokens) : undefined;

  // Quality-aware choice
  const choice = pickModel({
    prompt: messages.find((m) => m.role === "user")?.content ?? "",
    system,
    joinedMessages: joinForHeuristics(messages, system),
    tools,
    maxContext: requestedMaxCtx,
  });

  // Policy: enforce local-only (will throw Response 403 if not allowed)
  assertProviderAllowed(choice.provider, env as any);

  // Call local inference
  try {
    const result = await localChatComplete(env as any, {
      model: choice.model,
      messages,
      temperature: choice.temperature,
      maxTokens: requestedMaxCtx ?? choice.maxTokens,
      tools,
    });

    const payload = {
      ok: true,
      provider: choice.provider,
      model: choice.model,
      message: { role: "assistant", content: result.text },
      usage: result.usage ?? null,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err: any) {
    // If the client threw a Response (with status), return it as-is
    if (err instanceof Response) return err;

    const detail = (err?.message || "").toString().slice(0, 400);
    return new Response(JSON.stringify({ ok: false, error: "local_llm_error", detail }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
