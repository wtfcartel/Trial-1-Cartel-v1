// Server-side text-to-speech via OpenAI's Audio API. This is a deliberate
// departure from the browser-speech-only Phase 1 approach used by
// components/logistics/audio-player.tsx: it generates and returns a real
// audio file (paid API call), for callers — e.g. a ChatGPT Custom GPT
// Action — that need actual audio bytes rather than relying on the
// listener's own device to speak the text.

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

export type TtsFormat = "mp3" | "wav" | "opus" | "aac" | "flac";

export interface SynthesizeSpeechOptions {
  /** OpenAI TTS voice name, e.g. "alloy", "verse", "coral". */
  voice?: string;
  /** OpenAI TTS model, e.g. "gpt-4o-mini-tts", "tts-1", "tts-1-hd". */
  model?: string;
  format?: TtsFormat;
}

const MIME_TYPES: Record<TtsFormat, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  opus: "audio/opus",
  aac: "audio/aac",
  flac: "audio/flac",
};

export function mimeTypeFor(format: TtsFormat): string {
  return MIME_TYPES[format];
}

/**
 * OpenAI's TTS models cap input length per request (a few thousand
 * characters). Long report bodies should be chunked by the caller if they
 * exceed this; for a typical email TL;DR/body this is comfortably enough.
 */
export const MAX_TTS_INPUT_CHARACTERS = 4000;

export async function synthesizeSpeech(
  text: string,
  options: SynthesizeSpeechOptions = {}
): Promise<{ audio: Buffer; format: TtsFormat }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured — text-to-speech generation is unavailable until it is set."
    );
  }
  if (!text.trim()) {
    throw new Error("No text provided to synthesize.");
  }
  if (text.length > MAX_TTS_INPUT_CHARACTERS) {
    throw new Error(
      `Text is ${text.length} characters, over the ${MAX_TTS_INPUT_CHARACTERS}-character limit for a single request — split it into chunks and synthesize each separately.`
    );
  }

  const format = options.format ?? "mp3";

  const res = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-4o-mini-tts",
      voice: options.voice ?? "alloy",
      input: text,
      response_format: format,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI text-to-speech request failed (${res.status}): ${await res.text()}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer), format };
}
