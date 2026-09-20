import type {
  IntelligenceItem,
  IntelligenceReport,
  OpportunityItem,
  PeopleItem,
  PropertyItem,
  SmeSignalItem,
  WatchlistItem,
} from "@/lib/logistics/types";

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "property", label: "Property" },
  { id: "logistics", label: "Logistics" },
  { id: "supply-chain", label: "Supply Chain" },
  { id: "people", label: "People" },
  { id: "opportunities", label: "Opportunities" },
  { id: "watchlist", label: "Watchlist" },
];

function ConfidenceBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/70">
      {label}
    </span>
  );
}

function SourcesAccordion({ sources }: { sources: { label: string; url?: string }[] }) {
  if (sources.length === 0) return null;
  return (
    <details className="mt-3 text-xs text-white/60">
      <summary className="cursor-pointer select-none list-none">Supporting Sources ▾</summary>
      <ul className="mt-2 space-y-1">
        {sources.map((s, i) => (
          <li key={i}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                {s.label}
              </a>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function ItemCard({ item, kicker }: { item: IntelligenceItem; kicker?: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4">
      {kicker && (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ldx-red)]">
          {kicker}
        </p>
      )}
      <h3 className="mt-1 text-base font-semibold text-white">{item.headline}</h3>
      <p className="mt-1 text-sm text-white/80">{item.tldr}</p>
      {item.observation && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">Observation: </span>
          {item.observation}
        </p>
      )}
      {item.logisticsDxView && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">LogisticsDx View: </span>
          {item.logisticsDxView}
        </p>
      )}
      {item.commercialTrigger && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">Commercial Trigger: </span>
          {item.commercialTrigger}
        </p>
      )}
      {item.whatToWatchNext && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">What to Watch Next: </span>
          {item.whatToWatchNext}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge label={item.confidence} />
        {item.timeHorizon && <ConfidenceBadge label={item.timeHorizon} />}
      </div>
      <SourcesAccordion sources={item.sources} />
    </article>
  );
}

function PropertyCard({ item }: { item: PropertyItem }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4">
      <h3 className="text-base font-semibold text-white">{item.headline}</h3>
      <p className="mt-1 text-sm text-white/80">{item.tldr}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
        {item.suburb && (
          <div>
            <dt className="text-white/40">Location</dt>
            <dd>
              {item.suburb}, {item.state}
            </dd>
          </div>
        )}
        {item.areaSqm && (
          <div>
            <dt className="text-white/40">Area</dt>
            <dd>{item.areaSqm}</dd>
          </div>
        )}
        {item.palletCapacity && (
          <div>
            <dt className="text-white/40">Capacity</dt>
            <dd>{item.palletCapacity}</dd>
          </div>
        )}
        {(item.owner || item.developer) && (
          <div>
            <dt className="text-white/40">{item.developer ? "Developer" : "Owner"}</dt>
            <dd>{item.developer ?? item.owner}</dd>
          </div>
        )}
      </dl>
      {item.logisticsDxView && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">LogisticsDx View: </span>
          {item.logisticsDxView}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge label={item.confidence} />
        {item.matchType && <ConfidenceBadge label={item.matchType} />}
      </div>
      <SourcesAccordion sources={item.sources} />
    </article>
  );
}

function SmeCard({ item }: { item: SmeSignalItem }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ldx-red)]">
        SME SIGNAL{item.state ? ` · ${item.state}` : ""}
      </p>
      <h3 className="mt-1 text-base font-semibold text-white">{item.headline}</h3>
      <p className="mt-1 text-sm text-white/80">{item.tldr}</p>
      {item.opportunity && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">LogisticsDx Opportunity: </span>
          {item.opportunity}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge label={item.sizeDescriptor ?? "PRIVATE / SIZE NOT VERIFIED"} />
        <ConfidenceBadge label={item.confidence} />
      </div>
      <SourcesAccordion sources={item.sources} />
    </article>
  );
}

function PeopleCard({ item }: { item: PeopleItem }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4">
      <h3 className="text-base font-semibold text-white">{item.person}</h3>
      <p className="mt-1 text-sm text-white/80">
        {item.fromCompany ? `${item.fromCompany} (${item.fromRole}) → ` : ""}
        {item.toCompany} ({item.toRole})
      </p>
      {item.logisticsDxView && <p className="mt-2 text-sm text-white/60">{item.logisticsDxView}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge label={item.movementType} />
        {item.effectiveDate && <ConfidenceBadge label={item.effectiveDate} />}
      </div>
      <SourcesAccordion sources={item.sources} />
    </article>
  );
}

