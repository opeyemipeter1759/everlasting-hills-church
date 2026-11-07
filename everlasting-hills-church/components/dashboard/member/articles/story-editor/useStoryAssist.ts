"use client";

import { useRef, type MutableRefObject, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { markdownToDoc } from "@/lib/article-markdown";
import { showToast } from "@/components/ui/toast/toast";
import type { WritingAction } from "@/lib/api/writing-assist";
import { useWritingAssist } from "../assistant/useWritingAssist";
import { editorSelectionTarget, sourceSelectionTarget, storyTarget } from "./assist-target";

/** The API's limit on one request. */
const AI_TEXT_MAX = 42_000;

/**
 * Runs an AI action on the selection (visual editor or Markdown box), else
 * the whole story, after checking there is something sensible to send.
 */
export function useStoryAssist(opts: {
  value: string;
  onChange: (markdown: string) => void;
  visual: boolean;
  editor: Editor | null;
  sourceBox: RefObject<HTMLTextAreaElement | null>;
  lastEmitted: MutableRefObject<string>;
  context: { title: string; subtitle: string };
}) {
  const assist = useWritingAssist(opts.context);
  const valueRef = useRef(opts.value);
  valueRef.current = opts.value;
  const current = () => valueRef.current;

  const setStory = (markdown: string) => {
    if (opts.visual && opts.editor) {
      opts.editor.chain().focus().setContent(markdownToDoc(markdown), { emitUpdate: true }).run();
    } else {
      opts.lastEmitted.current = "\u0000"; // The editor reloads when switched back.
      opts.onChange(markdown);
    }
  };

  function runAi(action: WritingAction) {
    if (action === "titles") {
      if (current().trim().split(/\s+/).length < 25) {
        showToast.error("Write a few sentences first, so the assistant has something to suggest a title from.");
        return;
      }
      assist.run("titles", { scope: "story", text: current().slice(0, AI_TEXT_MAX), replace: () => false });
      return;
    }
    const box = opts.sourceBox.current;
    const selection = opts.visual
      ? opts.editor && editorSelectionTarget(opts.editor)
      : box && sourceSelectionTarget(box, current, setStory);
    const target = selection ?? storyTarget(current, setStory);
    if (target.text.trim().length < 3) {
      showToast.error("Write something first, or select the words you want help with.");
      return;
    }
    if (target.text.length > AI_TEXT_MAX) {
      showToast.error("That is too long for the assistant in one go. Select a part of the story and try again.");
      return;
    }
    assist.run(action, target);
  }

  return { ...assist, runAi };
}
