"use client";

import { useRef } from "react";
import { EditorContent } from "@tiptap/react";
import { FileCode2 } from "lucide-react";
import { AiMenu } from "./assistant/AiMenu";
import { AiPanel } from "./assistant/AiPanel";
import { FormattingButtons } from "./story-editor/FormattingButtons";
import { LinkForm } from "./story-editor/LinkForm";
import { MarkdownSource } from "./story-editor/MarkdownSource";
import { ModeSwitch } from "./story-editor/ModeSwitch";
import { SelectionMenu } from "./story-editor/SelectionMenu";
import { StatusBar } from "./story-editor/StatusBar";
import { useEditorMode, useModKey, type Mode } from "./story-editor/mode";
import { useLinkEditor } from "./story-editor/useLinkEditor";
import { useStoryAssist } from "./story-editor/useStoryAssist";
import { useStoryEditor } from "./story-editor/useStoryEditor";
import "./story-editor/story-editor.css";

/**
 * The story box: a formatting editor (toolbar, selection menu, shortcuts,
 * Markdown typed at line starts) with an AI assistant, saved as the Markdown
 * every reader renders. Members who prefer can edit the Markdown directly.
 */
export default function ArticleBodyEditor({ value, onChange, maxLength, status, context, onApplyTitle }: {
  value: string;
  onChange: (markdown: string) => void;
  maxLength: number;
  /** Shown at the right of the status bar, e.g. the word count. */
  status?: React.ReactNode;
  /** The story's title and subtitle, which the AI reads for context. */
  context: { title: string; subtitle: string };
  /** Called when a member picks one of the AI's title suggestions. */
  onApplyTitle: (title: string, subtitle: string) => void;
}) {
  const [mode, setMode] = useEditorMode();
  const mod = useModKey();
  const visual = mode === "visual";
  const sourceBox = useRef<HTMLTextAreaElement>(null);
  const { editor, state, lastEmitted } = useStoryEditor(value, onChange, visual);
  const link = useLinkEditor(editor);
  const assist = useStoryAssist({ value, onChange, visual, editor, sourceBox, lastEmitted, context });

  const switchMode = (next: Mode) => {
    setMode(next);
    link.setOpen(false);
    requestAnimationFrame(() => (next === "visual" ? editor?.commands.focus() : sourceBox.current?.focus()));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (visual && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      link.show();
    }
  };

  return (
    <div className="mt-8" onKeyDown={onKeyDown}>
      {/* Toolbar: stays in reach under the dashboard's top bar on long stories. */}
      <div className="sticky top-[4.5rem] z-20">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="m-paper flex flex-wrap items-center gap-0.5 rounded-xl border m-rule p-1.5 font-sans shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-6px_rgba(0,0,0,0.12)]"
        >
          {visual ? (
            <FormattingButtons editor={editor} state={state} mod={mod} linkOpen={link.open} onLink={link.show} />
          ) : (
            <p className="m-muted flex items-center gap-2 px-2 text-[13px]">
              <FileCode2 size={15} aria-hidden="true" /> Editing the Markdown directly
            </p>
          )}
          <div className="ml-auto flex items-center gap-2 pl-1">
            <AiMenu scope={visual && state?.hasSelection ? "selection" : "story"} disabled={visual && !editor} onPick={assist.runAi} />
            <ModeSwitch mode={mode} onChange={switchMode} />
          </div>
        </div>
        {visual && link.open && <LinkForm link={link} onLink={Boolean(state?.link)} />}
      </div>

      {editor && visual && <SelectionMenu editor={editor} state={state} hidden={link.open} onLink={link.show} onAi={assist.runAi} />}

      {visual ? (
        <EditorContent editor={editor} className="m-article m-editor mt-8" />
      ) : (
        <MarkdownSource
          ref={sourceBox}
          value={value}
          maxLength={maxLength}
          onChange={(next) => {
            lastEmitted.current = "\u0000"; // Re-sync the editor when switching back.
            onChange(next);
          }}
        />
      )}

      <StatusBar mod={mod} status={status} />
      <AiPanel job={assist.job} onClose={assist.close} onRetry={() => assist.job && assist.run(assist.job.action, assist.job.target)} onApplyTitle={onApplyTitle} />
    </div>
  );
}
