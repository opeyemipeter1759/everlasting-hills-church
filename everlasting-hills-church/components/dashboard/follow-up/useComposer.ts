"use client";

import { useRef, useState } from "react";
import type { Wrap } from "./ComposerToolbar";

const MAX_HEIGHT = 160;
// Letters, accented ones included — \p{L} needs a newer compile target.
const LETTER = "A-Za-z\u00C0-\u024F";
const TYPING_MENTION = new RegExp(`(?:^|\\s)@([${LETTER}]*)$`);
const HALF_TYPED_MENTION = new RegExp(`@[${LETTER}]*$`);

/**
 * The writing box's behaviour: applying a formatting mark to the selection,
 * growing with the text, and spotting an @mention being typed so the picker
 * can offer names.
 */
export function useComposer() {
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  /** The partial name after "@", or null when no mention is being typed. */
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  function resize() {
    const box = boxRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, MAX_HEIGHT)}px`;
  }

  function put(next: string, caret: number) {
    setDraft(next);
    requestAnimationFrame(() => {
      const box = boxRef.current;
      if (!box) return;
      box.focus();
      box.setSelectionRange(caret, caret);
      resize();
    });
  }

  function change(value: string) {
    setDraft(value);
    resize();
    const caret = boxRef.current?.selectionStart ?? value.length;
    // Only while typing the word directly after an "@".
    const typed = TYPING_MENTION.exec(value.slice(0, caret));
    setMentionQuery(typed ? typed[1] : null);
  }

  function apply(action: Wrap) {
    const box = boxRef.current;
    const start = box?.selectionStart ?? draft.length;
    const end = box?.selectionEnd ?? start;
    const selected = draft.slice(start, end);

    if (action.kind === "wrap") {
      const next = `${draft.slice(0, start)}${action.before}${selected}${action.after}${draft.slice(end)}`;
      put(next, selected ? end + action.before.length + action.after.length : start + action.before.length);
      return;
    }
    if (action.kind === "insert") {
      put(`${draft.slice(0, start)}${action.text}${draft.slice(end)}`, start + action.text.length);
      return;
    }
    // Prefix the line the caret sits on.
    const lineStart = draft.lastIndexOf("\n", start - 1) + 1;
    put(`${draft.slice(0, lineStart)}${action.prefix}${draft.slice(lineStart)}`, start + action.prefix.length);
  }

  /** Replaces the half-typed @word with the chosen name. */
  function completeMention(name: string) {
    const caret = boxRef.current?.selectionStart ?? draft.length;
    const before = draft.slice(0, caret).replace(HALF_TYPED_MENTION, `@${name} `);
    put(before + draft.slice(caret), before.length);
    setMentionQuery(null);
  }

  function clear() {
    setDraft("");
    setMentionQuery(null);
    requestAnimationFrame(resize);
  }

  /** Fills the box from outside — the empty state's openers use this. */
  function fill(text: string) {
    put(text, text.length);
  }

  return {
    boxRef,
    draft,
    change,
    apply,
    fill,
    mentionQuery,
    completeMention,
    clear,
    startMention: () => apply({ kind: "insert", text: "@" }),
  };
}
