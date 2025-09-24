import { z } from "zod";
import { llmComplete } from "../lib/llmAdapter.mjs";
import { estimateTokens } from "../lib/tokens.mjs";

export const SkillRequest = z.object({
  skill: z.string().min(1),
  input: z.string().min(1),
  locale: z.string().default("en"),
  extras: z.record(z.any()).optional()
});

export const skills = {
  summarize: {
    title: "Summarize",
    run: async ({input}) => {
      const sys = "You are a precise summarizer. Output 5 crisp bullets only.";
      const out = await llmComplete({system: sys, prompt: input, max_tokens: 300});
      return { kind:"bullets", content: out };
    }
  },
  explain: {
    title: "Explain Simply",
    run: async ({input}) => {
      const sys = "Explain simply for a smart 12-year-old. Use short sentences.";
      const out = await llmComplete({system: sys, prompt: input, max_tokens: 400});
      return { kind:"explanation", content: out };
    }
  },
  action_items: {
    title: "Action Items",
    run: async ({input}) => {
      const sys = "Extract ordered, actionable tasks. Start each with a verb. Include owners if present.";
      const out = await llmComplete({system: sys, prompt: input, max_tokens: 320});
      return { kind:"tasks", content: out };
    }
  },
  translate: {
    title: "Translate",
    run: async ({input, extras}) => {
      const to = (extras?.to || "en").slice(0,10);
      const sys = `Translate into ${to}. Keep meaning; no extra commentary.`;
      const out = await llmComplete({system: sys, prompt: input, max_tokens: 512});
      return { kind:"translation", lang: to, content: out };
    }
  },
  rag_lite: {
    title: "Smart Search (Lite)",
    run: async ({input}) => {
      const sys = "Answer concisely. If unsure, say what info is needed.";
      const out = await llmComplete({system: sys, prompt: `Question:\n${input}\n\nIf context is missing, list the needed docs.`});
      return { kind:"answer", content: out };
    }
  },
  voice_reply: {
    title: "Voice Reply",
    run: async ({input}) => {
      const sys = "Compose a short spoken-style answer (2-4 sentences).";
      const text = await llmComplete({system: sys, prompt: input, max_tokens: 180});
      return { kind:"speech_text", content: text };
    }
  }
};

export function estimateUsage(skillName, input, output){
  const inTok  = estimateTokens(input);
  const outTok = estimateTokens(output?.content || "");
  return { tokens_in: inTok, tokens_out: outTok, r2_class_a: 0, r2_class_b: 0, r2_gb_retrieved: 0 };
}

export async function runSkill(payload){
  const p = SkillRequest.parse(payload);
  const s = skills[p.skill];
  if (!s) throw new Error(`Unknown skill: ${p.skill}`);
  const result = await s.run({ input: p.input, extras: p.extras||{} });
  const usage = estimateUsage(p.skill, p.input, result);
  return { result, usage };
}

export function listSkills(){
  return Object.entries(skills).map(([k,v])=>({ key:k, title:v.title }));
}
