"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { PROSE_CLASSES } from "./report-text-utils";

function ToolbarDivider() {
  return <span className="mx-1 h-4 w-px flex-shrink-0 bg-gray-200 dark:bg-white/10" />;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      // Prevent the toolbar button from stealing focus/selection from the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-[#87102C] text-white"
          : "text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10"
      } disabled:pointer-events-none disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] px-2 py-1.5">
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={14} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={14} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={14} />
      </ToolbarButton>
    </div>
  );
}

/** A real formatting toolbar (Tiptap/ProseMirror) instead of a plain textarea —
 * bold/italic/underline/strike, headings, lists, quotes, a divider, undo/redo.
 * Output is sanitized-by-construction: the schema only ever emits the elements
 * above, so there's no path for a user to inject arbitrary HTML/script tags. */
export default function ReportEditor({
  value,
  onChange,
  placeholder = "Write your report…",
  minHeight = 220,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2] } }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "text-[15px] leading-relaxed" },
    },
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 transition-all focus-within:border-[#87102C]/40 focus-within:ring-2 focus-within:ring-[#87102C]/20">
      {editor && <Toolbar editor={editor} />}
      <div style={{ minHeight }} className={`px-3.5 py-3 text-gray-900 dark:text-white ${PROSE_CLASSES}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
