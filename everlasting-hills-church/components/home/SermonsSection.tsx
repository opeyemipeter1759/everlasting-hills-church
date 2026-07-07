"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Video, Send } from "lucide-react";
import { SERMONS_FALLBACK, type SermonsContent } from "@/lib/site-settings";
import { useYouTubeVideos } from "@/utils/Useyoutubevideos";
import type { CategoryCounts, VideoCategory, YouTubeVideo } from "@/types";
import type { TelegramSermonItem } from "@/lib/telegram-sermons";
import VideoFilterTabs from "./Videofiltertabs";
import VideoCard from "./VideoCard";
import VideoPlayerModal from "./VideoPlayerModal";
import VideoCardSkeleton from "../ui/skeleton/VideoCardSkeleton";
import TelegramSermonCard from "./TelegramSermonCard";

type TabLabel = "All" | VideoCategory;
type SourceTab = "YouTube" | "Telegram";

const CATEGORY_TABS: VideoCategory[] = ["Sunday", "Saturday"];

export default function SermonsSection({
  content,
  telegramSermons = [],
}: {
  content?: SermonsContent;
  telegramSermons?: TelegramSermonItem[];
}) {
  const c = content ?? SERMONS_FALLBACK;
  const pageSize = 4;
  // Our writing style uses no em dashes.
  const lead = (c.subtext ?? "").replace(/\s*—\s*/g, ", ");

  const [source, setSource] = useState<SourceTab>("YouTube");

  const { videos, loading, error } = useYouTubeVideos();
  const [activeTab, setActiveTab] = useState<TabLabel>("All");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const [telegramVisibleCount, setTelegramVisibleCount] = useState(pageSize);
  const visibleTelegram = telegramSermons.slice(0, telegramVisibleCount);
  const telegramRemaining = telegramSermons.length - telegramVisibleCount;
  const [playingTelegramId, setPlayingTelegramId] = useState<string | null>(null);

  const counts = useMemo<CategoryCounts>(() => {
    const map: CategoryCounts = { total: videos.length };
    for (const cat of CATEGORY_TABS) {
      map[cat] = videos.filter((v) => v.category === cat).length;
    }
    return map;
  }, [videos]);

  const filtered = useMemo(
    () => (activeTab === "All" ? videos : videos.filter((v) => v.category === activeTab)),
    [videos, activeTab]
  );

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  function handleTabChange(tab: TabLabel): void {
    setActiveTab(tab);
    setVisibleCount(pageSize);
  }

  function handleOpen(video: YouTubeVideo): void {
    setSelectedVideo(video);
  }

  function handleClose(): void {
    setSelectedVideo(null);
  }

  return (
    <section id="sermons" className="relative overflow-hidden bg-[#080808] py-24 md:py-32 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-[-5%] h-72 w-72 rounded-full bg-[#87102C]/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-80 w-80 rounded-full bg-[#FFB3C1]/8 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB3C1]">
              {c.label}
            </p>
            <h2 className="font-serif text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl md:text-5xl">
              {c.headline}
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-white/55 sm:text-lg">
              {lead}
            </p>
          </div>
          <Link
            href={c.viewAllCta.href}
            className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#FFB3C1] transition-all hover:gap-3"
          >
            {c.viewAllCta.label}
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-[28px] border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setSource("YouTube")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                source === "YouTube" ? "bg-[#87102C] text-white" : "text-white/60 hover:text-white/85"
              }`}
            >
              <Video size={15} />
              YouTube
            </button>
            <button
              type="button"
              onClick={() => setSource("Telegram")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                source === "Telegram" ? "bg-[#87102C] text-white" : "text-white/60 hover:text-white/85"
              }`}
            >
              <Send size={15} />
              Telegram
            </button>
          </div>

          {source === "YouTube" && !loading && !error && (
            <VideoFilterTabs
              categories={CATEGORY_TABS}
              counts={counts}
              active={activeTab}
              onChange={handleTabChange}
            />
          )}
        </div>

        {source === "YouTube" && (
          <>
            {error && (
              <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-8 text-center backdrop-blur-xl">
                <p className="mb-1 text-sm font-medium text-[#FFB3C1]">Could not load videos</p>
                <p className="text-xs text-white/55">{error}</p>
              </div>
            )}

            {loading && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <VideoCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && !error && visible.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((video) => (
                  <VideoCard key={video.id} video={video} onOpen={handleOpen} />
                ))}
              </div>
            )}

            {!loading && !error && visible.length === 0 && (
              <EmptyState viewAllHref={c.viewAllCta.href} viewAllLabel={c.viewAllCta.label} />
            )}

            {!loading && !error && remaining > 0 && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount((n) => n + pageSize)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#FFE8ED] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Load more · {remaining}
                </button>
              </div>
            )}

            {selectedVideo ? <VideoPlayerModal video={selectedVideo} onClose={handleClose} /> : null}
          </>
        )}

        {source === "Telegram" && (
          <>
            {visibleTelegram.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleTelegram.map((item) => (
                  <TelegramSermonCard
                    key={item.id}
                    item={item}
                    isPlaying={playingTelegramId === item.id}
                    onTogglePlay={() =>
                      setPlayingTelegramId((cur) => (cur === item.id ? null : item.id))
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState viewAllHref={c.viewAllCta.href} viewAllLabel={c.viewAllCta.label} />
            )}

            {telegramRemaining > 0 && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setTelegramVisibleCount((n) => n + pageSize)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#FFE8ED] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Load more · {telegramRemaining}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState({ viewAllHref, viewAllLabel }: { viewAllHref: string; viewAllLabel: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
      <svg
        viewBox="0 0 120 64"
        className="mx-auto mb-6 h-14 w-28 text-[#FFB3C1]/70"
        fill="none"
        aria-hidden="true"
      >
        <path d="M2 62 L40 18 L60 40 L78 10 L118 62 Z" fill="currentColor" opacity="0.15" />
        <path d="M2 62 L40 18 L60 40 L78 10 L118 62 Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <p className="text-white/70">Recent messages will appear here soon.</p>
      <Link
        href={viewAllHref}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FFB3C1] transition-all hover:gap-3"
      >
        {viewAllLabel}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