function OpportunityCard({ item }: { item: OpportunityItem }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{item.company}</h3>
        <ConfidenceBadge label={item.priority} />
      </div>
      <p className="mt-2 text-sm text-white/60">
        <span className="font-medium text-white/80">Trigger: </span>
        {item.trigger}
      </p>
      <p className="mt-1 text-sm text-white/60">
        <span className="font-medium text-white/80">Potential Action: </span>
        {item.action}
      </p>
    </article>
  );
}

function WatchlistCard({ item }: { item: WatchlistItem }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[var(--ldx-charcoal)] p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{item.subject}</h3>
        <ConfidenceBadge label={item.category} />
      </div>
      <p className="mt-2 text-sm text-white/80">{item.whatChanged}</p>
      {item.nextEvent && (
        <p className="mt-2 text-sm text-white/60">
          <span className="font-medium text-white/80">Next Observable Event: </span>
          {item.nextEvent}
        </p>
      )}
      <div className="mt-3">
        <ConfidenceBadge label={item.evidenceLevel} />
      </div>
    </article>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 pt-8">
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ReportView({ report }: { report: IntelligenceReport }) {
  return (
    <div className="logisticsdx min-h-screen bg-[var(--ldx-black)] pb-24 text-white">
      <nav
        aria-label="Report sections"
        className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-white/10 bg-[var(--ldx-black)]/95 px-4 py-3 backdrop-blur"
      >
        {NAV_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div id="overview" className="scroll-mt-24 px-4 py-8 sm:px-6">
        {report.isSampleData && (
          <p className="mb-4 rounded-md border border-[var(--ldx-red)]/40 bg-[var(--ldx-red)]/10 p-3 text-xs text-white/80">
            {report.sampleDataNote}
          </p>
        )}
        {report.pdfUrl && (
          <a
            href={report.pdfUrl}
            className="inline-block text-sm font-medium text-white/70 underline underline-offset-2 hover:text-white"
          >
            📄 View Full PDF
          </a>
        )}

        <h2 className="mt-6 text-lg font-bold uppercase tracking-wide text-white">
          TL;DR — What Matters Today
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-white/85">
          {report.executiveSummary.tldr.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--ldx-red)]">■</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Named Company Moves Today
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {report.executiveSummary.namedCompanyMoves.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
              SME / Mid-Market Signals Today
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {report.executiveSummary.smeSignals.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Today&apos;s Priority Watch
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {report.executiveSummary.priorityWatch.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-10 px-4 sm:px-6">
        <Section id="property" title="Section 1 — Property Report">
          {report.property.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </Section>

        <Section id="logistics" title="Section 2 — Logistics Overview">
          {report.logistics.majorEvents.map((item) => (
            <ItemCard key={item.id} item={item} kicker={item.company} />
          ))}
          {report.logistics.smeMoves.map((item) => (
            <SmeCard key={item.id} item={item} />
          ))}
        </Section>

        <Section id="supply-chain" title="Section 3 — Supply Chain Challenges">
          {report.supplyChain.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </Section>

        <section id="people" className="scroll-mt-24 border-t border-white/10 pt-8">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Section 4 — Broad Industry Intelligence
          </h2>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/50">
            People &amp; Key Staff Movements
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {report.industry.people.map((item) => (
              <PeopleCard key={item.id} item={item} />
            ))}
          </div>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-white/50">
            Technology &amp; Other Signals
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {[...report.industry.technology, ...report.industry.other].map((item) => (
              <ItemCard key={item.id} item={item} kicker={item.company} />
            ))}
          </div>
        </section>

        <Section id="opportunities" title="Section 5 — Commercial Opportunities &amp; Actions">
          {report.opportunities.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </Section>

        <Section id="watchlist" title="Section 6 — Watchlist / Early Warning Dashboard">
          {report.watchlist.map((item) => (
            <WatchlistCard key={item.id} item={item} />
          ))}
        </Section>
      </div>
    </div>
  );
}
