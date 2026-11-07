"use client";

import { useEffect, useRef } from "react";
import { useEditor, useEditorState } from "@tiptap/react";
import { docToMarkdown, markdownToDoc } from "@/lib/article-markdown";
import { storyExtensions } from "./extensions";

export type BlockStyle = "p" | "h2" | "h3";

/**
 * The Tiptap editor for the story, kept in step with the Markdown `value`.
 * `lastEmitted` is the Markdown the editor last produced; when `value` differs
 * (a restored draft, an applied suggestion, the Markdown box) the editor
 * reloads it. Set it to anything else to force that reload.
 */
export function useStoryEditor(value: string, onChange: (markdown: string) => void, visual: boolean) {
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: storyExtensions(),
    content: markdownToDoc(value),
    editorProps: {
      attributes: { "aria-label": "Your story", "aria-multiline": "true", role: "textbox", class: "min-h-[360px] outline-none" },
    },
    onUpdate: ({ editor: e }) => {
      const markdown = docToMarkdown(e.getJSON());
      lastEmitted.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            code: e.isActive("code"),
            link: e.isActive("link"),
            block: (e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : "p") as BlockStyle,
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            hasSelection: !e.state.selection.empty,
          }
        : null,
  });

  useEffect(() => {
    if (!editor || !visual || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(markdownToDoc(value), { emitUpdate: false });
  }, [editor, value, visual]);

  return { editor, state, lastEmitted };
}

export type StoryEditorState = ReturnType<typeof useStoryEditor>["state"];
