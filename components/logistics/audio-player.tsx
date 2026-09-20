"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  BrowserSpeechProvider,
  type PlaybackState,
  type SpeechChapter,
  type SpeechProvider,
  type VoiceOption,
} from "@/lib/logistics/speech-provider";

const RATES = [1.0, 1.25, 1.5, 1.75, 2.0];

function noSubscription() {
  return () => {};
}

function speechSynthesisIsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Optimistic on the server (no window) — corrected on the client without an effect. */
function speechSynthesisIsSupportedOnServer() {
  return true;
}

export function AudioPlayer({
  chapters,
  reportTitle,
  reportDateLabel,
}: {
  chapters: SpeechChapter[];
  reportTitle: string;
  reportDateLabel: string;
}) {
  const providerRef = useRef<SpeechProvider | null>(null);
  const supported = useSyncExternalStore(
    noSubscription,
    speechSynthesisIsSupported,
    speechSynthesisIsSupportedOnServer
  );
  const [state, setState] = useState<PlaybackState>("idle");
  const [chapterIndex, setChapterIndex] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const provider = new BrowserSpeechProvider(chapters, {
      onStateChange: setState,
      onChapterChange: setChapterIndex,
      onError: setErrorMessage,
    });
    providerRef.current = provider;
    if (provider.isSupported()) {
      provider.listVoices().then(setVoices);
    }
    return () => provider.destroy();
    // Chapters are fixed for the lifetime of a report page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `LogisticsDx Market Intelligence — ${reportDateLabel}`,
      artist: "LogisticsDx",
      album: "Daily Market Intelligence",
    });
    navigator.mediaSession.setActionHandler("play", () => handlePlayPause());
    navigator.mediaSession.setActionHandler("pause", () => handlePlayPause());
    navigator.mediaSession.setActionHandler("previoustrack", () => goToChapter(chapterIndex - 1));
    navigator.mediaSession.setActionHandler("nexttrack", () => goToChapter(chapterIndex + 1));
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
      } catch {
        // Media Session isn't required for the reader to work.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIndex, state]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = state === "speaking" ? "playing" : "paused";
  }, [state]);

  function handlePlayPause() {
    const provider = providerRef.current;
    if (!provider) return;
    if (state === "speaking") {
      provider.pause();
    } else if (state === "paused") {
      provider.resume();
    } else {
      provider.speakFrom(chapterIndex);
    }
  }

  function handleStop() {
    providerRef.current?.stop();
    setChapterIndex(0);
  }

  function goToChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;
    providerRef.current?.speakFrom(index);
  }

  function handleRateChange(next: number) {
    setRate(next);
    providerRef.current?.setRate(next);
  }

  function handleVoiceChange(next: string) {
    setVoiceId(next || null);
    providerRef.current?.setVoice(next || null);
  }

  const currentChapter = chapters[chapterIndex];
  const playLabel = state === "speaking" ? "Pause" : state === "paused" ? "Resume" : "Play";

  const progressLabel = useMemo(
    () => `Section ${chapterIndex + 1} of ${chapters.length}`,
    [chapterIndex, chapters.length]
  );

  if (!supported) {
    return (
      <div
        role="status"
        className="rounded-lg border border-[var(--ldx-grey)]/30 bg-[var(--ldx-charcoal)] p-4 text-sm text-white/80"
      >
        Audio playback isn&apos;t supported by this browser. You can still read the full briefing
        below.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{reportTitle}</p>
          <p className="truncate text-xs text-white/60">
            {currentChapter?.title ?? "Ready to play"} · {progressLabel}
          </p>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous section"
          onClick={() => goToChapter(chapterIndex - 1)}
          disabled={chapterIndex === 0}
          className="flex h-11 min-w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30"
        >
          ⏮
        </button>
        <button
          type="button"
          aria-label={playLabel}
          onClick={handlePlayPause}
          className="flex h-14 min-w-14 items-center justify-center rounded-full bg-[var(--ldx-red)] text-xl font-semibold text-white hover:brightness-110"
        >
          {state === "speaking" ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          aria-label="Stop"
          onClick={handleStop}
          className="flex h-11 min-w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          ⏹
        </button>
        <button
          type="button"
          aria-label="Next section"
          onClick={() => goToChapter(chapterIndex + 1)}
          disabled={chapterIndex === chapters.length - 1}
          className="flex h-11 min-w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30"
        >
          ⏭
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {RATES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRateChange(r)}
            aria-pressed={rate === r}
            className={`min-h-11 rounded-full px-3 text-xs font-medium ${
              rate === r ? "bg-white text-[var(--ldx-black)]" : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {r}×
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowSettings((s) => !s)}
        className="mt-3 w-full text-center text-xs text-white/50 underline underline-offset-2"
      >
        Audio settings
      </button>

      {showSettings && (
        <div className="mt-2">
          <label htmlFor="ldx-voice" className="block text-xs text-white/60">
            Voice
          </label>
          <select
            id="ldx-voice"
            value={voiceId ?? ""}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="mt-1 w-full rounded-md bg-white/10 p-2 text-sm text-white"
          >
            <option value="">Automatic (prefers Australian English)</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav aria-label="Jump to section" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => goToChapter(i)}
            aria-current={i === chapterIndex}
            className={`shrink-0 rounded-full px-3 py-2 text-xs whitespace-nowrap ${
              i === chapterIndex
                ? "bg-[var(--ldx-red)] text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {c.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
