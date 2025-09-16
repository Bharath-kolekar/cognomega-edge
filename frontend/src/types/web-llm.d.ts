// C:\dev\cognomega-edge\frontend\src\types\web-llm.d.ts

/**
 * Optional type shim for @mlc-ai/web-llm.
 * The package's published typings vary by version; this keeps the compiler happy
 * and provides light IntelliSense without locking you to a specific version.
 */
declare module "@mlc-ai/web-llm" {
  /** Progress events reported during engine initialization. */
  export interface InitProgressReport {
    progress?: number; // 0..1
    text?: string;     // human-readable step
  }

  /** Minimal, forward-compatible init shape for the Web Worker engine. */
  export interface WebWorkerMLCEngineInit {
    /** Model identifier, e.g. "Llama-3.1-8B-Instruct-q4f16_1-MLC" */
    model?: string;
    /** Optional app configuration bag forwarded to the engine. */
    appConfig?: Record<string, unknown>;
    /** Custom worker instance if you need to control its lifecycle. */
    worker?: Worker;
    /** Initialization progress callback. */
    initProgressCallback?: (r: InitProgressReport) => void;
    /** Keep open for future library flags without breaking your build. */
    [key: string]: unknown;
  }

  /**
   * Creates an MLC LLM engine running in a Web Worker.
   * `baseUrl` should point to the asset root or worker script location.
   */
  export function CreateWebWorkerMLCEngine(
    baseUrl: URL | string,
    init?: WebWorkerMLCEngineInit
  ): Promise<any>;

  /** Soft alias for the returned engine object (intentionally loose). */
  export type MLCEngine = any;
}
