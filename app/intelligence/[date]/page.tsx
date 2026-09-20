import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  estimateNarrationMinutes,
  formatReportDateLong,
  getLatestReport,
  getReportByDate,
} from "@/lib/logistics/reports";
import { buildSpeechChapters } from "@/lib/logistics/narration";
import { AudioPlayer } from "@/components/logistics/audio-player";
import { ReportView } from "@/components/logistics/report-view";

async function loadReport(date: string) {
  if (date === "latest") return getLatestReport();
  return getReportByDate(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const report = await loadReport(date);
  if (!report) return { title: "LogisticsDx Market Intelligence" };
  return {
    title: `LogisticsDx Market Intelligence — ${formatReportDateLong(report.reportDate)}`,
    description: report.executiveSummary.tldr[0],
  };
}

export default async function IntelligenceReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const report = await loadReport(date);
  if (!report) notFound();

  const chapters = buildSpeechChapters(report);
  const minutes = estimateNarrationMinutes(report);

  return (
    <div className="logisticsdx min-h-screen bg-[var(--ldx-black)] text-white">
      <header className="border-b border-white/10 px-4 py-8 sm:px-6">
        <p className="text-2xl font-black tracking-tight text-white">LOGISTICSDX</p>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ldx-red)]">
          Market Intelligence
        </p>
        <p className="mt-3 text-lg font-medium text-white/80">
          {formatReportDateLong(report.reportDate)}
        </p>
        <p className="mt-1 text-xs text-white/50">
          Estimated listening time: ~{minutes} min · {report.tagline}
        </p>

        <div className="mt-6">
          <AudioPlayer
            chapters={chapters}
            reportTitle={report.title}
            reportDateLabel={formatReportDateLong(report.reportDate)}
          />
        </div>
      </header>

      <ReportView report={report} />
    </div>
  );
}
