// frontend/src/lib/voice/cartesiaAdapters.ts
// Cartesia engines (batch + realtime).
// Batch engine fetches audio from our API proxy and plays it.
// Realtime is a stub for now (we’ll wire WebRTC/WebSocket once server issues tokens).

import type { TtsEngine, SpeakOpts } from "./tts";
import { apiUrl } from "@/lib/api/apiBase";

async function playAudioBlob(b: Blob) {
  const url = URL.createObjectURL(b);
  try {
    const a = new Audio();
    a.src = url;
    a.preload = "auto";
    await a.play().catch(() => a.play()); // retry once
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

export const cartesiaBatchEngine: TtsEngine = {
  name: "cartesia:batch",
  async speak(text: string, _opts?: SpeakOpts) {
    if (!text || !text.trim()) return;
    // POST to our Worker proxy. Expect audio/* back.
    const r = await fetch(apiUrl("/api/tts/cartesia/batch"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({
        text,
        // Optional: keep knobs here; server may ignore until configured
        voice: localStorage.getItem("tts.voice.id") || undefined,
        format: "mp3",
      }),
    });

    if (r.status === 501) {
      console.info("[TTS] Cartesia not configured on server yet; using fallback.");
      // Let the global dispatcher fall back (we’ll just no-op here so caller continues gracefully)
      return;
    }
    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      console.warn("[TTS] Cartesia batch failed:", r.status, msg);
      return;
    }
    const blob = await r.blob();
    await playAudioBlob(blob);
  },
};

// NOTE: This is a placeholder stub. We’ll replace with a true realtime transport once the
// backend issues ephemeral tokens. For now it behaves like “not available”, allowing fallback.
export const cartesiaRealtimeEngine: TtsEngine = {
  name: "cartesia:realtime",
  async speak(text: string) {
    console.info("[TTS] Cartesia realtime not wired yet; falling back.", { text });
    // Intentionally do nothing so the selector can fall back to batch/dummy.
  },
};
