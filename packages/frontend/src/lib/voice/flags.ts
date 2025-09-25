// frontend/src/lib/voice/flags.ts
export type TtsEngineName = "auto" | "cartesia" | "dummy";
export type TtsMode = "auto" | "realtime" | "batch";
export type TtsGender = "male" | "female";
export type TtsMood = "neutral" | "friendly" | "energetic" | "calm";

const K = {
  engine: "tts.engine",
  mode: "tts.mode",
  gender: "tts.voice.gender",
  mood: "tts.voice.mood",
} as const;

const def = {
  engine: "auto" as TtsEngineName,
  mode: "auto" as TtsMode,
  gender: "female" as TtsGender,
  mood: "neutral" as TtsMood,
};

function get<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return (v && (v as T)) || fallback;
  } catch { return fallback; }
}
function set(key: string, v: string) {
  try { localStorage.setItem(key, v); } catch {}
}

export function getEngine(): TtsEngineName { return get(K.engine, def.engine); }
export function setEngine(v: TtsEngineName) { set(K.engine, v); }

export function getMode(): TtsMode { return get(K.mode, def.mode); }
export function setMode(v: TtsMode) { set(K.mode, v); }

export function getGender(): TtsGender { return get(K.gender, def.gender); }
export function setGender(v: TtsGender) { set(K.gender, v); }

export function getMood(): TtsMood { return get(K.mood, def.mood); }
export function setMood(v: TtsMood) { set(K.mood, v); }

export type TtsUserPrefs = {
  engine: TtsEngineName;
  mode: TtsMode;
  gender: TtsGender;
  mood: TtsMood;
};

export function getPrefs(): TtsUserPrefs {
  return {
    engine: getEngine(),
    mode: getMode(),
    gender: getGender(),
    mood: getMood(),
  };
}
