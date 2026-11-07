import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Heading2, Italic, Link2, Quote, SpellCheck, Wand2 } from "lucide-react";
import type { WritingAction } from "@/lib/api/writing-assist";
import { Separator, ToolButton } from "./ToolButton";
import type { StoryEditorState } from "./useStoryEditor";

/** The dark menu over selected text, as on Medium: format or ask the AI without the toolbar. */
export function SelectionMenu({
  editor,
  state,
  hidden,
  onLink,
  onAi,
}: {
  editor: Editor;
  state: StoryEditorState;
  /** While the link box is open, the menu stays out of the way. */
  hidden: boolean;
  onLink: () => void;
  onAi: (action: WritingAction) => void;
}) {
  const run = (fn: (e: Editor) => void) => () => fn(editor);
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state: s }) => !s.selection.empty && !e.isActive("code") && e.isEditable && !hidden}
      className="flex items-center gap-0.5 rounded-lg bg-[var(--m-black)] p-1 font-sans shadow-xl"
    >
      <ToolButton tone="dark" label="Bold" active={state?.bold} onClick={run((e) => e.chain().focus().toggleBold().run())}>
        <Bold size={15} strokeWidth={2.25} aria-hidden="true" />
      </ToolButton>
      <ToolButton tone="dark" label="Italic" active={state?.italic} onClick={run((e) => e.chain().focus().toggleItalic().run())}>
        <Italic size={15} aria-hidden="true" />
      </ToolButton>
      <ToolButton tone="dark" label="Link" active={state?.link} onClick={onLink}>
        <Link2 size={15} aria-hidden="true" />
      </ToolButton>
      <Separator tone="dark" />
      <ToolButton tone="dark" label="Heading" active={state?.block === "h2"} onClick={run((e) => e.chain().focus().toggleHeading({ level: 2 }).run())}>
        <Heading2 size={15} aria-hidden="true" />
      </ToolButton>
      <ToolButton tone="dark" label="Quote" active={state?.quote} onClick={run((e) => e.chain().focus().toggleBlockquote().run())}>
        <Quote size={15} aria-hidden="true" />
      </ToolButton>
      <Separator tone="dark" />
      <ToolButton tone="dark" label="Fix spelling & grammar" onClick={() => onAi("fix")}>
        <SpellCheck size={15} aria-hidden="true" />
      </ToolButton>
      <ToolButton tone="dark" label="Improve writing" onClick={() => onAi("improve")}>
        <Wand2 size={15} aria-hidden="true" />
      </ToolButton>
    </BubbleMenu>
  );
}
