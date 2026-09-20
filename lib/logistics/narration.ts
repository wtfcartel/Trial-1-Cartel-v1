import type { IntelligenceReport } from "./types";
import type { SpeechChapter } from "./speech-provider";

/**
 * Turns the master report's precomputed narration script into the chapter
 * list the audio player speaks. The narration text itself is authored
 * alongside the rest of the master report (same source of truth as the
 * email/PDF/web reader) — this just assembles it into player chapters and
 * attaches the spoken intro/outro to the first/last chapter.
 */
export function buildSpeechChapters(report: IntelligenceReport): SpeechChapter[] {
  const { sections, intro, outro } = report.narration;
  return sections.map((section, i) => {
    const parts = [...section.paragraphs];
    if (i === 0) parts.unshift(...intro);
    if (i === sections.length - 1) parts.push(...outro);
    return { id: section.id, title: section.title, text: parts.join(" ") };
  });
}
