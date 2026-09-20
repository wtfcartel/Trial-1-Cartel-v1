import { NextResponse } from "next/server";
import { getReportByDate } from "@/lib/logistics/reports";
import { loadSendBriefingEmailConfigFromEnv, sendBriefingEmail } from "@/lib/logistics/send-briefing-email";

export const runtime = "nodejs";

/**
 * Daily publication endpoint — the deterministic second half of the
 * pipeline. It is NOT a research engine: turning "the last 24 hours of
 * Australian logistics activity" into a verified, evidence-labelled master
 * report is an open-ended research + verification task (search, cross-
 * reference, judgement calls per the evidence-classification rules), which
 * belongs to an LLM-driven step upstream of this route — e.g. an agent run
 * that writes data/intelligence/<date>.json — not to fixed server code.
 *
 * What this route DOES do, once that JSON file exists on disk:
 *   1. Load and sanity-check the day's report.
 *   2. Confirm the web reader can already serve it at /intelligence/<date>
 *      (no action needed — it reads the same file).
 *   3. Optionally send the Microsoft 365 briefing email with the dated
 *      Listen/PDF/Read links, if LOGISTICS_SEND_EMAIL=true and Microsoft
 *      365 + recipient env vars are configured.
 *
 * Intended trigger: an external scheduler (e.g. Vercel Cron, or any cron
 * that can call an HTTPS endpoint) hitting this route at 07:00
 * Australia/Melbourne with the shared secret header, once the day's JSON
 * has been produced by the upstream research step.
 */
export async function POST(request: Request) {
  const secret = process.env.LOGISTICS_CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "LOGISTICS_CRON_SECRET is not configured on the server" },
      { status: 503 }
    );
  }
  if (request.headers.get("x-logistics-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = (await request.json().catch(() => ({}))) as { date?: string };
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  const report = await getReportByDate(targetDate);
  if (!report) {
    return NextResponse.json(
      {
        error: `No report found for ${targetDate}. The research/verification step must write data/intelligence/${targetDate}.json before this endpoint can publish it.`,
      },
      { status: 404 }
    );
  }

  const result: {
    date: string;
    webPublished: true;
    pdfUrl: string | undefined;
    emailSent: boolean;
    emailError?: string;
  } = {
    date: targetDate,
    webPublished: true, // same JSON file already served by the /intelligence/[date] route
    pdfUrl: report.pdfUrl,
    emailSent: false,
  };

  if (process.env.LOGISTICS_SEND_EMAIL === "true") {
    const recipients = (process.env.LOGISTICS_RECIPIENTS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const config = loadSendBriefingEmailConfigFromEnv(recipients);
      await sendBriefingEmail(report, config);
      result.emailSent = true;
    } catch (err) {
      // Per spec: never silently fall back to another provider — report the failure
      // and keep the already-published web report + PDF intact.
      result.emailError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(result);
}
