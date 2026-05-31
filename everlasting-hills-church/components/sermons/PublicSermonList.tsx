"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Play, BookOpen, Headphones, Heart, Bookmark, ChevronRight } from "lucide-react";

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

function SermonCard({ s }: { s: Sermon }) {
  return (
    <Link href={`/sermons/${s.slug}`}
      className="group bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-[#87102C]/30 hover:shadow-md transition-all duration-200 flex flex-col">
      {s.thumbnailUrl ? (
        <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-white/5">
          <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center">
          <BookOpen size={32} className="text-[#87102C]/30 dark:text-[#87102C]/40" />
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        {s.series && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">{s.series}</p>
        )}
        <h3 className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors">
          {s.title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {s.speaker} · {fmtDate(s.date)}
          {s.scriptureRef && ` · ${s.scriptureRef}`}
        </p>
        {s.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{s.description}</p>
        )}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-100 dark:border-white/8">
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
    </Link>
  );
}

export default function PublicSermonList({ sermons, series }: {
  sermons: Sermon[];
  series: { name: string; slug: string }[];
}) {
  const [search, setSearch] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sermons.filter((s) => {
      const matchQ = !q || [s.title, s.speaker, s.scriptureRef ?? "", s.description ?? ""].some((f) => f.toLowerCase().includes(q));
      const matchSeries = !selectedSeries || s.seriesSlug === selectedSeries;
      return matchQ && matchSeries;
    });
  }, [sermons, search, selectedSeries]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111]">
      {/* Hero */}
      <div className="bg-[#87102C] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-[4px] text-white/60 mb-3">Everlasting Hills Church</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Sermon Archive</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Messages to grow your faith, deepen your walk, and transform your life.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, speaker, or scripture…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
          </div>
          {series.length > 0 && (
            <select
              value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)}
              className="text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 transition-all"
            >
              <option value="">All Series</option>
              {series.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Series chips */}
        {series.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href="/sermons" className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${!selectedSeries ? "bg-[#87102C] text-white border-[#87102C]" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#87102C]/40"}`}>
              All
            </Link>
            {series.map((s) => (
              <button key={s.slug} type="button" onClick={() => setSelectedSeries(s.slug === selectedSeries ? "" : s.slug)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${selectedSeries === s.slug ? "bg-[#87102C] text-white border-[#87102C]" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#87102C]/40"}`}>
                {s.name}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} sermon{filtered.length !== 1 ? "s" : ""}</p>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400">No sermons match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => <SermonCard key={s.id} s={s} />)}
          </div>
        )}

        {/* Email subscription */}
        <EmailSubscribeCard />
      </div>
    </div>
  );
}

function EmailSubscribeCard() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      // POST /sermons/subscribers is @Public — backend upserts the email.
      const { apiClient } = await import("@/lib/api/axios");
      await apiClient.post("/sermons/subscribers", { email });
      setState("done");
    } catch { setState("error"); }
  }

  return (
    <div className="bg-[#87102C] text-white rounded-2xl p-8 text-center space-y-4">
      <p className="text-sm font-bold uppercase tracking-widest text-white/60">Stay Connected</p>
      <h3 className="text-2xl font-black">Get new sermons in your inbox</h3>
      <p className="text-white/70 text-sm max-w-sm mx-auto">No account needed. Just your email — we'll notify you when a new message is published.</p>
      {state === "done" ? (
        <p className="text-white font-semibold">You're subscribed! 🎉</p>
      ) : (
        <form onSubmit={subscribe} className="flex gap-2 max-w-sm mx-auto">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none" />
          <button type="submit" disabled={state === "loading"}
            className="px-5 py-2.5 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-gray-100 disabled:opacity-70 transition-all whitespace-nowrap">
            {state === "loading" ? "…" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && <p className="text-red-300 text-xs">Something went wrong. Please try again.</p>}
    </div>
  );
}
