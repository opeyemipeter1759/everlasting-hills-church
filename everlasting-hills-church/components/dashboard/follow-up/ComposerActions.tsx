"use client";

import { AtSign, SendHorizonal } from "lucide-react";
import { EmojiButton } from "./EmojiButton";

const ICON =
  "flex h-7 w-7 items-center justify-center rounded text-[#616061] transition-colors hover:bg-gray-100 hover:text-[#1D1C1D] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white";

/** The row under the writing box: emoji and mention on the left, send on the right. */
export function ComposerActions({
  canSend,
  onEmoji,
  onMention,
  onSend,
}: {
  canSend: boolean;
  onEmoji: (emoji: string) => void;
  onMention: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-2 py-1.5 dark:border-white/[0.07]">
      <div className="flex items-center gap-0.5">
        <EmojiButton onPick={onEmoji} />
        <button type="button" onClick={onMention} aria-label="Mention someone" title="Mention someone" className={ICON}>
          <AtSign size={16} aria-hidden="true" />
        </button>
        <span className="ml-1 hidden text-[11px] text-gray-400 sm:inline dark:text-white/30">
          <kbd className="font-sans font-semibold">Enter</kbd> to send
        </span>
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-[#87102C] text-white transition-colors hover:bg-[#6E0C24] disabled:bg-transparent disabled:text-gray-300 dark:disabled:text-white/25"
      >
        <SendHorizonal size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
