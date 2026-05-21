"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Maximize2, Share2, MessageCircle, ThumbsUp, Bell, ExternalLink } from "lucide-react";
import type { YouTubeVideo } from "@/types";

interface VideoPlayerModalProps {
  video: YouTubeVideo;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleShare(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: video.shareUrl,
        });
        return;
      } catch {
        // Fall through to copy.
      }
    }

    await navigator.clipboard.writeText(video.shareUrl);
  }

  function handleFullscreen(): void {
    const element = panelRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void element.requestFullscreen?.();
  }

  const embedSrc = `${video.embedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  const actionButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition-all hover:border-white/20 hover:bg-white/10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xl sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#120608] shadow-[0_40px_140px_rgba(0,0,0,0.55)]"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB3C1]">
              Now Playing
            </p>
            <h3 className="line-clamp-2 text-lg font-semibold text-white sm:text-xl">
              {video.title}
            </h3>
            <p className="mt-1 text-xs text-white/55">
              {video.channelTitle} · {video.formattedDate}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="border-b border-white/8 lg:border-b-0 lg:border-r lg:border-white/8">
            <div className="relative aspect-video bg-black">
              <iframe
                src={embedSrc}
                title={video.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/8 px-5 py-4 sm:px-6">
              <button type="button" onClick={handleFullscreen} className={actionButtonClass}>
                <Maximize2 className="h-4 w-4" />
                Full screen
              </button>
              <button type="button" onClick={handleShare} className={actionButtonClass}>
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <a href={video.channelUrl} target="_blank" rel="noreferrer" className={actionButtonClass}>
                <Bell className="h-4 w-4" />
                Subscribe
              </a>
              <a href={video.watchUrl} target="_blank" rel="noreferrer" className={actionButtonClass}>
                <ExternalLink className="h-4 w-4" />
                Open on YouTube
              </a>
            </div>
          </div>

          <aside className="space-y-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)] px-5 py-5 sm:px-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Views</p>
                <p className="mt-2 text-lg font-semibold text-white">{video.viewCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Likes</p>
                <p className="mt-2 text-lg font-semibold text-white">{video.likeCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Comments</p>
                <p className="mt-2 text-lg font-semibold text-white">{video.commentCount}</p>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#FFB3C1]/15 bg-[#87102C]/12 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full bg-[#FFB3C1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3b0714]">
                  {video.category}
                </span>
                <span className="text-xs text-white/55">{video.duration}</span>
              </div>
              <p className="text-sm leading-relaxed text-white/75">
                {video.description || "Watch this message, then use the actions below to keep engaging with the video without leaving the page."}
              </p>
            </div>

          {/*   <div className="space-y-3 rounded-[26px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FFB3C1]">
                Keep interacting
              </p>
              <p className="text-sm leading-relaxed text-white/65">
                You can watch here, then use the YouTube actions for subscription, likes, and comments when you want to engage directly with the channel.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a href={video.channelUrl} target="_blank" rel="noreferrer" className={actionButtonClass}>
                  <Bell className="h-4 w-4" />
                  Subscribe
                </a>
                <a href={video.watchUrl} target="_blank" rel="noreferrer" className={actionButtonClass}>
                  <ThumbsUp className="h-4 w-4" />
                  Like
                </a>
                <a href={video.watchUrl} target="_blank" rel="noreferrer" className={actionButtonClass}>
                  <MessageCircle className="h-4 w-4" />
                  Comment
                </a>
              </div>
            </div> */}
          </aside>
        </div>
      </motion.div>
    </div>
  );
}