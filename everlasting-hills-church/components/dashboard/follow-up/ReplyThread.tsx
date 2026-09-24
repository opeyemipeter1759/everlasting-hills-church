"use client";

import { useState } from "react";

import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import { Avatar } from "./message-bits";
import { MessageBody } from "./message-format";
import { timeLabel } from "./thread-utils";
import { ReplySummary } from "./ReplySummary";

/**
 * Replies under a message: collapsed to a count with the faces of whoever
 * answered, opening into the replies themselves and a box to add one. Keeping
 * them tucked away is what stops one busy message burying the rest.
 */
export function ReplyThread({
  replies,
  busy,
  onReply,
}: {
  replies: FollowUpNote[];
  busy: boolean;
  onReply: (body: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const faces = replies.filter((r, i, all) => all.findIndex((x) => x.author.profileId === r.author.profileId) === i);
  const last = replies[replies.length - 1];

  function send() {
    const body = draft.trim();
    if (!body || busy) return;
    onReply(body);
    setDraft("");
  }

  if (!open) {
    return <ReplySummary replies={replies} faces={faces} onOpen={() => setOpen(true)} />;
  }

  return (
    <div className="mt-1.5 border-l-2 border-gray-200 pl-3 dark:border-white/10">
      <ul className="space-y-2">
        {replies.map((reply) => (
          <li key={reply.id} className="flex gap-2">
            <Avatar name={reply.author.name} photoUrl={reply.author.photoUrl} size={24} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-[#111] dark:text-white">{reply.author.name}</span>
                <span className="text-[11px] text-gray-400 dark:text-white/35">{timeLabel(reply.createdAt)}</span>
              </p>
              <div className="text-sm leading-relaxed text-gray-700 dark:text-white/75">
                <MessageBody body={reply.body} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Reply…"
          aria-label="Write a reply"
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-gray-500 hover:underline dark:text-white/45"
        >
          Close
        </button>
      </div>
    </div>
  );
}
