"use client";

import ScrollReveal from "./ScrollReveal";
import { ArrowRight } from "lucide-react";
import VideoFilterTabs from "./Videofiltertabs";
import type { CategoryCounts, VideoCategory, YouTubeVideo } from "@/types";
import { useYouTubeVideos } from "../utils/Useyoutubevideos";
import { useMemo, useState } from "react";
import VideoCardSkeleton from "../ui/skelenton/VideoCardSkeleton";
import VideoCard from "./VideoCard";
import VideoPlayerModal from "./VideoPlayerModal";

type TabLabel = "All" | VideoCategory;
const INITIAL_FETCH = 12;
const PAGE_SIZE = 4;
 
const CATEGORY_TABS: VideoCategory[] = ["Sunday", "Saturday"];
 
export default function SermonsSection() {
  const { videos, loading, error } = useYouTubeVideos(INITIAL_FETCH);
  const [activeTab, setActiveTab] = useState<TabLabel>("All");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
 
  // Build per-category counts for the tab badges
  const counts = useMemo<CategoryCounts>(() => {
    const map: CategoryCounts = { total: videos.length };
    for (const cat of CATEGORY_TABS) {
      map[cat] = videos.filter((v) => v.category === cat).length;
    }
    return map;
  }, [videos]);
 
  // Filter by active tab
  const filtered = useMemo(
    () =>
      activeTab === "All"
        ? videos
        : videos.filter((v) => v.category === activeTab),
    [videos, activeTab]
  );
 
  // Paginate
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;
 
  function handleTabChange(tab: TabLabel): void {
    setActiveTab(tab);
    setVisibleCount(PAGE_SIZE);
  }

  function handleOpen(video: YouTubeVideo): void {
    setSelectedVideo(video);
  }

  function handleClose(): void {
    setSelectedVideo(null);
  }

  return(
    <section
      id="sermons"
      className="relative overflow-hidden py-24 md:py-32 bg-church-dark text-white"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-[-5%] h-72 w-72 rounded-full bg-church-maroon/18 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-80 w-80 rounded-full bg-[#FFB3C1]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white opacity-60" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <ScrollReveal>
              <p className="text-[#FFB3C1] text-sm tracking-[0.25em] uppercase font-semibold mb-3">
                Recent Teachings
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight text-balance">
                The Word, taught with clarity
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2} direction="right">
            <a
              href="/sermons"
              className="flex items-center gap-2 text-[#FFB3C1] text-sm font-semibold hover:gap-3 transition-all whitespace-nowrap"
            >
              View all sermons <ArrowRight size={15} />
            </a>
          </ScrollReveal>
        </div>

        {!loading && !error && (
          <div className="mb-8">
            <VideoFilterTabs
              categories={CATEGORY_TABS}
              counts={counts}
              active={activeTab}
              onChange={handleTabChange}
            />
          </div>
        )}
 
        {/* ── Error state ── */}
        {error && (
          <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-8 text-center backdrop-blur-xl">
            <p className="text-[#FFB3C1] text-sm font-medium mb-1">Could not load videos</p>
            <p className="text-white/55 text-xs">{error}</p>
          </div>
        )}
 
        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        )}
 
        {/* ── Video grid ── */}
        {!loading && !error && visible.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visible.map((video) => (
              <VideoCard key={video.id} video={video} onOpen={handleOpen} />
            ))}
          </div>
        )}
 
        {/* ── Empty state ── */}
        {!loading && !error && visible.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-white/60 text-sm">No videos in this category yet.</p>
          </div>
        )}
 
        {/* ── Load more ── */}
        {!loading && !error && remaining > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[#FFE8ED] text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-xl"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M7 2v10"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              Load more · {remaining}
            </button>
          </div>
        )}

        {selectedVideo ? (
          <VideoPlayerModal video={selectedVideo} onClose={handleClose} />
        ) : null}
      </div>
    </section>
);}
