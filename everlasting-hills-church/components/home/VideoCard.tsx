"use client";

import type { YouTubeVideo, VideoCategory } from "@/types";

interface VideoCardProps {
  video: YouTubeVideo;
}

const BADGE_COLORS: Record<VideoCategory, string> = {
  Sunday: "bg-[#C8821A] text-white",
  Tuesday: "bg-[#1A3A6A] text-white",
  Shorts: "bg-[#B01A1A] text-white",
  Other: "bg-[#2A3A2A] text-[#8AB08A]",
};

export default function VideoCard({ video }: VideoCardProps) {
  const badgeClass = BADGE_COLORS[video.category] ?? BADGE_COLORS.Other;

  return (
    <a
      href={video.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden bg-[#0D1117] hover:bg-[#131920] transition-colors duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1A2030]">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1A2030] to-[#0D1117]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M4 32L20 8L36 32H4Z" fill="white" opacity="0.08" />
              <path d="M11 32L20 16L29 32H11Z" fill="white" opacity="0.15" />
              <path d="M16 32L20 22L24 32H16Z" fill="white" opacity="0.3" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${badgeClass}`}>
            {video.category}
          </span>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-white/80 text-[10px] font-medium">{video.duration}</span>
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
          <div className="w-12 h-12 rounded-full bg-[#1A90FF]/80 backdrop-blur-sm flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
              <path d="M5 3.5l10 5.5-10 5.5V3.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card metadata */}
      <div className="pt-3 pb-1 px-0.5">
        <h3 className="text-[#D0DCE8] text-sm font-semibold leading-snug mb-1.5 line-clamp-2 group-hover:text-white transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-[#5A7090] text-xs">
            {video.channelTitle} · {video.formattedDate}
          </p>
          <span className="text-[#1A90FF] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Watch
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}