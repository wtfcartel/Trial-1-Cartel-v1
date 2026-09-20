// Speech playback is behind an interface so the browser's built-in speech
// synthesis (Phase 1, no audio generated or stored — the listener's own
// device does the text-to-speech) can later be swapped for a hosted
// provider (e.g. a future KokoroSpeechProvider) without changing the
// reader UI or the report/narration pipeline that feeds it.

export interface SpeechChapter {
  id: string;
  title: string;
  text: string;
}

export type PlaybackState = "idle" | "speaking" | "paused" | "ended" | "unsupported" | "error";

export interface SpeechProviderEvents {
  onStateChange?: (state: PlaybackState) => void;
  onChapterChange?: (index: number) => void;
  onError?: (message: string) => void;
}

export interface VoiceOption {
  id: string;
  label: string;
  lang: string;
}

export interface SpeechProvider {
  isSupported(): boolean;
  listVoices(): Promise<VoiceOption[]>;
  speakFrom(index: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  setVoice(voiceId: string | null): void;
  destroy(): void;
}

const AU_EN = /^en-AU/i;
const GB_EN = /^en-GB/i;
const ANY_EN = /^en/i;

function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => AU_EN.test(v.lang)) ??
    voices.find((v) => GB_EN.test(v.lang)) ??
    voices.find((v) => ANY_EN.test(v.lang)) ??
    voices[0] ??
    null
  );
}

/** Phase 1 implementation: window.speechSynthesis + SpeechSynthesisUtterance. */
export class BrowserSpeechProvider implements SpeechProvider {
  private chapters: SpeechChapter[];
  private events: SpeechProviderEvents;
  private rate = 1.0;
  private voiceId: string | null = null;
  private currentIndex = -1;
  private synth: SpeechSynthesis | null;

  constructor(chapters: SpeechChapter[], events: SpeechProviderEvents = {}) {
    this.chapters = chapters;
    this.events = events;
    this.synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  }

  isSupported(): boolean {
    return this.synth !== null && typeof window !== "undefined" && "SpeechSynthesisUtterance" in window;
  }

  async listVoices(): Promise<VoiceOption[]> {
    if (!this.synth) return [];
    const existing = this.synth.getVoices();
    const voices = existing.length > 0 ? existing : await this.waitForVoices();
    return voices
      .filter((v) => ANY_EN.test(v.lang))
      .map((v) => ({ id: v.voiceURI, label: `${v.name} (${v.lang})`, lang: v.lang }));
  }

  private waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.synth) return Promise.resolve([]);
    return new Promise((resolve) => {
      const handle = () => {
        resolve(this.synth!.getVoices());
        this.synth!.removeEventListener("voiceschanged", handle);
      };
      this.synth!.addEventListener("voiceschanged", handle);
      // Some browsers never fire voiceschanged if voices are already cached.
      setTimeout(() => resolve(this.synth!.getVoices()), 500);
    });
  }

  setRate(rate: number) {
    this.rate = rate;
    if (this.currentIndex >= 0 && this.synth?.speaking) {
      this.speakFrom(this.currentIndex);
    }
  }

  setVoice(voiceId: string | null) {
    this.voiceId = voiceId;
  }

  speakFrom(index: number) {
    if (!this.synth) {
      this.events.onStateChange?.("unsupported");
      return;
    }
    if (index < 0 || index >= this.chapters.length) return;
    this.synth.cancel();
    this.currentIndex = index;
    this.queueFrom(index);
    this.events.onChapterChange?.(index);
    this.events.onStateChange?.("speaking");
  }

  private queueFrom(index: number) {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    const voice = this.voiceId
      ? voices.find((v) => v.voiceURI === this.voiceId) ?? pickDefaultVoice(voices)
      : pickDefaultVoice(voices);

    for (let i = index; i < this.chapters.length; i++) {
      const chapter = this.chapters[i];
      const utterance = new SpeechSynthesisUtterance(chapter.text);
      utterance.rate = this.rate;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        this.currentIndex = i;
        this.events.onChapterChange?.(i);
        this.events.onStateChange?.("speaking");
      };
      utterance.onend = () => {
        if (i === this.chapters.length - 1) {
          this.events.onStateChange?.("ended");
        }
      };
      utterance.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") return;
        this.events.onError?.(`Speech playback error: ${e.error}`);
        this.events.onStateChange?.("error");
      };

      this.synth.speak(utterance);
    }
  }

  pause() {
    this.synth?.pause();
    this.events.onStateChange?.("paused");
  }

  resume() {
    this.synth?.resume();
    this.events.onStateChange?.("speaking");
  }

  stop() {
    this.synth?.cancel();
    this.currentIndex = -1;
    this.events.onStateChange?.("idle");
  }

  destroy() {
    this.synth?.cancel();
  }
}
