"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Headphones, Heart, Play, Search } from "lucide-react";
import { useSermonPlayer } from "@/context/SermonPlayerContext";

type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
  tags: string[];
  _count: { reactions: number; bookmarks: number };
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function SermonRow({ s, onPlay }: { s: Sermon; onPlay: (slug: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(s.slug)}
      className="group w-full flex gap-4 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-[#87102C]/30 hover:shadow-sm transition-all text-left"
    >
      {s.thumbnailUrl ? (
        <div className="w-24 sm:w-32 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
          <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="w-24 sm:w-32 aspect-video rounded-lg bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center flex-shrink-0">
          <BookOpen size={20} className="text-[#87102C]/30" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors line-clamp-2">
          {s.title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {s.speaker} · {fmtDate(s.date)}
          {s.scriptureRef && ` · ${s.scriptureRef}`}
        </p>
        {s.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{s.description}</p>
        )}
        <div className="flex items-center gap-3 mt-auto pt-1">
          {s.audioUrl && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Headphones size={11} /> {s.playCount}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Heart size={11} /> {s._count.reactions}
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#87102C] dark:text-[#e8768a]">
            {s.audioUrl ? <><Play size={11} fill="currentColor" /> Listen</> : <><BookOpen size={11} /> Read</>}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function SeriesPage({
  seriesName,
  seriesSlug,
  sermons,
}: {
  seriesName: string;
  seriesSlug: string;
  sermons: Sermon[];
}) {
  const [search, setSearch] = useState("");
  const { play } = useSermonPlayer();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sermons;
    return sermons.filter((s) =>
      [s.title, s.speaker, s.scriptureRef ?? "", s.description ?? ""].some((f) =>
        f.toLowerCase().includes(q)
      )
    );
  }, [sermons, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111]">
      {/* Back nav */}
      <div className="border-b border-gray-200 dark:border-white/8 bg-white dark:bg-[#1c1c1e]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link
            href="/sermons"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={14} /> All Sermons
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[#87102C] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-[4px] text-white/60 mb-2">Series</p>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">{seriesName}</h1>
          <p className="text-white/70">
            {sermons.length} message{sermons.length !== 1 ? "s" : ""} in this series
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Search */}
        {sermons.length > 4 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within this series…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} sermon{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400">No sermons match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <SermonRow key={s.id} s={s} onPlay={play} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
