"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  ThumbsUp,
  Hand,
  Flame,
  Bookmark,
  StickyNote,
  MessageSquare,
  MessagesSquare,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { MemberAvatar } from "@/components/ui/display/MemberAvatar";
import { timeAgo } from "@/components/sermons/watch/chatUi";
import { formatSermonDuration, type CommentAuthor, type SermonComment } from "@/lib/api/sermon-types";

type Reaction = { id: string; type: string; createdAt: string; member: CommentAuthor };
type Bookmark_ = { id: string; createdAt: string; member: CommentAuthor };
type Note = { id: string; content: string; createdAt: string; member: CommentAuthor };
type Listen = { id: string; positionSec: number; completed: boolean; updatedAt: string; member: CommentAuthor };
type DiscussionResponse = { id: string; content: string; createdAt: string; member: CommentAuthor };
type Discussion = { id: string; question: string; order: number; responses: DiscussionResponse[] };

type Props = {
  sermon: {
    id: string;
    title: string;
    slug: string;
    speaker: string;
    date: string;
    playCount: number;
    series: string | null;
    audioDuration: number | null;
  };
  reactions: Reaction[];
  bookmarks: Bookmark_[];
  notes: Note[];
  comments: SermonComment[];
  listens: Listen[];
  discussion: Discussion[];
};

const REACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  LIKE: { label: "Liked", icon: <ThumbsUp size={12} />, color: "text-blue-500" },
  AMEN: { label: "Amen", icon: <Hand size={12} />, color: "text-amber-500" },
  CONVICTED: { label: "Convicted", icon: <Flame size={12} />, color: "text-[#87102C] dark:text-[#e8768a]" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function memberName(m: CommentAuthor) {
  return `${m.firstName} ${m.lastName}`;
}

function EmptyRow({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">{label}</p>;
}

function CommentThread({ comments, depth = 0 }: { comments: SermonComment[]; depth?: number }) {
  return (
    <div className={depth > 0 ? "pl-8 mt-3 space-y-3" : "space-y-3"}>
      {comments.map((c) => (
        <div key={c.id}>
          <div className="flex items-start gap-2.5">
            <MemberAvatar name={memberName(c.member)} photoUrl={c.member.photoUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl bg-gray-100 dark:bg-white/[0.06] px-3.5 py-2.5">
                <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{memberName(c.member)}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</p>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 ml-1">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
          {c.replies.length > 0 && <CommentThread comments={c.replies} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

export default function SermonEngagementDetail({ sermon, reactions, bookmarks, notes, comments, listens, discussion }: Props) {
  const totalDiscussionResponses = discussion.reduce((n, q) => n + q.responses.length, 0);
  const completedListens = listens.filter((l) => l.completed).length;

  const tabs = [
    { key: "comments", label: "Comments", count: comments.length, icon: <MessageSquare size={13} /> },
    { key: "reactions", label: "Reactions", count: reactions.length, icon: <ThumbsUp size={13} /> },
    { key: "notes", label: "Notes", count: notes.length, icon: <StickyNote size={13} /> },
    { key: "bookmarks", label: "Bookmarks", count: bookmarks.length, icon: <Bookmark size={13} /> },
    { key: "listens", label: "Listens", count: listens.length, icon: <Headphones size={13} /> },
    { key: "discussion", label: "Discussion", count: totalDiscussionResponses, icon: <MessagesSquare size={13} /> },
  ] as const;

  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("comments");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/pastor/sermons/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors mb-3"
        >
          <ArrowLeft size={13} /> Back to analytics
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 dark:text-white">{sermon.title}</h1>
              {sermon.series && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a]">
                  {sermon.series}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {sermon.speaker} · {fmtDate(sermon.date)} · {formatSermonDuration(sermon.audioDuration)}
            </p>
          </div>
          <Link
            href={`/sermons/${sermon.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={12} /> View public page
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><Play size={11} /> Plays</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{sermon.playCount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><ThumbsUp size={11} /> Like</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{reactions.filter((r) => r.type === "LIKE").length}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><Hand size={11} /> Amen</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{reactions.filter((r) => r.type === "AMEN").length}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><Flame size={11} /> Convicted</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{reactions.filter((r) => r.type === "CONVICTED").length}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><Bookmark size={11} /> Saved</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{bookmarks.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><MessageSquare size={11} /> Comments</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{comments.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1"><CheckCircle2 size={11} /> Finished</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {listens.length > 0 ? `${Math.round((completedListens / listens.length) * 100)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Tabbed detail panel */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-3 border-b border-gray-100 dark:border-white/8 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-t-lg whitespace-nowrap transition-colors border-b-2 ${
                tab === t.key
                  ? "border-[#87102C] text-[#87102C] dark:text-[#e8768a]"
                  : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              {t.icon} {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab === t.key ? "bg-[#87102C]/10 dark:bg-[#87102C]/20" : "bg-gray-100 dark:bg-white/5"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "comments" &&
            (comments.length === 0 ? <EmptyRow label="No comments yet." /> : <CommentThread comments={comments} />)}

          {tab === "reactions" &&
            (reactions.length === 0 ? (
              <EmptyRow label="No reactions yet." />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/8">
                {reactions.map((r) => {
                  const meta = REACTION_META[r.type] ?? { label: r.type, icon: null, color: "text-gray-400" };
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-3">
                      <MemberAvatar name={memberName(r.member)} photoUrl={r.member.photoUrl} size="sm" />
                      <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{memberName(r.member)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${meta.color}`}>{meta.icon} {meta.label}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-20 text-right">{timeAgo(r.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            ))}

          {tab === "notes" &&
            (notes.length === 0 ? (
              <EmptyRow label="No private notes yet." />
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5">
                    <MemberAvatar name={memberName(n.member)} photoUrl={n.member.photoUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/60 dark:bg-white/[0.03] px-3.5 py-2.5">
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{memberName(n.member)}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{n.content}</p>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 ml-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {tab === "bookmarks" &&
            (bookmarks.length === 0 ? (
              <EmptyRow label="No bookmarks yet." />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/8">
                {bookmarks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-3">
                    <MemberAvatar name={memberName(b.member)} photoUrl={b.member.photoUrl} size="sm" />
                    <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{memberName(b.member)}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(b.createdAt)}</span>
                  </div>
                ))}
              </div>
            ))}

          {tab === "listens" &&
            (listens.length === 0 ? (
              <EmptyRow label="No one has listened yet." />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/8">
                {listens.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 py-3">
                    <MemberAvatar name={memberName(l.member)} photoUrl={l.member.photoUrl} size="sm" />
                    <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{memberName(l.member)}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        l.completed
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {l.completed ? "Finished" : `At ${formatSermonDuration(l.positionSec)}`}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 w-20 text-right">{timeAgo(l.updatedAt)}</span>
                  </div>
                ))}
              </div>
            ))}

          {tab === "discussion" &&
            (discussion.length === 0 ? (
              <EmptyRow label="No discussion questions on this sermon." />
            ) : (
              <div className="space-y-4">
                {discussion.map((q, i) => (
                  <div key={q.id} className="rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/60 dark:bg-white/[0.03] p-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-black mr-2">
                        {i + 1}
                      </span>
                      {q.question}
                    </p>
                    {q.responses.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 pl-7">No responses yet.</p>
                    ) : (
                      <div className="pl-7 space-y-2.5">
                        {q.responses.map((r) => (
                          <div key={r.id} className="flex items-start gap-2">
                            <MemberAvatar name={memberName(r.member)} photoUrl={r.member.photoUrl} size="xs" />
                            <div>
                              <span className="text-xs font-bold text-gray-900 dark:text-white mr-1.5">{memberName(r.member)}:</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">{r.content}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1.5">· {timeAgo(r.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
