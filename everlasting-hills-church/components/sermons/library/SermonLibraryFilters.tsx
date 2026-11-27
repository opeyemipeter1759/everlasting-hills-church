"use client";

import { useId, useState } from "react";
import type { LibraryFilters, Option } from "./sermon-library";

const HEADING = "border-b border-[#E7DADD] pb-3.5 text-[12px] font-bold uppercase tracking-[0.22em] text-[#2B0A13]";
export const FIELD =
  "w-full rounded-md border border-[#E2D3D7] bg-white px-3.5 py-2.5 text-[14px] text-[#2B0A13] placeholder:text-[#9C8A8F] focus:border-[#87102C]/50 focus:outline-none focus:ring-2 focus:ring-[#87102C]/15";

/** A filter heading with a line under it, as in the reference design. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className={HEADING}>{title}</h2>
      {children}
    </section>
  );
}

/** One pick-one list (year, speaker, series) with an "All" choice, counts and, for long lists, a search box. */
function Choices({ name, allLabel, options, value, onChange, searchLabel, showCounts = true, total }: {
  name: string;
  allLabel: string;
  options: Option[];
  value: string | null;
  onChange: (v: string | null) => void;
  searchLabel?: string;
  showCounts?: boolean;
  /** Shown against the "All" choice: every sermon. */
  total?: number;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const shown = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  // Each row: the radio, the name (wrapping if long), and its count in a small badge on the right.
  const radio = (v: string | null, label: string, count?: number) => {
    const on = value === v;
    return (
      <label key={v ?? "all"} className={`group flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 text-[15px] leading-snug transition-colors ${on ? "bg-[#87102C]/[0.06] text-[#87102C]" : "text-[#5E3F47] hover:bg-[#87102C]/[0.04] hover:text-[#87102C]"}`}>
        <input type="radio" name={`${name}-${id}`} checked={on} onChange={() => onChange(v)}
          className="mt-[3px] h-4 w-4 flex-shrink-0 cursor-pointer accent-[#87102C]" />
        <span className={`min-w-0 flex-1 ${on ? "font-medium" : ""}`}>{label}</span>
        {showCounts && count !== undefined && (
          <span aria-label={`${count} sermon${count === 1 ? "" : "s"}`}
            className={`mt-px min-w-[2.25rem] flex-shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold tabular-nums ${on ? "bg-[#87102C] text-white" : "bg-[#F1E6E9] text-[#87102C]/80"}`}>
            {count}
          </span>
        )}
      </label>
    );
  };
  return (
    <div className="space-y-4">
      {searchLabel && options.length > 6 && (
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} className={FIELD} />
      )}
      {/* Phones: each long list scrolls on its own. Desktop: the whole sidebar scrolls instead (one scroll, not nested). */}
      <div className="max-h-[19rem] space-y-0.5 overflow-y-auto [scrollbar-color:#D9C6CB_transparent] [scrollbar-width:thin] lg:max-h-none lg:overflow-visible" role="radiogroup" aria-label={name}>
        {radio(null, allLabel, total)}
        {shown.map((o) => radio(o.value, o.label, o.count))}
        {shown.length === 0 && <p className="py-2 text-sm text-[#9C8A8F]">Nothing matches &ldquo;{query}&rdquo;.</p>}
      </div>
    </div>
  );
}

export default function SermonLibraryFilters({ filters, set, options, total }: {
  filters: LibraryFilters;
  total: number;
  set: (patch: Partial<LibraryFilters>) => void;
  options: { years: Option[]; speakers: Option[]; series: Option[] };
}) {
  return (
    <div className="space-y-10">
      <Section title="Search">
        <input type="search" value={filters.search} onChange={(e) => set({ search: e.target.value })} placeholder="Search sermons…" aria-label="Search sermons" className={FIELD} />
      </Section>
      {options.years.length > 0 && (
        <Section title="Year">
          <Choices name="Year" allLabel="All Years" options={options.years} value={filters.year} onChange={(year) => set({ year })} showCounts={false} />
        </Section>
      )}
      {options.speakers.length > 0 && (
        <Section title="Speakers">
          <Choices name="Speakers" allLabel="All Preachers" options={options.speakers} value={filters.speaker} onChange={(speaker) => set({ speaker })} searchLabel="Search speakers…" total={total} />
        </Section>
      )}
      {options.series.length > 0 && (
        <Section title="Series / Conference">
          <Choices name="Series" allLabel="All Series" options={options.series} value={filters.series} onChange={(series) => set({ series })} searchLabel="Search series…" total={total} />
        </Section>
      )}
    </div>
  );
}
