"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MessageSquare, Send } from "lucide-react";
import { useUnitTaskComments, useAddUnitTaskComment } from "@/lib/api";
import { showToast } from "@/components/ui/toast/toast";
import { formatDateTime, timeAgo } from "./taskReport";

const MAX_LEN = 1000;

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <span className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-[#87102C]/10 dark:bg-[#87102C]/25 flex items-center justify-center ring-2 ring-white dark:ring-[#161618]">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-[#87102C] dark:text-[#e8768a]">{name[0]?.toUpperCase() ?? "?"}</span>
      )}
    </span>
  );
}

/**
 * Discussion thread on a unit task — any unit member can read and post.
 * `commentCount` comes from the task list so the toggle shows a count before
 * the thread is ever opened; once open, the live thread length takes over.
 */
export default function TaskCommentThread({
  unitId,
  taskId,
  commentCount = 0,
}: {
  unitId: string;
  taskId: string;
  commentCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const { data: comments, isLoading } = useUnitTaskComments(open ? unitId : null, open ? taskId : null);
  const addComment = useAddUnitTaskComment();

  const count = comments?.length ?? commentCount;

  // Keep the newest comment in view when the thread grows.
  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, comments?.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content || addComment.isPending) return;
    try {
      await addComment.mutateAsync({ unitId, taskId, content });
      setText("");
    } catch {
      showToast.error("Your comment wasn't posted. Please try again.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
      >
        <MessageSquare size={13} />
        <span>
          {count === 0 ? "Comments" : `${count} comment${count === 1 ? "" : "s"}`}
        </span>
        {open ? <ChevronUp size={12} className="opacity-60" /> : <ChevronDown size={12} className="opacity-60" />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
          <div className="px-3.5 py-2 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Discussion</p>
            <p className="text-[11px] text-gray-400 dark:text-white/30">Visible to everyone in the unit</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading comments…
            </div>
          ) : comments && comments.length > 0 ? (
            <ul ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-white/[0.05]">
              {comments.map((c) => {
                const name = c.author?.name ?? "Unknown";
                return (
                  <li key={c.id} className="flex items-start gap-3 px-3.5 py-3">
                    <Avatar name={name} photoUrl={c.author?.photoUrl ?? null} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{name}</p>
                        <time
                          dateTime={c.createdAt}
                          title={formatDateTime(c.createdAt)}
                          className="text-[10px] text-gray-400 dark:text-white/35 whitespace-nowrap"
                        >
                          {timeAgo(c.createdAt)}
                        </time>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {c.content}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3.5 py-6 text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">No comments yet</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35 mt-0.5">Ask a question or leave an update for the team.</p>
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-white/[0.06] p-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder="Write a comment… (Enter to post, Shift+Enter for a new line)"
              aria-label="Write a comment"
              className="w-full resize-none rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[13px] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/25 focus:border-[#87102C]/40"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={`text-[10px] ${text.length > MAX_LEN * 0.9 ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-white/30"}`}>
                {text.length}/{MAX_LEN}
              </span>
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || addComment.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors"
              >
                {addComment.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {addComment.isPending ? "Posting…" : "Post comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
