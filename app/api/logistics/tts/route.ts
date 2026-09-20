import { NextResponse } from "next/server";
import { z } from "zod";
import { getLatestReport, getReportByDate } from "@/lib/logistics/reports";
import { htmlToPlainText } from "@/lib/logistics/html-to-text";
import { mimeTypeFor, synthesizeSpeech } from "@/lib/logistics/openai-tts";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().min(1).optional(),
  html: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^latest$/).optional(),
  voice: z.string().optional(),
  model: z.string().optional(),
  format: z.enum(["mp3", "wav", "opus", "aac", "flac"]).optional(),
});

function reportPlainTextSummary(report: {
  executiveSummary: { tldr: string[] };
  narration: { intro: string[]; outro: string[] };
}): string {
  return [...report.narration.intro, ...report.executiveSummary.tldr, ...report.narration.outro].join(
    "\n\n"
  );
}

/**
 * Converts email body text (or HTML, or a stored LogisticsDx report date)
 * into spoken-word audio via OpenAI's TTS API. Built for a ChatGPT Custom
 * GPT Action (see openapi/logistics-tts.yaml) or any other caller that
 * needs actual audio bytes rather than device-side speech synthesis.
 *
 * Protected by a shared API key so a publicly deployed instance can't be
 * used to run up an arbitrary OpenAI bill — set LOGISTICS_TTS_API_KEY and
 * put the same value in the caller's "x-logistics-tts-key" header (e.g. a
 * Custom GPT Action's API Key auth field).
 */
export async function POST(request: Request) {
  const requiredKey = process.env.LOGISTICS_TTS_API_KEY;
  if (!requiredKey) {
    return NextResponse.json(
      { error: "LOGISTICS_TTS_API_KEY is not configured on the server" },
      { status: 503 }
    );
  }
  if (request.headers.get("x-logistics-tts-key") !== requiredKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { text, html, date, voice, model, format } = parsed.data;

  let input: string;
  if (text) {
    input = text;
  } else if (html) {
    input = htmlToPlainText(html);
  } else if (date) {
    const report = date === "latest" ? await getLatestReport() : await getReportByDate(date);
    if (!report) {
      return NextResponse.json({ error: `No report found for ${date}` }, { status: 404 });
    }
    input = reportPlainTextSummary(report);
  } else {
    return NextResponse.json({ error: "Provide one of: text, html, date" }, { status: 400 });
  }

  try {
    const { audio, format: outputFormat } = await synthesizeSpeech(input, { voice, model, format });
    return NextResponse.json({
      audioBase64: audio.toString("base64"),
      mimeType: mimeTypeFor(outputFormat),
      characters: input.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
