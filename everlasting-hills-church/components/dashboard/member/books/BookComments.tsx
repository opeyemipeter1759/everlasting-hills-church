"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useMe } from "@/lib/api";
import { useAddBookComment, useBookComments, useDeleteBookComment } from "@/lib/api/books";
import { showToast } from "@/components/ui/toast/toast";
import type { BookComment } from "@/lib/api/books";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function Avatar({ member }: { member: BookComment["Member"] }) {
  if (member.photoUrl) {
    return (
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
        <Image src={member.photoUrl} alt="" fill sizes="28px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[10px] font-black text-[#87102C] dark:text-[#e8768a]">
      {initials(member.firstName, member.lastName)}
    </div>
  );
}

export default function BookComments({ bookId }: { bookId: string }) {
  const { data: me } = useMe();
  const { data: comments, isLoading } = useBookComments(bookId);
  const addComment = useAddBookComment();
  const deleteComment = useDeleteBookComment();
  const [draft, setDraft] = useState("");

  const currentMemberId = me?.member?.id;

  function post() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addComment.mutate(
      { bookId, content: trimmed },
      {
        onSuccess: () => setDraft(""),
        onError: () => showToast.error("Could not post your comment — try again"),
      },
    );
  }

  function remove(commentId: string) {
    deleteComment.mutate({ commentId, bookId }, { onError: () => showToast.error("Could not delete that comment") });
  }

  const list = comments ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5">
      <p className="mb-4 text-xs font-semibold text-gray-400 dark:text-white/40">
        {list.length} comment{list.length !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-white/10" />
              <div className="h-9 flex-1 max-w-xs rounded-2xl bg-gray-100 dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageCircle size={18} className="text-gray-300 dark:text-white/20" />
          <p className="text-sm text-gray-400 dark:text-white/40">No comments yet — be the first to share.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {list.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar member={c.Member} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 dark:text-white/60">
                    {c.Member.firstName} {c.Member.lastName}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-white/30">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-800 dark:text-white/80 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
                {c.memberId === currentMemberId && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={9} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-end gap-2 border-t border-gray-100 dark:border-white/8 pt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={1}
          placeholder="Share your thoughts on this book…"
          className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              post();
            }
          }}
        />
        <button
          type="button"
          onClick={post}
          disabled={addComment.isPending || !draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-all"
          aria-label="Send"
        >
          {addComment.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
