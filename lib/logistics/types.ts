// LogisticsDx Market Intelligence — structured master report schema.
// One JSON file per day under /data/intelligence/<date>.json is the single
// source of truth. The email, PDF, web reader and narration are all derived
// views over this same data — never separately authored.

export type Confidence =
  | "SUPPORTED CONCLUSION"
  | "HIGH-CONFIDENCE INFERENCE — NOT VERIFIED"
  | "REASONED ASSUMPTION — NOT VERIFIED"
  | "SCENARIO — DEPENDS ON"
  | "INSUFFICIENT EVIDENCE";

export type TimeHorizon = "IMMEDIATE" | "NEAR" | "MEDIUM";

export type MovementType =
  | "NEW HIRE"
  | "PROMOTION"
  | "INTERNAL MOVE"
  | "DEPARTURE"
  | "INTERIM"
  | "ROLE EXPANSION"
  | "ROLE CHANGE";

export type PropertyMatchType = "DIRECT MATCH" | "POTENTIAL MATCH — ASSUMPTION";

export type OpportunityPriority = "HIGH" | "MEDIUM-HIGH" | "MEDIUM";

export interface SourceRef {
  label: string;
  url?: string;
}

export interface IntelligenceItem {
  id: string;
  company?: string;
  headline: string;
  tldr: string;
  observation?: string;
  logisticsDxView?: string;
  commercialTrigger?: string;
  whatToWatchNext?: string;
  confidence: Confidence;
  timeHorizon?: TimeHorizon;
  sources: SourceRef[];
  /** Pre-transformed for listening — no URLs, no repeated labels. */
  narrationText: string;
}

export interface SmeSignalItem extends IntelligenceItem {
  sizeDescriptor?: string; // e.g. "PRIVATE / SIZE NOT VERIFIED"
  state?: string;
  opportunity?: string;
}

export interface PropertyItem extends IntelligenceItem {
  address?: string;
  suburb?: string;
  state?: string;
  owner?: string;
  developer?: string;
  agent?: string;
  areaSqm?: string;
  palletCapacity?: string;
  matchType?: PropertyMatchType;
}

export interface PeopleItem {
  id: string;
  person: string;
  fromCompany?: string;
  fromRole?: string;
  toCompany: string;
  toRole: string;
  movementType: MovementType;
  effectiveDate?: string;
  state?: string;
  logisticsDxView?: string;
  confidence: Confidence;
  sources: SourceRef[];
  narrationText: string;
}

export interface OpportunityItem {
  id: string;
  company: string;
  trigger: string;
  action: string;
  priority: OpportunityPriority;
  narrationText: string;
}

export interface WatchlistItem {
  id: string;
  category: "Company" | "Property" | "Contract" | "Regulatory" | "Financial" | "Market" | "People";
  subject: string;
  whatChanged: string;
  evidenceLevel: Confidence;
  confirms?: string;
  refutes?: string;
  nextEvent?: string;
  narrationText: string;
}

export interface NarrationSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface ExecutiveSummary {
  tldr: string[];
  namedCompanyMoves: string[];
  smeSignals: string[];
  priorityWatch: string[];
}

export interface IntelligenceReport {
  reportDate: string; // YYYY-MM-DD
  title: string;
  tagline: string;
  generatedAt: string; // ISO timestamp
  pdfUrl?: string;
  /**
   * True for demonstration/test reports that use fictional companies and
   * people to exercise the pipeline. Never true for a live production run.
   */
  isSampleData?: boolean;
  sampleDataNote?: string;
  executiveSummary: ExecutiveSummary;
  property: PropertyItem[];
  logistics: {
    majorEvents: IntelligenceItem[];
    smeMoves: SmeSignalItem[];
  };
  supplyChain: IntelligenceItem[];
  industry: {
    people: PeopleItem[];
    technology: IntelligenceItem[];
    other: IntelligenceItem[];
    sentiment?: Record<string, "improving" | "stable/mixed" | "deteriorating">;
  };
  opportunities: OpportunityItem[];
  watchlist: WatchlistItem[];
  narration: {
    intro: string[];
    sections: NarrationSection[];
    outro: string[];
  };
}
