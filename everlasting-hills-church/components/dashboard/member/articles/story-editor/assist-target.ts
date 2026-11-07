import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { docToMarkdown, markdownToDoc } from "@/lib/article-markdown";
import type { AssistTarget } from "../assistant/actions";

/**
 * What an AI action works on, and how its answer goes back. Each target
 * refuses (returns false) when its text was edited while the AI was thinking.
 */

/** The whole story. `setStory` replaces it (through the editor when visual, so Ctrl+Z works). */
export function storyTarget(current: () => string, setStory: (markdown: string) => void): AssistTarget {
  const text = current();
  return {
    scope: "story",
    text,
    replace: (markdown) => {
      if (current() !== text) return false;
      setStory(markdown);
      return true;
    },
  };
}

/** The selected characters of the Markdown box. */
export function sourceSelectionTarget(
  box: HTMLTextAreaElement,
  current: () => string,
  setStory: (markdown: string) => void,
): AssistTarget | null {
  const { selectionStart: start, selectionEnd: end } = box;
  if (start === end) return null;
  const text = current().slice(start, end);
  const splice = (at: number, until: number, insert: string) => {
    if (current().slice(start, end) !== text) return false;
    setStory(current().slice(0, at) + insert + current().slice(until));
    return true;
  };
  return {
    scope: "selection",
    text,
    replace: (markdown) => splice(start, end, markdown),
    insertAfter: (markdown) => splice(end, end, `\n\n${markdown}`),
  };
}

/** The selection in the visual editor, sent as Markdown so formatting survives. */
export function editorSelectionTarget(editor: Editor): AssistTarget | null {
  const { from, to, empty, $from, $to } = editor.state.selection;
  if (empty) return null;
  const inline = $from.sameParent($to) && $from.parent.isTextblock;
  const slice = editor.state.doc.slice(from, to).content.toJSON() as JSONContent[];
  const text = docToMarkdown({ type: "doc", content: inline ? [{ type: "paragraph", content: slice }] : slice });
  const original = editor.state.doc.textBetween(from, to, "\n");
  const intact = () => to <= editor.state.doc.content.size && editor.state.doc.textBetween(from, to, "\n") === original;
  return {
    scope: "selection",
    text,
    replace: (markdown) => {
      if (!intact()) return false;
      const doc = markdownToDoc(markdown).content ?? [];
      // Inside one paragraph, put the words back inline instead of splitting it.
      const content = inline && doc.length === 1 && doc[0].type === "paragraph" ? doc[0].content ?? [] : doc;
      editor.chain().focus().insertContentAt({ from, to }, content).run();
      return true;
    },
    insertAfter: (markdown) => {
      if (!intact()) return false;
      const $end = editor.state.doc.resolve(to);
      const after = $end.depth > 0 ? $end.after(1) : to;
      editor.chain().focus().insertContentAt(after, markdownToDoc(markdown).content ?? []).run();
      return true;
    },
  };
}
