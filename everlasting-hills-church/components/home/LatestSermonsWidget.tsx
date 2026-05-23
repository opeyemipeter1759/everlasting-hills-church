import Link from "next/link";
import { Play, BookOpen, Headphones, ArrowRight } from "lucide-react";

type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  scriptureRef: string | null;
  series: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function LatestSermonsWidget({
  featured,
  latest,
}: {
  featured: Sermon | null;
  latest: Sermon[];
}) {
  if (!featured && latest.length === 0) return null;

  return (
    <section className="relative py-16 px-4 bg-gray-50 dark:bg-[#161618]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[4px] text-[#87102C] dark:text-[#e8768a] mb-1">
              Sermon Archive
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Messages from the Word
            </h2>
          </div>
          <Link
            href="/sermons"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:gap-2.5 transition-all whitespace-nowrap flex-shrink-0"
          >
            Full archive <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Featured sermon — takes 2 cols */}
          {featured && (
            <Link
              href={`/sermons/${featured.slug}`}
              className="group lg:col-span-2 relative rounded-2xl overflow-hidden bg-[#87102C] text-white hover:shadow-xl transition-all"
            >
              {featured.thumbnailUrl ? (
                <img
                  src={featured.thumbnailUrl}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#6E0C24] to-[#87102C]" />
              )}
              <div className="relative p-8 flex flex-col gap-3 min-h-[260px] justify-end">
                <span className="self-start text-[11px] font-bold uppercase tracking-widest text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
                  Featured Message
                </span>
                {featured.series && (
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">{featured.series}</p>
                )}
                <h3 className="text-xl sm:text-2xl font-black leading-tight">{featured.title}</h3>
                <p className="text-white/70 text-sm">
                  {featured.speaker} · {fmtDate(featured.date)}
                  {featured.scriptureRef && ` · ${featured.scriptureRef}`}
                </p>
                <span className="self-start flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-white text-[#87102C] mt-1">
                  {featured.audioUrl ? <><Play size={12} fill="currentColor" /> Listen Now</> : <><BookOpen size={12} /> Read More</>}
                </span>
              </div>
            </Link>
          )}

          {/* Latest 3 (or less) in a column */}
          {latest.length > 0 && (
            <div className={`flex flex-col gap-3 ${!featured ? "lg:col-span-3 grid grid-cols-1 sm:grid-cols-3" : ""}`}>
              {latest.slice(0, featured ? 3 : 3).map((s) => (
                <Link
                  key={s.id}
                  href={`/sermons/${s.slug}`}
                  className="group flex gap-3 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-3.5 hover:border-[#87102C]/30 hover:shadow-sm transition-all"
                >
                  {s.thumbnailUrl ? (
                    <div className="w-16 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                      <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="w-16 aspect-video rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="text-[#87102C]/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors line-clamp-2">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {s.speaker} · {fmtDate(s.date)}
                    </p>
                    {s.audioUrl && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        <Headphones size={10} /> {s.playCount} plays
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
