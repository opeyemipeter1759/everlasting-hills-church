"use client";

import type { YouTubeVideo, VideoCategory } from "@/types";
import { motion } from "framer-motion";
import { Eye, Play, Share2, ThumbsUp, MessageCircle } from "lucide-react";

interface VideoCardProps {
  video: YouTubeVideo;
  onOpen: (video: YouTubeVideo) => void;
}

const BADGE_COLORS: Record<VideoCategory, string> = {
  Sunday: "bg-[#87102C] text-white",
  Saturday: "bg-[#FFB3C1] text-[#3b0714]",
  Monday: "bg-[#2a1216] text-[#FFB3C1]/80",
  Tuesday: "bg-[#2a1216] text-[#FFB3C1]/80",
  Wednesday: "bg-[#2a1216] text-[#FFB3C1]/80",
  Thursday: "bg-[#2a1216] text-[#FFB3C1]/80",
  Friday: "bg-[#2a1216] text-[#FFB3C1]/80",
  Shorts: "bg-[#5d091f] text-[#FFE8ED]",
  Other: "bg-[#2a1216] text-[#FFB3C1]/80",
};

function StatPill({ icon: Icon, value }: { icon: typeof Play; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/72">
      <Icon className="h-3.5 w-3.5 text-[#FFB3C1]" />
      {value}
    </span>
  );
}

export default function VideoCard({ video, onOpen }: VideoCardProps) {
  const badgeClass = BADGE_COLORS[video.category] ?? BADGE_COLORS.Other;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(video)}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group w-full overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)] text-left shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-white/18 hover:shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#14070b]">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#271015] via-[#14070b] to-[#0a0a0a]">
            <div className="rounded-full border border-white/10 bg-white/5 p-5">
              <Play className="h-8 w-8 text-[#FFB3C1]" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/25 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${badgeClass}`}>
            {video.category}
          </span>
          {video.duration ? (
            <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/80 backdrop-blur-sm">
              {video.duration}
            </span>
          ) : null}
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <Play className="h-6 w-6 fill-white text-white" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-white/70">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#FFB3C1]" />
            Tap to open player
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 pt-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-[#FFE8ED]">
          {video.title}
        </h3>

        <p className="text-xs leading-relaxed text-white/60 line-clamp-2">
          {video.channelTitle} · {video.formattedDate}
        </p>

        <div className="flex flex-wrap gap-2">
          <StatPill icon={Eye} value={video.viewCount} />
          <StatPill icon={ThumbsUp} value={video.likeCount} />
          <StatPill icon={MessageCircle} value={video.commentCount} />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB3C1]">
            <Play className="h-3.5 w-3.5 fill-current" />
            Open player
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/55 transition-colors group-hover:text-white/80">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </span>
        </div>
      </div>
    </motion.button>
  );
}