"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { LatestSermon } from "@/types";
import SermonCard from "./SermonCard";

export default function AllSermons({ items, onPlay }: { items: LatestSermon[]; onPlay: (sermon: LatestSermon) => void }) {
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const values = new Set<string>();

    items.forEach((item) => {
      if (item.series) values.add(item.series);
      if (item.speaker) values.add(item.speaker);
      item.tags?.forEach((tag) => values.add(tag));
      if (item.scriptureRef) values.add(item.scriptureRef);
    });

    return Array.from(values).slice(0, 12);
  }, [items]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((item) => {
      const haystack = [item.title, item.speaker, item.series, item.description, item.scriptureRef, ...(item.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, query]);

  function addCategoryToQuery(category: string) {
    setQuery(category);
  }

  return (
    <section id="all" className="scroll-mt-8">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 className="mt-3 text-[1.35rem] font-bold text-white/92">All Messages</h3>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-4 py-3">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sermons, speakers, topics, scripture..."
              className="max-w-[300px] w-fill bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={() => setQuery("")}
              className={`${query ? "flex items-center justify-center rounded-full bg-white/8 text-white/50 transition-colors hover:bg-white/12 hover:text-white" : "hidden"}`}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>        
          </div>

        <div className=" p-3">
          <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {categories.map((category) => {
              const active = query.trim().toLowerCase() === category.toLowerCase();

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => addCategoryToQuery(category)}
                  className={`inline-flex shrink-0 snap-start items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-[#87102C] bg-[#87102C]/20 text-black"
                      : "border-white/10 bg-black text-white/70   hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredItems.map((sermon) => (
          <SermonCard key={sermon.id} sermon={sermon} onPlay={onPlay} />
        ))}
      </div>

      {filteredItems.length === 0 ? <div className="mt-6 text-sm text-white/40">No sermons found for this search.</div> : null}
    </section>
  );
}
