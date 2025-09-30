// RESOLVED CONFLICT: Merged SmartAIRouter (Groq/fallback logic) with engine/task routing utilities

// --- AI Routing Config and SmartAIRouter (feat/v0-import) ---
export interface AIConfig {
  useGroq: boolean;
  fallbackToFree: boolean;
  dailyTokenLimit: number;
  currentUsage: number;
}

class SmartAIRouter {
  private config: AIConfig = {
    useGroq: true,
    fallbackToFree: true,
    dailyTokenLimit: 100000,
    currentUsage: 0,
  };

  async generateResponse(prompt: string): Promise<string> {
    if (this.shouldUseGroq(prompt)) {
      try {
        const response = await this.callGroqAPI(prompt);
        this.trackUsage(response.usage?.total_tokens || 0);
        return response.choices[0]?.message?.content || "";
      } catch (error) {
        console.log("[v0] Groq failed, falling back to free alternative:", error);
        return this.freeAlternativeResponse(prompt);
      }
    }
    return this.freeAlternativeResponse(prompt);
  }

  private shouldUseGroq(prompt: string): boolean {
    const complexity = this.assessComplexity(prompt);
    const withinLimits = this.config.currentUsage < this.config.dailyTokenLimit;
    return this.config.useGroq && complexity > 0.6 && withinLimits;
  }

  private assessComplexity(prompt: string): number {
    const indicators = [
      /code|programming|function|algorithm/i,
      /explain|analyze|compare|evaluate/i,
      /creative|story|poem|essay/i,
      /complex|detailed|comprehensive/i,
    ];
    const matches = indicators.filter((regex) => regex.test(prompt)).length;
    return matches / indicators.length;
  }

  private async callGroqAPI(prompt: string): Promise<{ 
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  }> {
    const groqApiKey = typeof process !== 'undefined' && process.env ? process.env.GROQ_API_KEY : undefined;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey || ''}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    return response.json();
  }

  private freeAlternativeResponse(prompt: string): string {
    return this.generateRuleBasedResponse(prompt);
  }

  private generateRuleBasedResponse(prompt: string): string {
    const patterns = [
      { pattern: /hello|hi|hey/i, response: "Hello! How can I help you today?" },
      { pattern: /code|programming/i, response: "I can help with coding questions using templates and patterns." },
      { pattern: /explain|what is/i, response: "Let me provide a structured explanation based on common patterns." },
    ];
    for (const { pattern, response } of patterns) {
      if (pattern.test(prompt)) {
        return response;
      }
    }
    return "I understand your request. Let me provide a helpful response using available resources.";
  }

  private trackUsage(tokens: number): void {
    this.config.currentUsage += tokens;
    // Reset daily usage at midnight
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      this.config.currentUsage = 0;
    }
  }
}

export const aiRouter = new SmartAIRouter();

// --- Engine Routing Utilities (main) ---
export type EngineType =
  | 'reasoning'
  | 'nlp'
  | 'semantic'
  | 'memory'
  | 'super'
  | 'voice'
  | 'vision'
  | 'quantum'
  | 'custom';

export interface TaskPayload {
  type: EngineType;
  payload: Record<string, unknown>;
  user?: string;
  priority?: number;
  context?: Record<string, unknown>;
  feedback?: string;
  agentSwarm?: string[];
}

export interface RoutingResult {
  engine: string;
  status: 'queued' | 'executed' | 'failed' | 'swarmed';
  output?: unknown;
  agentFeedback?: string;
  swarmAgents?: string[];
}

type EngineHandler = (task: TaskPayload) => unknown;

const engineRegistry: Record<string, EngineHandler> = {};

export function registerEngine(name: string, handler: EngineHandler): void {
  engineRegistry[name] = handler;
}

export function routeToEngine(task: TaskPayload): RoutingResult {
  let engine = 'unknown-engine';
  switch (task.type) {
    case 'reasoning': engine = 'advanced-reasoning-engine'; break;
    case 'nlp': engine = 'nlp-utils'; break;
    case 'semantic': engine = 'semantic-nlp-engine'; break;
    case 'memory': engine = 'contextual-memory'; break;
    case 'super': engine = 'super-intelligence-engine'; break;
    case 'voice': engine = 'voice-engine'; break;
    case 'vision': engine = 'vision-engine'; break;
    case 'quantum': engine = 'quantum-engine'; break;
    case 'custom': engine = task.payload?.engineName as string ?? 'custom'; break;
  }
  if (engineRegistry[engine]) {
    try {
      const output = engineRegistry[engine](task);
      return { engine, status: 'executed', output, agentFeedback: 'Execution succeeded.' };
    } catch (e) {
      return { engine, status: 'failed', output: e, agentFeedback: 'Execution failed.' };
    }
  }
  return { engine, status: 'queued', output: null, agentFeedback: 'Engine not registered.' };
}

export function getRegisteredEngines(): string[] {
  return Object.keys(engineRegistry);
}