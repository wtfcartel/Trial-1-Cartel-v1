import type { IntelligenceReport } from "./types";
import { buildBriefingEmailHtml, buildBriefingEmailSubject } from "./email-template";

/**
 * Sends the daily briefing through the organisation's Microsoft 365 /
 * Outlook mailbox via Microsoft Graph (application permissions, client
 * credentials flow) — never Gmail or any other provider as a fallback.
 *
 * NOT wired into any automatic trigger in this codebase. This project has
 * no real Microsoft 365 tenant, app registration or recipient list
 * configured, so this function is intentionally inert until an operator
 * supplies real credentials and calls it deliberately (e.g. from the
 * protected /api/logistics/generate route). It throws — rather than
 * silently no-op'ing or falling back to another provider — if required
 * configuration is missing, per "if Outlook delivery fails, report the
 * failure; do not silently fall back to Gmail."
 */
export interface SendBriefingEmailConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  /** Mailbox the email is sent from, e.g. reports@logisticsdx.com */
  senderUpn: string;
  recipients: string[];
  baseUrl: string;
}

export function loadSendBriefingEmailConfigFromEnv(recipients: string[]): SendBriefingEmailConfig {
  const tenantId = process.env.MS365_TENANT_ID;
  const clientId = process.env.MS365_CLIENT_ID;
  const clientSecret = process.env.MS365_CLIENT_SECRET;
  const senderUpn = process.env.MS365_SENDER_UPN;
  const baseUrl = process.env.LOGISTICSDX_BASE_URL;

  const missing = [
    ["MS365_TENANT_ID", tenantId],
    ["MS365_CLIENT_ID", clientId],
    ["MS365_CLIENT_SECRET", clientSecret],
    ["MS365_SENDER_UPN", senderUpn],
    ["LOGISTICSDX_BASE_URL", baseUrl],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Cannot send LogisticsDx briefing email — missing environment variables: ${missing.join(", ")}. ` +
        `Outputs generated so far (report/PDF/web page) remain valid; only sending is blocked.`
    );
  }

  return {
    tenantId: tenantId!,
    clientId: clientId!,
    clientSecret: clientSecret!,
    senderUpn: senderUpn!,
    recipients,
    baseUrl: baseUrl!,
  };
}

async function getGraphAccessToken(config: SendBriefingEmailConfig): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Microsoft 365 auth failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function sendBriefingEmail(
  report: IntelligenceReport,
  config: SendBriefingEmailConfig
): Promise<void> {
  const accessToken = await getGraphAccessToken(config);
  const html = buildBriefingEmailHtml(report, config.baseUrl);
  const subject = buildBriefingEmailSubject(report);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.senderUpn)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html },
          toRecipients: config.recipients.map((address) => ({ emailAddress: { address } })),
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Microsoft 365 sendMail failed (${res.status}): ${await res.text()}`);
  }
}
