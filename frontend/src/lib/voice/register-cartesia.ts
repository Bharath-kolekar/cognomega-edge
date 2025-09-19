/* frontend/src/lib/voice/register-cartesia.ts
 * Safe stub: registers Cartesia voice helpers.
 * - No-op if backend not configured (501s).
 * - Exposes window.__COG__.voice.say(text) to play TTS when available.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __COG__?: any;
  }
}

export async function registerCartesia(): Promise<void> {
  const state = (window.__COG__ = window.__COG__ || {});
  state.voice = state.voice || {};
  state.voice.cartesia = { available: false };

  // Capability probe (won’t throw the app if backend isn’t ready)
  try {
    const r = await fetch("/api/tts/cartesia/realtime-token");
    if (r.status === 200) {
      state.voice.cartesia.available = true;
    } else if (r.status === 501) {
      // Not wired yet, keep available=false
    } else {
      state.voice.cartesia.error = `status_${r.status}`;
    }
  } catch (e) {
    state.voice.cartesia.error = "probe_failed";
  }

  // Helper: batch TTS via backend; plays audio when available
  state.voice.say = async (
    text: string,
    opts?: { voice?: string; format?: "mp3" | "wav" }
  ) => {
    try {
      const res = await fetch("/api/tts/cartesia/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, voice: opts?.voice, format: opts?.format || "mp3" }),
      });

      const ctype = res.headers.get("content-type") || "";
      if (res.ok && ctype.startsWith("audio/")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        return { ok: true };
      }
      // 501 or other JSON errors: just report up
      return { ok: false, status: res.status };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };

  // Some example voices; your UI can present choices
  state.voice.voices = state.voice.voices || [
    { id: "alloy", name: "Alloy (neutral)" },
    { id: "verse", name: "Verse (warm)" },
    { id: "sonic", name: "Sonic (bright)" },
  ];

  console.info("[voice] Cartesia registration complete:", state.voice.cartesia);
}

export default registerCartesia;
