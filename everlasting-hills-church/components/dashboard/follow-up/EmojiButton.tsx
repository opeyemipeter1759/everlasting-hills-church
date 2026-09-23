"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { QUICK_EMOJI } from "./ReactionBar";

/** Drops an emoji straight into the message being written. */
export function EmojiButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add an emoji"
        title="Emoji"
        className="flex h-7 w-7 items-center justify-center rounded text-[#616061] transition-colors hover:bg-gray-100 hover:text-[#1D1C1D] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Smile size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1 flex w-max max-w-[15rem] flex-wrap gap-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[#26262a]">
          {QUICK_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={(e) => {
                // mousedown so the writing box keeps focus
                e.preventDefault();
                onPick(emoji);
                setOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-base transition-transform hover:scale-125 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <span aria-hidden="true">{emoji}</span>
              <span className="sr-only">Insert {emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
