// frontend/src/components/VoiceGuide.tsx
/**
 * VoiceGuide — lightweight AI-style voice guidance for your UI.
 * - Uses Web Speech API (no deps). Gracefully no-ops if unsupported.
 * - Speaks contextual tips on hover/focus with throttling & per-element cooldown.
 * - Toggle button persists in localStorage.
 * - You can add data-voice-hint="Your custom hint" to any element.
 *
 * Usage:
 *   <VoiceGuide
 *     enabledByDefault={false}
 *     position="bottom-right"
 *     selectors={{
 *       "textarea": "Type your prompt. Press control or command and enter to submit.",
 *       "[data-role='builder']": "Open the real-time App Builder in a new tab."
 *     }}
 *   />
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

type SelectorHints = Record<string, string>;

type Props = {
  enabledByDefault?: boolean;
  rateLimitMs?: number;           // min time between utterances
  perElemCooldownMs?: number;     // cooldown per element
  voiceName?: string;             // optional preferred voice (substring match)
  rate?: number;                  // 0.1 - 10
  pitch?: number;                 // 0 - 2
  volume?: number;                // 0 - 1
  // Fallback hints by CSS selector. Elements with data-voice-hint take precedence.
  selectors?: SelectorHints;
  // Where to mount the floating toggle (default bottom-right)
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
};

const LS_KEY = "cm_voice_guide_enabled";

function supportsSpeech(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

export default function VoiceGuide({
  enabledByDefault = false,
  rateLimitMs = 1200,
  perElemCooldownMs = 15_000,
  voiceName,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
  selectors,
  position = "bottom-right",
}: Props) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      return v == null ? enabledByDefault : v === "1";
    } catch {
      return enabledByDefault;
    }
  });

  const speakingRef = useRef(false);
  const lastSpokenAtRef = useRef(0);
  const elemCooldown = useRef<Map<Element, number>>(new Map());
  const voicesRef = useRef<SpeechSynthesisVoice[] | null>(null);

  const posStyle = useMemo(() => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "#fff",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      fontFamily: "system-ui",
      display: "flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      userSelect: "none",
    };
    if (position === "bottom-right") return { ...base, right: 16, bottom: 16 };
    if (position === "bottom-left") return { ...base, left: 16, bottom: 16 };
    if (position === "top-right") return { ...base, right: 16, top: 16 };
    return { ...base, left: 16, top: 16 };
  }, [position]);

  // Persist setting & greet when enabling
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, enabled ? "1" : "0");
    } catch {}
    if (enabled && supportsSpeech()) {
      speak("Voice guide enabled. Hover over controls to hear tips.");
    } else if (!enabled && supportsSpeech()) {
      window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Load voices
  useEffect(() => {
    if (!supportsSpeech()) return;
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      voicesRef.current = vs;
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Event listeners
  useEffect(() => {
    if (!enabled) return;
    const onOver = (e: Event) => maybeSpeakFor(e.target as Element);
    const onFocus = (e: Event) => maybeSpeakFor(e.target as Element);

    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("focusin", onFocus, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, selectors]);

  function pickVoice(): SpeechSynthesisVoice | null {
    const list = voicesRef.current || [];
    if (voiceName) {
      const v = list.find((x) =>
        x.name.toLowerCase().includes(voiceName.toLowerCase())
      );
      if (v) return v;
    }
    // Prefer an English voice if available
    return (
      list.find((v) => (v.lang || "").toLowerCase().startsWith("en")) ||
      list[0] ||
      null
    );
  }

  function speak(text: string) {
    if (!supportsSpeech() || !text) return;
    const now = Date.now();
    if (now - lastSpokenAtRef.current < rateLimitMs) return;

    const u = new (window as any).SpeechSynthesisUtterance(text) as SpeechSynthesisUtterance;
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;

    speakingRef.current = true;
    lastSpokenAtRef.current = now;
    u.onend = () => {
      speakingRef.current = false;
    };
    u.onerror = () => {
      speakingRef.current = false;
    };

    window.speechSynthesis.speak(u);
  }

  function hintFor(el: Element | null): string | null {
    if (!el) return null;

    // 1) explicit hint attribute
    const withAttr = el.closest("[data-voice-hint]") as HTMLElement | null;
    if (withAttr && withAttr.dataset.voiceHint) return withAttr.dataset.voiceHint!;

    // 2) selector map
    if (selectors) {
      for (const [sel, msg] of Object.entries(selectors)) {
        try {
          if (el instanceof Element && el.closest(sel)) return msg;
        } catch {}
      }
    }

    // 3) common fallbacks
    const tag = (el as HTMLElement).tagName?.toLowerCase?.() || "";
    if (tag === "textarea")
      return "Type your prompt here. Press control or command and enter to submit.";
    if (tag === "button") return "Click to perform an action.";
    if (tag === "select") return "Open the menu and choose an option.";
    if (tag === "input") return "Provide input here.";
    return null;
  }

  function maybeSpeakFor(el: Element | null) {
    if (!enabled || !el || speakingRef.current) return;

    // Respect reduced motion / user preference: silently return
    try {
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (reduced) return;
    } catch {}

    const msg = hintFor(el);
    if (!msg) return;

    const now = Date.now();
    const last = elemCooldown.current.get(el) || 0;
    if (now - last < perElemCooldownMs) return;

    elemCooldown.current.set(el, now);
    speak(msg);
  }

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Disable voice guide" : "Enable voice guide"}
      onClick={() => setEnabled((v) => !v)}
      style={posStyle}
      title={enabled ? "Voice Guide: on" : "Voice Guide: off"}
    >
      <span
        style={{
          height: 10,
          width: 10,
          borderRadius: 999,
          background: enabled ? "#16a34a" : "#94a3b8",
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 12, color: "#111", fontWeight: 500 }}>
        Voice Guide {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
