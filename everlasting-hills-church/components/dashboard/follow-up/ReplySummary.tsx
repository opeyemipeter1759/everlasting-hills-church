"use client";

import { MessageSquare } from "lucide-react";
import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import { Avatar } from "./message-bits";
import { timeLabel } from "./thread-utils";

/** The collapsed line under a message: who replied, how many, and when last. */
export function ReplySummary({
  replies,
  faces,
  onOpen,
}: {
  replies: FollowUpNote[];
  faces: FollowUpNote[];
  onOpen: () => void;
}) {
  const last = replies[replies.length - 1];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group/replies mt-1 flex w-full items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 text-[13px] font-bold text-[#1264A3] transition-colors hover:border-gray-200 hover:bg-white dark:text-[#78B8E8] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
    >
      {replies.length > 0 ? (
        <>
          <span className="flex -space-x-1.5">
            {faces.slice(0, 3).map((reply) => (
              <span key={reply.id} className="rounded-[3px] ring-2 ring-white dark:ring-[#1c1c1e]">
                <Avatar name={reply.author.name} photoUrl={reply.author.photoUrl} size={18} />
              </span>
            ))}
          </span>
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
          <span className="font-normal text-[#616061] group-hover/replies:hidden dark:text-white/40">Last reply {timeLabel(last.createdAt)}</span>
          <span className="hidden font-normal text-[#616061] group-hover/replies:inline dark:text-white/40">View thread →</span>
        </>
      ) : (
        <>
          <MessageSquare size={13} aria-hidden="true" />
          Reply
        </>
      )}
    </button>
  );
}
