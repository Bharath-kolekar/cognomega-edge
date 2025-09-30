
import { CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";

let enginePromise: Promise<MLCEngineInterface> | null = null;

export function getEngine(model: string): Promise<MLCEngineInterface> {
  if (!enginePromise) {
    enginePromise = CreateWebWorkerMLCEngine({
      model,
      // Small default for quicker startup; user can switch to larger model in UI
      // Example: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"
    });
  }
  return enginePromise;
}
