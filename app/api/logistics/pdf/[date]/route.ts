import { NextResponse } from "next/server";
import { generateReportPdf } from "@/lib/logistics/pdf";
import { getLatestReport, getReportByDate } from "@/lib/logistics/reports";

// pdfkit needs Node's fs/Buffer APIs to load its bundled fonts — not available on Edge.
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const report = date === "latest" ? await getLatestReport() : await getReportByDate(date);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const pdf = await generateReportPdf(report);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="LogisticsDx_Market_Intelligence_${report.reportDate}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
