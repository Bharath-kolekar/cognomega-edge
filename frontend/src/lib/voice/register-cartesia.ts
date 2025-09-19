// frontend/src/lib/voice/register-cartesia.ts
import { registerCartesiaBatch, registerCartesiaRealtime } from "./tts";
import { cartesiaBatchEngine, cartesiaRealtimeEngine } from "./cartesiaAdapters";

// Register engines so the dispatcher can pick them via flags.
registerCartesiaBatch(cartesiaBatchEngine);
registerCartesiaRealtime(cartesiaRealtimeEngine);
