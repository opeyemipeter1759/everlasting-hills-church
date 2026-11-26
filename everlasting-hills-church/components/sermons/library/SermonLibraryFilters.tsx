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
function Choices({ name, allLabel, options, value, onChange, searchLabel, showCounts = true }: {
  name: string;
  allLabel: string;
  options: Option[];
  value: string | null;
  onChange: (v: string | null) => void;
  searchLabel?: string;
  showCounts?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const shown = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const radio = (v: string | null, label: string, count?: number) => (
    <label key={v ?? "all"} className="group flex cursor-pointer items-start gap-3.5 py-1 text-[15px] leading-snug text-[#5E3F47] hover:text-[#87102C]">
      <input type="radio" name={`${name}-${id}`} checked={value === v} onChange={() => onChange(v)}
        className="mt-[2px] h-4 w-4 flex-shrink-0 cursor-pointer accent-[#87102C]" />
      <span className={value === v ? "font-medium text-[#87102C]" : ""}>
        {label}
        {showCounts && count !== undefined && <span className="tabular-nums"> ({count})</span>}
      </span>
    </label>
  );
  return (
    <div className="space-y-4">
      {searchLabel && options.length > 6 && (
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} className={FIELD} />
      )}
      <div className="max-h-[19rem] overflow-y-auto pr-2 [scrollbar-color:#D9C6CB_transparent] [scrollbar-width:thin]" role="radiogroup" aria-label={name}>
        {radio(null, allLabel)}
        {shown.map((o) => radio(o.value, o.label, o.count))}
        {shown.length === 0 && <p className="py-2 text-sm text-[#9C8A8F]">Nothing matches &ldquo;{query}&rdquo;.</p>}
      </div>
    </div>
  );
}

export default function SermonLibraryFilters({ filters, set, options }: {
  filters: LibraryFilters;
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
          <Choices name="Speakers" allLabel="All Preachers" options={options.speakers} value={filters.speaker} onChange={(speaker) => set({ speaker })} searchLabel="Search speakers…" />
        </Section>
      )}
      {options.series.length > 0 && (
        <Section title="Series / Conference">
          <Choices name="Series" allLabel="All Series" options={options.series} value={filters.series} onChange={(series) => set({ series })} searchLabel="Search series…" />
        </Section>
      )}
    </div>
  );
}
