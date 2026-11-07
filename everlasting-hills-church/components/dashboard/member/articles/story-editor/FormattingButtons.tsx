import type { Editor } from "@tiptap/react";
import { Bold, ChevronDown, Code, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Undo2 } from "lucide-react";
import { Separator, ToolButton } from "./ToolButton";
import type { BlockStyle, StoryEditorState } from "./useStoryEditor";

function BlockStyleSelect({ editor, value }: { editor: Editor | null; value: BlockStyle }) {
  const set = (style: BlockStyle) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (style === "p") chain.setParagraph().run();
    else chain.setHeading({ level: style === "h2" ? 2 : 3 }).run();
  };
  return (
    <div className="relative">
      <label htmlFor="article-block-style" className="sr-only">
        Text style
      </label>
      <select
        id="article-block-style"
        value={value}
        disabled={!editor}
        onChange={(e) => set(e.target.value as BlockStyle)}
        className="m-ink h-8 cursor-pointer appearance-none rounded-md bg-transparent pl-2.5 pr-7 text-[13px] font-medium outline-none hover:bg-[var(--m-brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--m-brand)]"
      >
        <option value="p">Paragraph</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
      </select>
      <ChevronDown size={14} aria-hidden="true" className="m-muted pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
    </div>
  );
}

/** The visual editor's side of the toolbar. */
export function FormattingButtons({
  editor,
  state,
  mod,
  linkOpen,
  onLink,
}: {
  editor: Editor | null;
  state: StoryEditorState;
  mod: string;
  linkOpen: boolean;
  onLink: () => void;
}) {
  const run = (fn: (e: Editor) => void) => () => editor && fn(editor);
  const off = !editor;
  return (
    <>
      <BlockStyleSelect editor={editor} value={state?.block ?? "p"} />
      <Separator />
      <ToolButton label="Bold" shortcut={`${mod}+B`} active={state?.bold} disabled={off} onClick={run((e) => e.chain().focus().toggleBold().run())}>
        <Bold size={16} strokeWidth={2.25} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Italic" shortcut={`${mod}+I`} active={state?.italic} disabled={off} onClick={run((e) => e.chain().focus().toggleItalic().run())}>
        <Italic size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Link" shortcut={`${mod}+K`} active={state?.link || linkOpen} disabled={off} onClick={onLink}>
        <Link2 size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Inline code" shortcut={`${mod}+E`} active={state?.code} disabled={off} onClick={run((e) => e.chain().focus().toggleCode().run())}>
        <Code size={16} aria-hidden="true" />
      </ToolButton>
      <Separator />
      <ToolButton label="Bulleted list" active={state?.bullet} disabled={off} onClick={run((e) => e.chain().focus().toggleBulletList().run())}>
        <List size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Numbered list" active={state?.ordered} disabled={off} onClick={run((e) => e.chain().focus().toggleOrderedList().run())}>
        <ListOrdered size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Quote" active={state?.quote} disabled={off} onClick={run((e) => e.chain().focus().toggleBlockquote().run())}>
        <Quote size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Divider line" disabled={off} onClick={run((e) => e.chain().focus().setHorizontalRule().run())}>
        <Minus size={16} aria-hidden="true" />
      </ToolButton>
      <Separator />
      <ToolButton label="Undo" shortcut={`${mod}+Z`} disabled={!state?.canUndo} onClick={run((e) => e.chain().focus().undo().run())}>
        <Undo2 size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Redo" shortcut={`${mod}+Shift+Z`} disabled={!state?.canRedo} onClick={run((e) => e.chain().focus().redo().run())}>
        <Redo2 size={16} aria-hidden="true" />
      </ToolButton>
    </>
  );
}
