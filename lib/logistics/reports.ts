import fs from "node:fs/promises";
import path from "node:path";
import type { IntelligenceReport } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "intelligence");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** All available report dates (ISO, newest first). */
export async function listReportDates(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(DATA_DIR);
  } catch {
    return [];
  }
  return entries
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((d) => DATE_RE.test(d))
    .sort()
    .reverse();
}

export async function getLatestReportDate(): Promise<string | null> {
  const dates = await listReportDates();
  return dates[0] ?? null;
}

/** Load one day's structured master report. Returns null if not found. */
export async function getReportByDate(date: string): Promise<IntelligenceReport | null> {
  if (!DATE_RE.test(date)) return null;
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${date}.json`), "utf-8");
    return JSON.parse(raw) as IntelligenceReport;
  } catch {
    return null;
  }
}

export async function getLatestReport(): Promise<IntelligenceReport | null> {
  const date = await getLatestReportDate();
  if (!date) return null;
  return getReportByDate(date);
}

/** Rough spoken-word reading/listening time from the narration script. */
export function estimateNarrationMinutes(report: IntelligenceReport): number {
  const words = [
    ...report.narration.intro,
    ...report.narration.sections.flatMap((s) => s.paragraphs),
    ...report.narration.outro,
  ].join(" ").split(/\s+/).filter(Boolean).length;
  const WORDS_PER_MINUTE = 150; // measured speech pace, not silent reading
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatReportDateLong(reportDate: string): string {
  const date = new Date(`${reportDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  }).format(date).toUpperCase();
}

export function formatReportDateShort(reportDate: string): string {
  const date = new Date(`${reportDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  }).format(date);
}
