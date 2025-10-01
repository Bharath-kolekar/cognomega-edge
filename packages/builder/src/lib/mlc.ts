import { CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";

let enginePromise: Promise<MLCEngineInterface> | null = null;

export function getEngine(model: string): Promise<MLCEngineInterface> {
  if (!enginePromise) {
    // Create a web worker for MLC engine
    const worker = new Worker(
      new URL('../workers/mlc-worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    enginePromise = CreateWebWorkerMLCEngine(
      worker,
      model,
      {
        // Configuration options for the engine
      }
    );
  }
  return enginePromise;
}
