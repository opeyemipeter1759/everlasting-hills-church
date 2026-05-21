"use client";

import ScrollReveal from "./ScrollReveal";
import { Play, ArrowRight } from "lucide-react";
import VideoFilterTabs from "./Videofiltertabs";
import type { CategoryCounts, VideoCategory } from "@/types";
import { useYouTubeVideos } from "../utils/Useyoutubevideos";
import { useMemo, useState } from "react";
import VideoCardSkeleton from "../ui/skelenton/VideoCardSkeleton";
import VideoCard from "./VideoCard";

type TabLabel = "All" | VideoCategory;
const INITIAL_FETCH = 12;
const PAGE_SIZE = 4;
 
const CATEGORY_TABS: VideoCategory[] = ["Sunday", "Tuesday", "Shorts"];
 
export default function SermonsSection() {
  const { videos, loading, error } = useYouTubeVideos(INITIAL_FETCH);
  const [activeTab, setActiveTab] = useState<TabLabel>("All");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
 
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
  return(
    <section id="sermons" className="py-24 md:px-4 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <ScrollReveal>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                Recent Teachings
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                {/* ── Sermons heading — edit freely ── */}
                The Word, taught with clarity
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2} direction="right">
            <a
              href="#"
              // ── Replace with your sermons archive page/channel ──
              className="flex items-center gap-2 text-[#87102C] text-sm font-semibold hover:gap-3 transition-all whitespace-nowrap"
            >
              View all sermons <ArrowRight size={15} />
            </a>
          </ScrollReveal>
        </div>

        {/* Sermon cards */}
       {/* ── Filter tabs ── */}
        {!loading && !error && (
          <div className="mb-7">
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
          <div className="rounded-xl border border-[#3A2020] bg-[#1A0D0D] px-6 py-8 text-center">
            <p className="text-[#E06060] text-sm font-medium mb-1">Could not load videos</p>
            <p className="text-[#6A4040] text-xs">{error}</p>
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
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
 
        {/* ── Empty state ── */}
        {!loading && !error && visible.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[#3A5070] text-sm">No videos in this category yet.</p>
          </div>
        )}
 
        {/* ── Load more ── */}
        {!loading && !error && remaining > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F1820] border border-[#1E3050] text-[#7AA8D0] text-sm font-medium hover:bg-[#131F2C] hover:text-[#A0C8E8] transition-all"
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
      </div>
    </section>
);}
