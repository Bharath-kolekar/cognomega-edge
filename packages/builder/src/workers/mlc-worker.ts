import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Initialize the worker handler
const handler = new WebWorkerMLCEngineHandler();

// The handler will automatically respond to messages from the main thread
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
