// The Web Speech API (SpeechRecognition) isn't part of TypeScript's
// standard DOM lib and is still vendor-prefixed in Chromium -- this is a
// deliberately minimal surface covering only what the orb actually uses,
// not a full type definition for the API.
export interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}

export interface SpeechRecognitionEventLike {
  results: { [index: number]: SpeechRecognitionResultLike };
}

export interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
