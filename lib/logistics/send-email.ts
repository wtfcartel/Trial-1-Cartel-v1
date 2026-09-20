import type { IntelligenceReport } from "./types";
import { buildBriefingEmailHtml, buildBriefingEmailSubject } from "./email-template";

/**
 * Sends the daily briefing via Resend (preferred — a single API key, no
 * admin console) or generic SMTP (nodemailer), whichever is configured.
 * The Microsoft 365 Graph path in send-briefing-email.ts remains available
 * separately if that's ever set up instead; this module doesn't touch it.
 */
export interface SendEmailConfig {
  recipients: string[];
  baseUrl: string;
  /** e.g. "LogisticsDx <reports@logisticsdx.com>" */
  fromAddress: string;
}

export function loadSendEmailConfigFromEnv(recipients: string[]): SendEmailConfig {
  const baseUrl = process.env.LOGISTICSDX_BASE_URL;
  const fromAddress = process.env.LOGISTICS_FROM_ADDRESS;

  const missing = [
    ["LOGISTICSDX_BASE_URL", baseUrl],
    ["LOGISTICS_FROM_ADDRESS", fromAddress],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Cannot send LogisticsDx briefing email — missing environment variables: ${missing.join(", ")}. ` +
        `Outputs generated so far (report/PDF/web page) remain valid; only sending is blocked.`
    );
  }

  return { recipients, baseUrl: baseUrl!, fromAddress: fromAddress! };
}

async function sendViaResend(subject: string, html: string, config: SendEmailConfig) {
  const apiKey = process.env.RESEND_API_KEY!;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromAddress,
      to: config.recipients,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend sendMail failed (${res.status}): ${await res.text()}`);
  }
}

async function sendViaSmtp(subject: string, html: string, config: SendEmailConfig) {
  const { createTransport } = await import("nodemailer");
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: config.fromAddress,
    to: config.recipients.join(", "),
    subject,
    html,
  });
}

/**
 * Picks Resend if RESEND_API_KEY is set, otherwise SMTP if SMTP_HOST/
 * SMTP_USER/SMTP_PASS are set. Throws — never silently no-ops or falls
 * back to a provider you didn't configure — if neither is available.
 */
export async function sendBriefingEmail(
  report: IntelligenceReport,
  config: SendEmailConfig
): Promise<{ provider: "resend" | "smtp" }> {
  const html = buildBriefingEmailHtml(report, config.baseUrl);
  const subject = buildBriefingEmailSubject(report);

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(subject, html, config);
    return { provider: "resend" };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp(subject, html, config);
    return { provider: "smtp" };
  }
  throw new Error(
    "No email provider configured — set RESEND_API_KEY, or SMTP_HOST + SMTP_USER + SMTP_PASS."
  );
}
