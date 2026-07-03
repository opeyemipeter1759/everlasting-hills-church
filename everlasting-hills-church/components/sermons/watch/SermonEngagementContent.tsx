'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Share2, Bookmark, BookmarkCheck, BookOpen, Headphones,
  MessageCircle, PenLine, Lightbulb, ChevronDown, Flame, Send,
} from 'lucide-react';
import CommentsPanel from './CommentsPanel';
import ReflectionPanel from './ReflectionPanel';
import NotesPanel from './NotesPanel';
import DirectMessagesPanel from './DirectMessagesPanel';
import { useSermonReaction, useSermonBookmark } from '@/lib/api';
import { showToast } from '@/components/ui/toast/toast';
import type { MemberSermonContext, ReactionType, WatchSermon } from '@/lib/api/sermon-types';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'AMEN', emoji: '🙏', label: 'Amen' },
  { type: 'LIKE', emoji: '❤️', label: 'Encouraging' },
  { type: 'CONVICTED', emoji: '💡', label: 'Convicted' },
];

const TABS = [
  { id: 'comments', label: 'Comments', icon: MessageCircle },
  { id: 'reflection', label: 'Reflection', icon: Lightbulb },
  { id: 'notes', label: 'My Notes', icon: PenLine },
  { id: 'direct', label: 'Ask & Share', icon: Send },
] as const;
type TabId = (typeof TABS)[number]['id'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Everything about a sermon that isn't the media player itself: title/meta, reactions,
 * bookmark/share, transcript, and the Comments/Reflection/Notes tabs. Shared by the full
 * /sermons/[slug] watch page and the expanded state of the bottom player bar so there's a
 * single audio element on screen at a time (this component never touches playback).
 */
export default function SermonEngagementContent({
  sermon,
  memberCtx,
  isLoggedIn,
  compact,
}: {
  sermon: WatchSermon;
  memberCtx: MemberSermonContext | null;
  isLoggedIn: boolean;
  compact?: boolean;
}) {
  const [reaction, setReaction] = useState(memberCtx?.reaction?.type ?? null);
  const [bookmarked, setBookmarked] = useState(!!memberCtx?.bookmark);
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [tab, setTab] = useState<TabId>('comments');

  const setReactionMutation = useSermonReaction();
  const toggleBookmarkMutation = useSermonBookmark();

  // memberCtx often arrives after first render (it's fetched client-side in the player bar
  // drawer and the member dashboard page) — the useState initializers above only run once on
  // mount, so without this the button silently ignores the real saved/reacted state and the
  // next click toggles the wrong way.
  useEffect(() => {
    setReaction(memberCtx?.reaction?.type ?? null);
    setBookmarked(!!memberCtx?.bookmark);
  }, [memberCtx]);

  function handleReact(type: ReactionType) {
    if (!isLoggedIn) return;
    const next = reaction === type ? null : type;
    setReaction(next);
    setReactionMutation.mutate(
      { sermonId: sermon.id, type },
      { onError: () => { setReaction(reaction); showToast.error('Could not save your reaction'); } },
    );
  }

  function handleBookmark() {
    if (!isLoggedIn) return;
    setBookmarked((b) => !b);
    toggleBookmarkMutation.mutate(sermon.id, {
      onError: () => { setBookmarked((b) => !b); showToast.error('Could not update bookmark'); },
    });
  }

  function share() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/sermons/${sermon.slug}` : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: sermon.title, url }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {sermon.series && (
          <Link
            href={`/sermons/series/${sermon.seriesSlug}`}
            className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#87102C] dark:text-[#e8768a] hover:underline"
          >
            {sermon.series}
          </Link>
        )}
        <h1 className={`font-black text-gray-900 dark:text-white leading-tight ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
          {sermon.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 dark:text-gray-500">
          <span className="font-semibold text-gray-600 dark:text-gray-300">{sermon.speaker}</span>
          <span>·</span>
          <span>{fmtDate(sermon.date)}</span>
          {sermon.scriptureRef && (
            <>
              <span>·</span>
              <span className="font-semibold text-[#87102C] dark:text-[#e8768a]">{sermon.scriptureRef}</span>
            </>
          )}
          <span>·</span>
          <span className="flex items-center gap-1">
            <Headphones size={12} /> {sermon.playCount} play{sermon.playCount !== 1 ? 's' : ''}
          </span>
        </div>
        {sermon.description && (
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{sermon.description}</p>
        )}
        {sermon.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sermon.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-y border-gray-100 dark:border-white/8 py-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              onClick={() => handleReact(r.type)}
              disabled={!isLoggedIn}
              title={!isLoggedIn ? 'Log in to react' : r.label}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all ${
                reaction === r.type
                  ? 'bg-[#87102C] text-white border-[#87102C] scale-105'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#87102C]/40 disabled:opacity-50 disabled:cursor-default'
              }`}
            >
              <span>{r.emoji}</span>
              <span className="hidden sm:inline text-xs">{r.label}</span>
            </button>
          ))}
          {sermon._count.reactions > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center gap-1">
              <Flame size={11} /> {sermon._count.reactions}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBookmark}
            disabled={!isLoggedIn}
            title={!isLoggedIn ? 'Log in to save' : bookmarked ? 'Remove bookmark' : 'Save'}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all ${
              bookmarked
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-amber-300 disabled:opacity-50 disabled:cursor-default'
            }`}
          >
            {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-[#87102C]/40 transition-all"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* ── Transcript ───────────────────────────────────────────── */}
      {sermon.transcript && (
        <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <BookOpen size={14} className="text-[#87102C]" /> Transcript
            </span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
          </button>
          {showTranscript && (
            <div className="px-4 pb-4">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{sermon.transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1 border-b border-gray-100 dark:border-white/8 mb-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  active
                    ? 'border-[#87102C] text-[#87102C] dark:text-[#e8768a]'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'comments' && (
          <CommentsPanel sermonId={sermon.id} isLoggedIn={isLoggedIn} currentMemberId={memberCtx?.memberId} />
        )}
        {tab === 'reflection' && (
          <ReflectionPanel questions={sermon.discussion} isLoggedIn={isLoggedIn} currentMemberId={memberCtx?.memberId} />
        )}
        {tab === 'notes' && (
          <NotesPanel sermonId={sermon.id} initialNote={memberCtx?.note?.content ?? ''} isLoggedIn={isLoggedIn} />
        )}
        {tab === 'direct' && (
          isLoggedIn ? (
            <DirectMessagesPanel sermonId={sermon.id} currentMemberId={memberCtx?.memberId} />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl px-3.5 py-3">
              Log in to share a note or ask a question directly to another member.
            </p>
          )
        )}
      </div>

      {/* ── New here CTA ─────────────────────────────────────────── */}
      {!isLoggedIn && (
        <div className="bg-[#87102C] text-white rounded-2xl p-6 sm:p-8 text-center space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-white/60">New Here?</p>
          <h3 className="text-xl font-black">Join the Everlasting Hills Church Family</h3>
          <p className="text-white/70 text-sm max-w-sm mx-auto">
            React, comment, save sermons, track your listening, and add personal notes.
          </p>
          <Link
            href="/connect"
            className="inline-block mt-2 px-6 py-3 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            Connect With Us →
          </Link>
        </div>
      )}
    </div>
  );
}
