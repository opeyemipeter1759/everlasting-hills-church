"use client";

import { ArrowRight } from "lucide-react";
import type { LatestSermon } from "@/types";
import { formatDuration } from "./sermonUtils";

type Section = { id: string; title: string; subtitle?: string; items: LatestSermon[] };

export default function SeriesLibrary({ sections, onSelect }: { sections: Section[]; onSelect: (s: { title: string; items: LatestSermon[] }) => void }) {
  return (
    <section id="series" className="scroll-mt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
            <span className="h-3.5 w-3.5 text-[#FFB3C1]" />
            Series
          </div>
          <h3 className="mt-3 text-[1.35rem] font-bold text-white/92">Series Library</h3>
          <p className="mt-1 text-sm text-white/45">Browse sermon collections by topic and season</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
        {sections.map((section, index) => {
          const seriesColors = [
            "from-emerald-500 via-teal-500 to-cyan-600",
            "from-fuchsia-600 via-purple-700 to-indigo-700",
            "from-orange-600 via-amber-600 to-red-700",
            "from-yellow-500 via-amber-600 to-lime-700",
            "from-indigo-600 via-blue-700 to-sky-800",
          ];
          const gradient = seriesColors[index % seriesColors.length];

          const totalSeconds = section.items.reduce((s, i) => s + (i.audioDuration ?? 0), 0);
          const totalMins = Math.max(0, Math.round(totalSeconds / 60));
          const durationLabel = totalMins >= 60 ? `${Math.floor(totalMins / 60)} Hrs ${totalMins % 60} Mins` : `${totalMins} Mins`;

          return (
            <article key={section.id} onClick={() => onSelect({ title: section.title, items: section.items })} role="button" tabIndex={0} className={`group relative cursor-pointer overflow-hidden rounded-[18px] border border-white/8 bg-gradient-to-br ${gradient} p-5 shadow-[0_14px_32px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-1`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_45%)]" />
              <div className="relative flex h-full min-h-[180px] flex-col justify-between">
                <div>
                  <h4 className="max-w-[12ch] text-[1.9rem] font-black leading-[0.95] tracking-tight text-white drop-shadow-sm">{section.title}</h4>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/85">{section.items.length} messages • {durationLabel}</p>
                    <p className="mt-1 text-xs text-white/72">Tap to open the sermons in this series</p>
                  </div>

                  <div className="rounded-full bg-white/15 p-2 text-white/90 backdrop-blur-sm">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
