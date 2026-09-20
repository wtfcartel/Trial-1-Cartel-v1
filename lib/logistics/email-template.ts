import type { IntelligenceReport } from "./types";
import { formatReportDateShort } from "./reports";

const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const RED = "#d81f2a";
const GREY = "#6b6b6f";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ctaRow(label: string, href: string, variant: "primary" | "secondary"): string {
  const bg = variant === "primary" ? RED : "#2a2a2c";
  return `
    <tr>
      <td style="padding:6px 0;">
        <a href="${href}" style="display:block;background:${bg};color:${WHITE};text-decoration:none;font-weight:bold;font-size:15px;padding:14px 20px;border-radius:6px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>`;
}

function tldrList(lines: string[]): string {
  return lines
    .map(
      (line) =>
        `<li style="margin-bottom:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5;">${escapeHtml(line)}</li>`
    )
    .join("");
}

/**
 * Builds the LogisticsDx Market Intelligence email — the written report is
 * the authoritative product; Listen/PDF are additional delivery
 * mechanisms layered on top of the same master report, not replacements
 * for it. Uses inline styles / a table layout for Outlook (Microsoft 365)
 * rendering compatibility.
 */
export function buildBriefingEmailHtml(report: IntelligenceReport, baseUrl: string): string {
  const dateShort = formatReportDateShort(report.reportDate);
  const readUrl = `${baseUrl}/intelligence/${report.reportDate}`;
  const pdfUrl = report.pdfUrl ? `${baseUrl}${report.pdfUrl}` : undefined;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${WHITE};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${BLACK};padding:24px 24px 20px;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:${WHITE};font-size:20px;font-weight:bold;letter-spacing:0.5px;">LOGISTICSDX MARKET INTELLIGENCE</div>
                <div style="font-family:Arial,Helvetica,sans-serif;color:${RED};font-size:13px;font-weight:bold;letter-spacing:1px;margin-top:4px;">${dateShort}</div>
              </td>
            </tr>
            ${
              report.isSampleData
                ? `<tr><td style="background:#fff4f4;padding:12px 24px;border-bottom:1px solid #f0d0d0;">
                     <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a1f1f;">${escapeHtml(report.sampleDataNote ?? "")}</div>
                   </td></tr>`
                : ""
            }
            <tr>
              <td style="padding:20px 24px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${ctaRow("🎧 LISTEN TO TODAY'S BRIEFING", readUrl, "primary")}
                  ${pdfUrl ? ctaRow("📄 VIEW FULL PDF", pdfUrl, "secondary") : ""}
                  ${ctaRow("📰 READ FULL REPORT", readUrl, "secondary")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 4px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${BLACK};text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${RED};padding-bottom:6px;">
                  TL;DR — What Matters Today
                </div>
                <ul style="padding-left:18px;margin:14px 0 0;">
                  ${tldrList(report.executiveSummary.tldr)}
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${GREY};line-height:1.6;">
                  This email contains a summary. Open <a href="${readUrl}" style="color:${RED};">the full report</a> for
                  Property Intelligence, Logistics Overview, Supply Chain Challenges, People &amp; Key Staff Movements,
                  Broad Industry Intelligence, Commercial Opportunities and the Watchlist.
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:${BLACK};padding:16px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9a9a9e;">
                  LogisticsDx — Diagnose. Strategise. Transform.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildBriefingEmailSubject(report: IntelligenceReport): string {
  return `LogisticsDx Market Intelligence - ${formatReportDateShort(report.reportDate)}`;
}
