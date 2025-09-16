// frontend/src/components/VoiceGuide.tsx
/**
 * VoiceGuide — lightweight AI-style voice guidance for your UI.
 * - Uses Web Speech API (no deps). Gracefully no-ops if unsupported.
 * - Speaks contextual tips on hover/focus with throttling & per-element cooldown.
 * - Toggle button persists in localStorage.
 * - You can add data-voice-hint="Your custom hint" to any element.
 * - Keyboard:
 *    • Alt+V — toggle on/off
 *    • Alt+H — speak hint for the currently focused element
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
  // Optionally skip hints for elements matching these selectors (comma-separated).
  skipSelectors?: string;
  // Where to mount the floating toggle (default bottom-right)
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  // Hide the floating toggle if Speech Synthesis is unsupported (default: false)
  hideIfUnsupported?: boolean;
  // Enable Alt+V (toggle) and Alt+H (read focused)
  hotkeys?: boolean;
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
  skipSelectors,
  position = "bottom-right",
  hideIfUnsupported = false,
  hotkeys = true,
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

  // Hotkeys: Alt+V toggle, Alt+H read hint for focused element
  useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.altKey && !e.ctrlKey && !e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "v") {
        e.preventDefault();
        setEnabled((v) => !v);
      } else if (k === "h") {
        e.preventDefault();
        const el = (document.activeElement as Element) || null;
        maybeSpeakFor(el, /*force*/ true);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hotkeys]);

  // Event listeners
  useEffect(() => {
    if (!enabled) return;
    const onOver = (e: Event) => maybeSpeakFor(targetFromEvent(e));
    const onFocus = (e: Event) => maybeSpeakFor(targetFromEvent(e));

    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("focusin", onFocus, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, selectors, skipSelectors, rateLimitMs, perElemCooldownMs]);

  function targetFromEvent(e: Event): Element | null {
    const t = e.target as Element | null;
    if (!t) return null;
    // Prefer closest element with a hint or role
    const hinted = (t.closest("[data-voice-hint]") as Element) || t;
    return hinted;
  }

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

  function isSkipped(el: Element | null): boolean {
    if (!el) return true;
    if ((el as HTMLElement).dataset?.voiceSkip === "1") return true;
    if (skipSelectors && skipSelectors.trim()) {
      try {
        return !!el.closest(skipSelectors);
      } catch {
        // invalid selector — ignore
      }
    }
    return false;
  }

  function hintFor(el: Element | null): string | null {
    if (!el) return null;

    // 0) skip if requested
    if (isSkipped(el)) return null;

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

    // 3) ARIA/title/placeholder synthesis
    const he = el as HTMLElement;
    const aria = he.getAttribute?.("aria-label");
    const title = he.getAttribute?.("title");
    const ph =
      he.getAttribute?.("placeholder") ||
      (he.tagName?.toLowerCase() === "input"
        ? (he as HTMLInputElement).placeholder
        : "");
    const labelFromAttr = aria || title || ph;
    if (labelFromAttr && labelFromAttr.trim()) {
      return normalizeSentence(labelFromAttr.trim());
    }

    // 4) element type fallbacks
    const tag = he.tagName?.toLowerCase?.() || "";
    if (tag === "textarea")
      return "Type your prompt here. Press control or command and enter to submit.";
    if (tag === "button") return "Click to perform an action.";
    if (tag === "select") return "Open the menu and choose an option.";
    if (tag === "input") return "Provide input here.";
    return null;
  }

  function normalizeSentence(s: string): string {
    const t = s.replace(/\s+/g, " ").trim();
    if (!t) return t;
    const ends = /[.!?]$/;
    return ends.test(t) ? t : `${t}.`;
  }

  function maybeSpeakFor(el: Element | null, force = false) {
    if (!enabled || !el) return;
    if (!force && speakingRef.current) return;

    // Respect reduced motion / user preference: silently return
    try {
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (reduced) return;
    } catch {}

    const msg = hintFor(el);
    if (!msg) return;

    const now = Date.now();
    const last = elemCooldown.current.get(el) || 0;
    if (!force && now - last < perElemCooldownMs) return;

    elemCooldown.current.set(el, now);
    speak(msg);
  }

  if (hideIfUnsupported && !supportsSpeech()) {
    return null;
  }

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Disable voice guide" : "Enable voice guide"}
      onClick={() => setEnabled((v) => !v)}
      style={posStyle}
      title={
        enabled
          ? "Voice Guide: on (Alt+V to toggle, Alt+H to read focused)"
          : "Voice Guide: off (Alt+V to toggle)"
      }
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
