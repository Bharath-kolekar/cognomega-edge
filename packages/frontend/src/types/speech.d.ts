// frontend/src/types/speech.d.ts
/**
 * Minimal Web Speech API type shims so VoiceGuide compiles cleanly.
 * Chrome exposes SpeechRecognition as webkitSpeechRecognition.
 * These declarations are intentionally light-weight and future-proof.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export {}; // ensure this is treated as a module

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives?: number;

    onaudiostart?: ((ev: Event) => any) | null;
    onsoundstart?: ((ev: Event) => any) | null;
    onspeechstart?: ((ev: Event) => any) | null;
    onspeechend?: ((ev: Event) => any) | null;
    onsoundend?: ((ev: Event) => any) | null;
    onaudioend?: ((ev: Event) => any) | null;

    onstart?: ((ev: Event) => any) | null;
    onend?: ((ev: Event) => any) | null;
    onerror?: ((ev: any) => any) | null;

    onresult?: ((ev: any) => any) | null;
    onnomatch?: ((ev: any) => any) | null;

    start(): void;
    stop(): void;
    abort(): void;
  }

  interface Window {
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
}
