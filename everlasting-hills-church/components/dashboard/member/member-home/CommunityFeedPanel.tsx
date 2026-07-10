"use client";

import { useRef } from "react";
import { Send, MessageCircle, Heart, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import type { MemberHomeProps } from "./types";
import { iconBg, iconCl, muted, linkCl } from "./tokens";
import { relativeTime } from "./helpers";
import { PanelCard } from "./Primitives";
import { useCommunityFeed } from "./useCommunityFeed";

export function CommunityFeedPanel({
  feed, onlineCount,
}: {
  feed: MemberHomeProps["communityFeed"];
  onlineCount?: number | null;
}) {
  const { posts, draft, setDraft, submitting, reactingIds, handleSubmit, handleReact } = useCommunityFeed(feed ?? []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <PanelCard
      kicker="Community"
      title="Church Feed"
      icon={Users}
      action={<Link href="/dashboard" className={linkCl}>View all <ChevronRight size={12} /></Link>}
    >
      {onlineCount != null && onlineCount > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {onlineCount} member{onlineCount !== 1 ? "s" : ""} online now
          </p>
        </div>
      )}

      {/* Composer */}
      <div className="flex gap-2 mb-4">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          rows={2}
          maxLength={500}
          placeholder="Share something with the church family…"
          className="flex-1 resize-none rounded-xl border border-[#E7CDD3]/70 dark:border-white/[0.1] bg-[#FFF8F9] dark:bg-white/[0.04] px-3 py-2 text-xs text-[#111] dark:text-white placeholder:text-[#c0a8af] dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#87102C]/40 transition"
        />
        <button
          onClick={handleSubmit}
          disabled={!draft.trim() || submitting}
          className="self-end flex items-center justify-center w-8 h-8 rounded-xl bg-[#87102C] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6E0C24] transition flex-shrink-0"
          aria-label="Post"
        >
          <Send size={13} />
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className={`${iconBg} !w-11 !h-11 !rounded-2xl`}>
            <MessageCircle size={18} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No posts yet</p>
            <p className={`text-xs ${muted} mt-0.5`}>Be the first to share something</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.slice(0, 5).map((post) => {
            const postInitials = post.authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const reacted = reactingIds.has(post.id);
            return (
              <div key={post.id} className="flex gap-3 pb-4 border-b border-[#E7CDD3]/50 dark:border-white/[0.06] last:border-0 last:pb-0">
                {post.authorPhotoUrl ? (
                  <img src={post.authorPhotoUrl} alt={post.authorName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#87102C] dark:text-[#FFB3C1]">
                    {postInitials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-xs font-semibold text-[#111] dark:text-white truncate">{post.authorName}</p>
                    <p className={`text-[10px] ${muted} flex-shrink-0`}>{relativeTime(post.createdAt)}</p>
                  </div>
                  <p className={`text-xs ${muted} mt-0.5 leading-relaxed`}>{post.text}</p>
                  <button
                    onClick={() => handleReact(post.id)}
                    disabled={reacted}
                    className={`flex items-center gap-1 mt-1.5 group transition ${reacted ? "cursor-default" : "hover:scale-105 active:scale-95"}`}
                    aria-label="React with heart"
                  >
                    <Heart
                      size={12}
                      className={`transition ${reacted ? "text-rose-500" : "text-rose-300 group-hover:text-rose-500"}`}
                      fill={reacted ? "currentColor" : "none"}
                    />
                    <span className={`text-[10px] ${muted}`}>{post.reactions}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
