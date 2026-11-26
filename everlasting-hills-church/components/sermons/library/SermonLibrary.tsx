"use client";

import { useMemo, useRef, useState } from "react";
import { CaretDown, Icon, SlidersHorizontal } from "@/components/icons";
import { usePublishedSermons } from "@/lib/api";
import SermonLibraryCard from "./SermonLibraryCard";
import SermonLibraryFilters from "./SermonLibraryFilters";
import { NO_FILTERS, SORTS, applyFilters, libraryOptions, type LibraryFilters, type SortKey } from "./sermon-library";

const PAGE = 12;
const LABEL = "text-[12px] font-bold uppercase tracking-[0.22em]";

/**
 * The public sermons library: filters down the left (search, year, speaker,
 * series), results on the right with a count and a sort, three cards a row.
 * On phones the filters fold behind a button above the results.
 */
export default function SermonLibrary({ onListen }: { onListen: (slug: string) => void }) {
  const { data, isError, refetch } = usePublishedSermons({ limit: 500 });
  // "No data yet" counts as loading on the server too (the query only runs in the browser), so both render the same.
  const isLoading = data === undefined && !isError;
  const [filters, setFilters] = useState<LibraryFilters>(NO_FILTERS);
  const [shown, setShown] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sermons = useMemo(() => data ?? [], [data]);
  const options = useMemo(() => libraryOptions(sermons), [sermons]);
  const results = useMemo(() => applyFilters(sermons, filters), [sermons, filters]);
  const filtered = filters.search.trim() !== "" || !!filters.year || !!filters.speaker || !!filters.series;
  const resultsRef = useRef<HTMLDivElement>(null);

  /**
   * Filtering never yanks the page. Fewer results make the page shorter, and the
   * browser used to snap the view upward. Now: if the reader is down in the
   * results, hold the page's height, glide back to the top of the results, then
   * let go. If the top of the results is already in view, nothing moves.
   */
  const keepPlace = () => {
    const el = resultsRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top >= 0) return;
    el.style.minHeight = `${el.offsetHeight}px`;
    window.scrollTo({ top: window.scrollY + top - 96, behavior: "smooth" });
    window.setTimeout(() => { el.style.minHeight = ""; }, 800);
  };
  const set = (patch: Partial<LibraryFilters>) => { keepPlace(); setFilters((f) => ({ ...f, ...patch })); setShown(PAGE); };
  const clear = () => { keepPlace(); setFilters((f) => ({ ...NO_FILTERS, sort: f.sort })); setShown(PAGE); };

  return (
    <section id="library" aria-labelledby="library-heading" className="scroll-mt-20 bg-[#FBF8F8]">
      <div className="mx-auto grid max-w-[1880px] grid-cols-[minmax(0,1fr)] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14 lg:py-20 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-14 min-[1700px]:grid-cols-[340px_minmax(0,1fr)] min-[1700px]:gap-16">
        <h2 id="library-heading" className="sr-only">All sermons</h2>

        <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} aria-controls="sermon-filters"
          className={`flex items-center justify-between rounded-md border border-[#E2D3D7] bg-white px-5 py-4 text-[#2B0A13] lg:hidden ${LABEL}`}>
          <span className="inline-flex items-center gap-3"><Icon icon={SlidersHorizontal} size={18} /> Filters{filtered ? " · on" : ""}</span>
          <Icon icon={CaretDown} size={16} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
        <aside id="sermon-filters" className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
          {/* Pinned beside the results, with its own scroll: every filter is reachable without scrolling the page. */}
          <div className="lg:sticky lg:top-24 lg:-mr-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-6 lg:pr-4 lg:[scrollbar-color:#D9C6CB_transparent] lg:[scrollbar-width:thin]">
            <SermonLibraryFilters filters={filters} set={set} options={options} total={sermons.length} />
          </div>
        </aside>

        {/* At least a screen tall, so a short result list never collapses the page under the reader. */}
        <div ref={resultsRef} className="min-h-[70vh] min-w-0 lg:min-h-[calc(100vh-6rem)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7DADD] pb-5">
            <p className={`text-[#8A7A7E] ${LABEL}`} aria-live="polite">
              {isLoading ? "Loading sermons…" : `Showing ${results.length} result${results.length === 1 ? "" : "s"}`}
              {filtered && !isLoading && (
                <button type="button" onClick={clear} className="ml-4 text-[#87102C] underline decoration-[#87102C]/40 underline-offset-4 hover:decoration-[#87102C]">Clear filters</button>
              )}
            </p>
            <label className="flex items-center gap-4">
              <span className={`text-[#2B0A13] ${LABEL}`}>Sort by:</span>
              <span className="relative">
                <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}
                  className="appearance-none rounded-md border border-[#E2D3D7] bg-white py-2.5 pl-4 pr-11 text-[14px] text-[#2B0A13] focus:border-[#87102C]/50 focus:outline-none focus:ring-2 focus:ring-[#87102C]/15">
                  {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Icon icon={CaretDown} size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2B0A13]" />
              </span>
            </label>
          </div>

          {isError ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl text-[#2B0A13]">We couldn&rsquo;t load the sermons.</p>
              <button type="button" onClick={() => refetch()} className={`mt-6 rounded-md bg-[#87102C] px-6 py-3.5 text-white hover:bg-[#6E0C24] ${LABEL}`}>Try again</button>
            </div>
          ) : isLoading ? (
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 min-[1380px]:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-[#EADFE2] bg-white">
                  <div className="aspect-video animate-pulse bg-[#F1E8EA]" />
                  <div className="space-y-3 p-5"><div className="h-3 w-1/3 rounded bg-[#F1E8EA]" /><div className="h-6 w-4/5 rounded bg-[#F1E8EA]" /><div className="h-4 w-full rounded bg-[#F6F0F1]" /><div className="h-4 w-2/3 rounded bg-[#F6F0F1]" /></div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl text-[#2B0A13]">No sermons match{filters.search.trim() ? ` “${filters.search.trim()}”` : " those filters"}.</p>
              <p className="mt-3 text-[#7A5D64]">Try another word, or widen the year, speaker or series.</p>
              {filtered && <button type="button" onClick={clear} className={`mt-7 rounded-md bg-[#87102C] px-6 py-3.5 text-white hover:bg-[#6E0C24] ${LABEL}`}>Clear filters</button>}
            </div>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 min-[1380px]:grid-cols-3">
                {results.slice(0, shown).map((s) => <SermonLibraryCard key={s.id} s={s} onListen={onListen} />)}
              </div>
              {results.length > shown && (
                <div className="mt-14 text-center">
                  <button type="button" onClick={() => setShown((n) => n + PAGE)}
                    className={`rounded-md border-2 border-[#87102C] px-8 py-4 text-[#87102C] transition-colors hover:bg-[#87102C] hover:text-white ${LABEL}`}>
                    Load more sermons
                  </button>
                  <p className="mt-4 text-sm text-[#8A7A7E]">Showing {shown} of {results.length}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
