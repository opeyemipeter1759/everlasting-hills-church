"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import type { NoteReaction } from "@/lib/api/follow-up-pipeline";

/** The emojis a church team actually reaches for — praying hands first. */
export const QUICK_EMOJI = ["🙏", "👍", "❤️", "🎉", "😀", "😢", "👀", "✅", "📞", "🔥"];

/**
 * Emoji under a message: a pill per emoji with its count, lit when you are
 * one of them, and a button to add another. Tapping a pill you are in takes
 * your reaction back.
 */
export function ReactionBar({
  reactions,
  busy,
  onToggle,
}: {
  reactions: NoteReaction[];
  busy: boolean;
  onToggle: (emoji: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          disabled={busy}
          onClick={() => onToggle(reaction.emoji)}
          title={`${reaction.names.join(", ")} reacted with ${reaction.emoji}`}
          className={`flex h-[22px] items-center gap-1 rounded-full border px-2 text-xs transition-colors ${
            reaction.mine
              ? "border-[#87102C] bg-[#FFE8ED] font-semibold text-[#87102C] dark:border-[#FFB3C1]/50 dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
              : "border-gray-200 bg-[#F8F8F8] text-[#616061] hover:border-gray-400 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60"
          }`}
        >
          <span aria-hidden="true">{reaction.emoji}</span>
          <span className="font-semibold tabular-nums">{reaction.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          aria-label="Add a reaction"
          title="Add a reaction"
          className={`flex h-[22px] w-[30px] items-center justify-center rounded-full border border-gray-200 bg-[#F8F8F8] text-[#616061] transition-colors hover:border-gray-400 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white/50 ${
            reactions.length === 0 ? "opacity-0 group-hover:opacity-100 focus:opacity-100" : ""
          }`}
        >
          <SmilePlus size={13} aria-hidden="true" />
        </button>

        {picking && (
          <div className="absolute bottom-full left-0 z-20 mb-1 flex w-max max-w-[15rem] flex-wrap gap-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[#26262a]">
            {QUICK_EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggle(emoji);
                  setPicking(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-base transition-transform hover:scale-125 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="sr-only">React with {emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
