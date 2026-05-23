"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Headphones, BookOpen, Share2,
  Bookmark, BookmarkCheck, Heart, Lightbulb, Sparkles,
  MessageSquare, ChevronDown,
} from "lucide-react";
import AudioPlayer from "./AudioPlayer";

type DiscussionResponse = {
  id: string;
  content: string;
  createdAt: string;
  member: { firstName: string; lastName: string; photoUrl: string | null };
};

type DiscussionQuestion = {
  id: string;
  question: string;
  order: number;
  responses: DiscussionResponse[];
};

type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  transcript: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
  tags: string[];
  _count: { reactions: number; bookmarks: number };
  discussion: DiscussionQuestion[];
};

type MemberCtx = {
  memberId: string;
  reaction: { type: string } | null;
  bookmarked: boolean;
  note: string;
  positionSec: number;
} | null;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const REACTIONS = [
  { type: "amen",    emoji: "🙏", label: "Amen"              },
  { type: "learned", emoji: "💡", label: "Learned something" },
  { type: "blessed", emoji: "❤️", label: "Blessed"           },
];

export default function SermonDetail({ sermon, memberCtx, isLoggedIn }: {
  sermon: Sermon;
  memberCtx: MemberCtx;
  isLoggedIn: boolean;
}) {
  const [reaction, setReaction] = useState(memberCtx?.reaction?.type ?? null);
  const [bookmarked, setBookmarked] = useState(memberCtx?.bookmarked ?? false);
  const [note, setNote] = useState(memberCtx?.note ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  async function engage(action: string, extra?: object) {
    if (!isLoggedIn) return;
    await fetch(`/api/sermons/${sermon.slug}/engage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
  }

  async function handleReact(type: string) {
    if (!isLoggedIn) return;
    const next = reaction === type ? null : type;
    setReaction(next);
    await engage("react", { type });
  }

  async function handleBookmark() {
    if (!isLoggedIn) return;
    setBookmarked((b) => !b);
    await engage("bookmark");
  }

  async function saveNote() {
    if (!isLoggedIn) return;
    setSavingNote(true);
    await engage("note", { content: note });
    setNoteSaved(true);
    setSavingNote(false);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  const handleProgress = useCallback((pos: number, completed: boolean) => {
    if (!isLoggedIn) return;
    engage("progress", { positionSec: pos, completed });
  }, [isLoggedIn, sermon.slug]);

  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: sermon.title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/embed") || url.includes("player.vimeo.com")) return url;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111]">
      {/* Back nav */}
      <div className="border-b border-gray-200 dark:border-white/8 bg-white dark:bg-[#1c1c1e]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/sermons"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft size={14} /> All Sermons
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="space-y-3">
          {sermon.series && (
            <Link href={`/sermons/series/${sermon.seriesSlug}`}
              className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#87102C] dark:text-[#e8768a] hover:underline">
              {sermon.series}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">{sermon.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 dark:text-gray-500">
            <span>{sermon.speaker}</span>
            <span>·</span>
            <span>{fmtDate(sermon.date)}</span>
            {sermon.scriptureRef && <><span>·</span><span className="font-semibold text-[#87102C] dark:text-[#e8768a]">{sermon.scriptureRef}</span></>}
            <span>·</span>
            <span className="flex items-center gap-1"><Headphones size={12} /> {sermon.playCount} plays</span>
          </div>
          {sermon.description && (
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{sermon.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {sermon.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Audio Player */}
        {sermon.audioUrl && (
          <AudioPlayer
            src={sermon.audioUrl}
            sermonSlug={sermon.slug}
            initialPosition={memberCtx?.positionSec ?? 0}
            onProgress={handleProgress}
          />
        )}

        {/* Video embed */}
        {sermon.videoUrl && (
          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe src={getYouTubeEmbedUrl(sermon.videoUrl)}
              className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        )}

        {/* Reactions + Actions */}
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => handleReact(r.type)}
                  disabled={!isLoggedIn}
                  title={!isLoggedIn ? "Login to react" : r.label}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    reaction === r.type
                      ? "bg-[#87102C] text-white border-[#87102C] scale-105"
                      : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#87102C]/40 disabled:opacity-50 disabled:cursor-default"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="hidden sm:inline text-xs">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={handleBookmark} disabled={!isLoggedIn}
                title={!isLoggedIn ? "Login to bookmark" : bookmarked ? "Remove bookmark" : "Bookmark"}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  bookmarked
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                    : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-amber-300 disabled:opacity-50 disabled:cursor-default"
                }`}
              >
                {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                <span className="hidden sm:inline">{bookmarked ? "Saved" : "Save"}</span>
              </button>
              <button type="button" onClick={share}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-[#87102C]/40 transition-all">
                <Share2 size={15} />
                <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Personal Notes */}
        {isLoggedIn && (
          <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-[#87102C]" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">My Notes</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">Private — only you can see these</span>
            </div>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)}
              rows={4} placeholder="Write your personal notes, reflections, or key points…"
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400"
            />
            <div className="flex items-center gap-3">
              <button type="button" onClick={saveNote} disabled={savingNote}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all">
                {savingNote ? "Saving…" : "Save Notes"}
              </button>
              {noteSaved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Saved!</span>}
            </div>
          </div>
        )}

        {/* Transcript */}
        {sermon.transcript && (
          <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setShowTranscript((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-[#87102C]" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Sermon Notes / Transcript</span>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showTranscript ? "rotate-180" : ""}`} />
            </button>
            {showTranscript && (
              <div className="px-5 pb-5 prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                  {sermon.transcript}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Discussion Questions */}
        {sermon.discussion.length > 0 && (
          <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Reflection Questions</h3>
            </div>
            <ul className="space-y-3">
              {sermon.discussion.map((q, i) => (
                <li key={q.id} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.question}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* New here CTA */}
        {!isLoggedIn && (
          <div className="bg-[#87102C] text-white rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold uppercase tracking-widest text-white/60">New Here?</p>
            <h3 className="text-xl font-black">Join the Everlasting Hills Church Family</h3>
            <p className="text-white/70 text-sm max-w-sm mx-auto">
              Save sermons, track your listening, add personal notes, and connect with others.
            </p>
            <Link href="/connect"
              className="inline-block mt-2 px-6 py-3 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-gray-100 transition-colors">
              Connect With Us →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
