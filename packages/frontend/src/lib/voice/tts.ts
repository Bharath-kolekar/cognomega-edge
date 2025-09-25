// frontend/src/lib/voice/tts.ts
import { getPrefs, getEngine as getEnginePref, getMode as getModePref } from "./flags";

export type SpeakOpts = {
  rate?: number;   // 0.5..2
  pitch?: number;  // 0..2
  volume?: number; // 0..1
};

export interface TtsEngine {
  name: string;
  init?: () => Promise<void> | void;
  speak: (text: string, opts?: SpeakOpts) => Promise<void>;
}

// --- Dummy engine (browser SpeechSynthesis) ---
class DummyEngine implements TtsEngine {
  name = "dummy";
  async speak(text: string, opts: SpeakOpts = {}) {
    const ss = globalThis.speechSynthesis;
    if (!ss || typeof SpeechSynthesisUtterance === "undefined") {
      console.log("[TTS:dum] > ", text);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (opts.rate) u.rate = opts.rate;
    if (opts.pitch) u.pitch = opts.pitch;
    if (opts.volume !== undefined) u.volume = opts.volume;
    ss.cancel(); // barge-in
    ss.speak(u);
  }
}
const dummy = new DummyEngine();

// --- Placeholders we’ll register in Step 2 ---
let cartesiaRealtime: TtsEngine | null = null;
let cartesiaBatch: TtsEngine | null = null;

export function registerCartesiaRealtime(engine: TtsEngine) { cartesiaRealtime = engine; }
export function registerCartesiaBatch(engine: TtsEngine) { cartesiaBatch = engine; }

function pickEngine(): TtsEngine {
  const prefs = getPrefs();
  const wantEngine = prefs.engine;      // "auto" | "cartesia" | "dummy"
  const wantMode = prefs.mode;          // "auto" | "realtime" | "batch"

  // Auto choose best available
  if (wantEngine === "auto") {
    if (wantMode === "realtime" && cartesiaRealtime) return cartesiaRealtime;
    if (wantMode === "batch" && cartesiaBatch) return cartesiaBatch;
    // Auto: prefer realtime if present
    if (cartesiaRealtime) return cartesiaRealtime;
    if (cartesiaBatch) return cartesiaBatch;
    return dummy;
  }

  if (wantEngine === "cartesia") {
    if (wantMode === "realtime" && cartesiaRealtime) return cartesiaRealtime;
    if (wantMode === "batch" && cartesiaBatch) return cartesiaBatch;
    // fallback inside cartesia choice
    return cartesiaRealtime || cartesiaBatch || dummy;
  }

  // explicit dummy
  return dummy;
}

let _inited = false;
export async function ensureTts() {
  if (_inited) return;
  const e = pickEngine();
  if (e.init) await e.init();
  _inited = true;
}

export async function speak(text: string, opts?: SpeakOpts) {
  const e = pickEngine();
  return e.speak(text, opts);
}

// Helpers exposed for UI/telemetry
export function currentEngineName(): string {
  const e = pickEngine();
  return `${getEnginePref()}|${getModePref()} -> ${e.name}`;
}
