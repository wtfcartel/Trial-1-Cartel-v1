import PDFDocument from "pdfkit";
import type { IntelligenceItem, IntelligenceReport } from "./types";
import { formatReportDateLong } from "./reports";

const BLACK = "#0a0a0a";
const CHARCOAL = "#1c1c1e";
const WHITE = "#ffffff";
const RED = "#d81f2a";
const GREY = "#8a8a8e";

const MARGIN = 40;
const HEADER_HEIGHT = 56;

function drawHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, HEADER_HEIGHT).fill(BLACK);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(13).text("LOGISTICSDX", MARGIN, 16);
  doc
    .fillColor(RED)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("MARKET INTELLIGENCE", MARGIN, 34, { characterSpacing: 1 });
  doc.fillColor("#000000");
  doc.y = HEADER_HEIGHT + 24;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  doc
    .fillColor(BLACK)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(title, MARGIN, doc.y, { width: doc.page.width - MARGIN * 2 });
  doc
    .moveTo(MARGIN, doc.y + 4)
    .lineTo(doc.page.width - MARGIN, doc.y + 4)
    .lineWidth(1.5)
    .strokeColor(RED)
    .stroke();
  doc.moveDown(1);
}

function labelValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  const width = doc.page.width - MARGIN * 2;
  ensureSpace(doc, 28);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(CHARCOAL).text(`${label}: `, MARGIN, doc.y, {
    continued: true,
    width,
  });
  doc.font("Helvetica").fillColor(CHARCOAL).text(value, { width });
}

function pill(doc: PDFKit.PDFDocument, text: string) {
  doc.font("Helvetica").fontSize(7.5).fillColor(GREY).text(`[ ${text} ]`, { continued: true });
  doc.text("  ", { continued: true });
}

function itemBlock(doc: PDFKit.PDFDocument, item: IntelligenceItem, kicker?: string) {
  ensureSpace(doc, 70);
  if (kicker) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(RED).text(kicker.toUpperCase(), MARGIN);
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(BLACK)
    .text(item.headline, MARGIN, doc.y, { width: doc.page.width - MARGIN * 2 });
  doc.font("Helvetica").fontSize(9.5).fillColor(CHARCOAL).text(item.tldr, {
    width: doc.page.width - MARGIN * 2,
  });
  if (item.observation) labelValue(doc, "Observation", item.observation);
  if (item.logisticsDxView) labelValue(doc, "LogisticsDx View", item.logisticsDxView);
  if (item.commercialTrigger) labelValue(doc, "Commercial Trigger", item.commercialTrigger);
  if (item.whatToWatchNext) labelValue(doc, "What to Watch Next", item.whatToWatchNext);
  doc.moveDown(0.3);
  pill(doc, item.confidence);
  if (item.timeHorizon) pill(doc, item.timeHorizon);
  doc.text("");
  if (item.sources.length > 0) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(7.5)
      .fillColor(GREY)
      .text(`Sources: ${item.sources.map((s) => s.label).join("; ")}`, {
        width: doc.page.width - MARGIN * 2,
      });
  }
  doc.moveDown(0.8);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .lineWidth(0.5)
    .strokeColor("#e5e5e5")
    .stroke();
  doc.moveDown(0.8);
}

export function generateReportPdf(report: IntelligenceReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = `LogisticsDx Market Intelligence — ${report.reportDate}`;
    doc.info.Author = "LogisticsDx";

    // Cover
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(BLACK);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(34).text("LOGISTICSDX", MARGIN, 160);
    doc
      .fillColor(RED)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("MARKET INTELLIGENCE", MARGIN, 205, { characterSpacing: 2 });
    doc
      .fillColor(WHITE)
      .font("Helvetica")
      .fontSize(20)
      .text(formatReportDateLong(report.reportDate), MARGIN, 250);
    doc.fillColor(GREY).font("Helvetica-Oblique").fontSize(11).text(report.tagline, MARGIN, 280);
    if (report.isSampleData) {
      doc
        .fillColor(RED)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("DEMONSTRATION REPORT — SAMPLE DATA, NOT LIVE INTELLIGENCE", MARGIN, doc.page.height - 90, {
          width: doc.page.width - MARGIN * 2,
        });
    }

    doc.addPage();
    doc.on("pageAdded", () => drawHeader(doc));
    drawHeader(doc);

    sectionTitle(doc, "TL;DR — What Matters Today");
    report.executiveSummary.tldr.forEach((line) => {
      ensureSpace(doc, 20);
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(CHARCOAL)
        .text(`•  ${line}`, MARGIN, doc.y, { width: doc.page.width - MARGIN * 2 });
      doc.moveDown(0.2);
    });

    sectionTitle(doc, "Section 1 — Property Report");
    report.property.forEach((item) => itemBlock(doc, item, item.company));

    sectionTitle(doc, "Section 2 — Logistics Overview");
    report.logistics.majorEvents.forEach((item) => itemBlock(doc, item, item.company));
    report.logistics.smeMoves.forEach((item) => itemBlock(doc, item, "SME SIGNAL"));

    sectionTitle(doc, "Section 3 — Supply Chain Challenges");
    report.supplyChain.forEach((item) => itemBlock(doc, item));

    sectionTitle(doc, "Section 4 — Broad Industry Intelligence: People & Key Staff Movements");
    report.industry.people.forEach((person) => {
      ensureSpace(doc, 60);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK).text(person.person, MARGIN);
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(CHARCOAL)
        .text(
          `${person.fromCompany ? `${person.fromCompany} (${person.fromRole}) → ` : ""}${person.toCompany} (${person.toRole})`
        );
      if (person.logisticsDxView) labelValue(doc, "LogisticsDx View", person.logisticsDxView);
      doc.moveDown(0.2);
      pill(doc, person.movementType);
      if (person.effectiveDate) pill(doc, person.effectiveDate);
      doc.text("");
      doc.moveDown(0.6);
    });

    sectionTitle(doc, "Technology & Other Signals");
    [...report.industry.technology, ...report.industry.other].forEach((item) =>
      itemBlock(doc, item, item.company)
    );

    sectionTitle(doc, "Section 5 — Commercial Opportunities & Actions");
    report.opportunities.forEach((opp) => {
      ensureSpace(doc, 60);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK).text(opp.company, MARGIN, doc.y, {
        continued: true,
      });
      doc.font("Helvetica-Bold").fontSize(8).fillColor(RED).text(`   [${opp.priority}]`);
      labelValue(doc, "Trigger", opp.trigger);
      labelValue(doc, "Potential Action", opp.action);
      doc.moveDown(0.6);
    });

    sectionTitle(doc, "Section 6 — Watchlist / Early Warning Dashboard");
    report.watchlist.forEach((w) => {
      ensureSpace(doc, 60);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK).text(`${w.subject} (${w.category})`, MARGIN);
      doc.font("Helvetica").fontSize(9.5).fillColor(CHARCOAL).text(w.whatChanged);
      if (w.nextEvent) labelValue(doc, "Next Observable Event", w.nextEvent);
      doc.moveDown(0.2);
      pill(doc, w.evidenceLevel);
      doc.text("");
      doc.moveDown(0.6);
    });

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(GREY)
        .text(
          `LogisticsDx Market Intelligence — ${report.reportDate}     Page ${i + 1} of ${range.count}`,
          MARGIN,
          doc.page.height - 34,
          { width: doc.page.width - MARGIN * 2, align: "center" }
        );
    }

    doc.end();
  });
}
