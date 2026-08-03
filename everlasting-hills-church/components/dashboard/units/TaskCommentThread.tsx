"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useUnitTaskComments, useAddUnitTaskComment } from "@/lib/api";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/** Expandable comment thread on a unit task — any unit member can view/post. */
export default function TaskCommentThread({ unitId, taskId }: { unitId: string; taskId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { data: comments } = useUnitTaskComments(open ? unitId : null, open ? taskId : null);
  const addComment = useAddUnitTaskComment();

  async function handleSend() {
    if (!text.trim()) return;
    try {
      await addComment.mutateAsync({ unitId, taskId, content: text.trim() });
      setText("");
    } catch {
      // inline error state isn't critical here — the input just keeps the draft
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
      >
        <MessageSquare size={11} />
        {comments && comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}` : "Comment"}
      </button>

      {open && (
        <div className="mt-2.5 space-y-2.5 rounded-xl border border-gray-100 dark:border-white/8 bg-white dark:bg-[#161618] p-3">
          {comments && comments.length > 0 && (
            <ul className="space-y-2.5 max-h-56 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center mt-0.5">
                    {c.author?.photoUrl ? (
                      <img src={c.author.photoUrl} alt={c.author.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-[#87102C] dark:text-[#e8768a]">
                        {c.author?.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-tight">
                      <span className="font-bold text-gray-700 dark:text-gray-200">{c.author?.name ?? "Unknown"}</span>{" "}
                      <span className="text-gray-400 dark:text-gray-500">{timeAgo(c.createdAt)}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 break-words">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {comments && comments.length === 0 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">No comments yet — be the first.</p>
          )}

          <div className="flex items-center gap-1.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Write a comment…"
              maxLength={1000}
              className="flex-1 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || addComment.isPending}
              aria-label="Post comment"
              className="flex-shrink-0 p-1.5 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
