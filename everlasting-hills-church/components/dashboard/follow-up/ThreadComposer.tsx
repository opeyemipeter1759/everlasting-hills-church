"use client";

import { useEffect } from "react";

import { useFollowUpTeam } from "@/lib/api/follow-up-pipeline";
import { ComposerToolbar } from "./ComposerToolbar";
import { ComposerActions } from "./ComposerActions";
import { MentionMenu } from "./MentionMenu";
import { useComposer } from "./useComposer";

/**
 * Where you write. Formatting along the top, the box itself, then the send
 * button — and typing "@" offers the people on your unit, so a message can
 * name who it is for.
 */
export function ThreadComposer({
  firstName,
  busy,
  prefill,
  onSend,
}: {
  firstName: string;
  busy: boolean;
  /** Text to drop into the box — changes each time one is picked. */
  prefill?: { text: string; nonce: number };
  onSend: (body: string, done: () => void) => void;
}) {
  const { boxRef, draft, change, apply, fill, mentionQuery, completeMention, clear, startMention } = useComposer();

  const { data: team = [] } = useFollowUpTeam();

  useEffect(() => {
    if (prefill) fill(prefill.text);
    // Only when a new opener is picked, never on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.nonce]);

  const matches =
    mentionQuery === null
      ? []
      : team.filter((member) => member.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6);

  function send() {
    const body = draft.trim();
    if (!body || busy) return;
    onSend(body, clear);
  }

  return (
    <div className="relative mt-3">
      {matches.length > 0 && <MentionMenu people={matches} onPick={(name) => completeMention(name)} />}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-[#87102C]/40 focus-within:ring-2 focus-within:ring-[#87102C]/10 dark:border-white/10 dark:bg-white/5">
        <ComposerToolbar onApply={apply} onMention={startMention} />

        <textarea
          ref={boxRef}
          value={draft}
          rows={1}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter starts a new line. While the mention
            // menu is open, Enter belongs to the menu.
            if (e.key === "Enter" && !e.shiftKey && matches.length === 0) {
              e.preventDefault();
              send();
            }
            if (e.key === "Enter" && matches.length > 0) {
              e.preventDefault();
              completeMention(matches[0].name);
            }
          }}
          placeholder={`Message the team about ${firstName}`}
          aria-label="Write a message"
          className="block max-h-40 w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 dark:text-gray-100"
        />

        <ComposerActions
          canSend={!!draft.trim() && !busy}
          onEmoji={(emoji) => apply({ kind: "insert", text: emoji })}
          onMention={startMention}
          onSend={send}
        />
      </div>
    </div>
  );
}
