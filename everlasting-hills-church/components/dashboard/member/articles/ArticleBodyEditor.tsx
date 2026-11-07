"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Extension, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  ChevronDown,
  Code,
  FileCode2,
  Heading2,
  HelpCircle,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Redo2,
  SpellCheck,
  Wand2,
  Undo2,
  X,
} from "lucide-react";
import { docToMarkdown, markdownToDoc, SAFE_HREF } from "@/lib/article-markdown";
import { showToast } from "@/components/ui/toast/toast";
import type { WritingAction } from "@/lib/api/articles";
import { AiMenu, AiPanel, useWritingAssist, type AssistTarget } from "./WritingAssistant";

/** The API's limit on one request. */
const AI_TEXT_MAX = 42_000;

type Mode = "visual" | "markdown";
type BlockStyle = "p" | "h2" | "h3";
const MODE_KEY = "ehc.article-editor-mode";

/** The reader has no nested lists, so Tab must not make one. */
const FlatLists = Extension.create({
  name: "flatLists",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.isActive("listItem"),
      "Shift-Tab": () => this.editor.isActive("listItem"),
    };
  },
});

function readMode(): Mode {
  try {
    return window.localStorage.getItem(MODE_KEY) === "markdown" ? "markdown" : "visual";
  } catch {
    return "visual";
  }
}

function normaliseHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (SAFE_HREF.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  return null;
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-current px-1 font-sans text-[10px] font-medium leading-4 opacity-80">{children}</kbd>
  );
}

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  tone = "light",
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  const colours =
    tone === "dark"
      ? active
        ? "bg-white/15 text-white"
        : "text-white/75 hover:bg-white/10 hover:text-white"
      : active
        ? "bg-[var(--m-brand-soft)] text-[var(--m-brand)]"
        : "text-[var(--m-gray)] hover:bg-[var(--m-brand-soft)] hover:text-[var(--m-ink)]";
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        aria-keyshortcuts={shortcut?.replace("⌘", "Meta").replace("Ctrl", "Control")}
        disabled={disabled}
        // Keep the selection in the editor when the button is pressed.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--m-brand)] disabled:pointer-events-none disabled:opacity-30 ${colours}`}
      >
        {children}
      </button>
      {tone === "light" && (
        <span
          role="presentation"
          className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--m-black)] px-2 py-1 font-sans text-[11px] font-medium text-[var(--m-on-black)] shadow-lg group-hover:flex"
        >
          {label}
          {shortcut && <Kbd>{shortcut}</Kbd>}
        </span>
      )}
    </span>
  );
}

function Separator({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span
      aria-hidden="true"
      className={`mx-1 h-5 w-px shrink-0 ${tone === "dark" ? "bg-white/20" : "bg-[var(--m-line)]"}`}
    />
  );
}

function Shortcuts({ mod, onClose }: { mod: string; onClose: () => void }) {
  const rows: [string, string, string][] = [
    ["Bold", `${mod}+B`, "**text**"],
    ["Italic", `${mod}+I`, "*text*"],
    ["Link", `${mod}+K`, "[text](https://…)"],
    ["Inline code", `${mod}+E`, "`text`"],
    ["Heading", `${mod}+Alt+2`, "## "],
    ["Subheading", `${mod}+Alt+3`, "#### "],
    ["Bulleted list", `${mod}+Shift+8`, "- "],
    ["Numbered list", `${mod}+Shift+7`, "1. "],
    ["Quote", `${mod}+Shift+B`, "> "],
    ["Divider line", "", "---"],
  ];
  return (
    <div className="m-paper mt-3 overflow-hidden rounded-xl border m-rule font-sans text-[13px]">
      <div className="flex items-center justify-between border-b m-rule px-4 py-2.5">
        <p className="m-ink font-semibold">Formatting help</p>
        <button type="button" onClick={onClose} aria-label="Close formatting help" className="m-muted rounded-md p-1 hover:text-[var(--m-ink)]">
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <p className="m-muted px-4 pt-3 text-[12px]">
        Use the toolbar, a keyboard shortcut, or type the Markdown at the start of a line: it turns into formatting as you type.
      </p>
      <table className="mt-2 w-full">
        <thead className="sr-only">
          <tr>
            <th>Format</th>
            <th>Shortcut</th>
            <th>Markdown</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, keys, md]) => (
            <tr key={name} className="border-t m-rule first:border-t-0">
              <td className="m-ink px-4 py-2">{name}</td>
              <td className="m-muted px-2 py-2">{keys && <Kbd>{keys}</Kbd>}</td>
              <td className="px-4 py-2 text-right">
                <code className="m-muted rounded bg-[var(--m-brand-soft)] px-1.5 py-0.5 font-mono text-[12px]">{md}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────

/**
 * The story box. Members write in a normal formatting editor (toolbar,
 * selection menu, shortcuts, and "## " or "- " turning into headings and
 * lists as they type), while the body is still saved as the Markdown every
 * reader renders. Anyone who prefers to type Markdown can switch to it; the
 * choice is remembered on the device.
 */
export default function ArticleBodyEditor({
  value,
  onChange,
  maxLength,
  status,
  context,
  onApplyTitle,
}: {
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
  const [mode, setMode] = useState<Mode>("visual");
  const [mod, setMod] = useState("Ctrl");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const sourceBox = useRef<HTMLTextAreaElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const assist = useWritingAssist(context);

  useEffect(() => {
    setMode(readMode());
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("⌘");
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => SAFE_HREF.test(url),
        },
      }),
      Placeholder.configure({ placeholder: "Tell your story…" }),
      FlatLists,
    ],
    content: markdownToDoc(value),
    editorProps: {
      attributes: {
        "aria-label": "Your story",
        "aria-multiline": "true",
        role: "textbox",
        class: "min-h-[360px] outline-none",
      },
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

  // The body changed from outside (a restored draft, an applied review
  // suggestion, or the Markdown box): show it in the editor.
  useEffect(() => {
    if (!editor || mode !== "visual" || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(markdownToDoc(value), { emitUpdate: false });
  }, [editor, value, mode]);

  // The Markdown box grows with the story.
  useEffect(() => {
    const el = sourceBox.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(360, el.scrollHeight)}px`;
  }, [value, mode]);

  useEffect(() => {
    if (linkOpen) linkInput.current?.focus();
  }, [linkOpen]);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setLinkOpen(false);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {
      // Not remembered; nothing else is lost.
    }
    requestAnimationFrame(() => (next === "visual" ? editor?.commands.focus() : sourceBox.current?.focus()));
  }

  function openLink() {
    if (!editor) return;
    setLinkValue((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkError(false);
    setLinkOpen(true);
  }

  function closeLink() {
    setLinkOpen(false);
    editor?.commands.focus();
  }

  function applyLink(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    if (!linkValue.trim()) return removeLink();
    const href = normaliseHref(linkValue);
    if (!href) return setLinkError(true);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: the address itself becomes the link text.
      chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    setLinkOpen(false);
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }

  function setBlock(style: BlockStyle) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (style === "p") chain.setParagraph().run();
    else chain.setHeading({ level: style === "h2" ? 2 : 3 }).run();
  }

  /**
   * What an AI action works on: the selection when there is one, else the
   * whole story. Each target knows how to put the answer back, and refuses
   * (returns false) if that text was edited while the AI was thinking.
   */
  function buildTarget(): AssistTarget {
    const story: AssistTarget = {
      scope: "story",
      text: valueRef.current,
      replace: (markdown) => {
        if (valueRef.current !== story.text) return false;
        if (mode === "visual" && editor) {
          // Through the editor, so Ctrl+Z brings the original back.
          editor.chain().focus().setContent(markdownToDoc(markdown), { emitUpdate: true }).run();
        } else {
          lastEmitted.current = "\u0000";
          onChange(markdown);
        }
        return true;
      },
    };

    if (mode === "markdown") {
      const box = sourceBox.current;
      const start = box?.selectionStart ?? 0;
      const end = box?.selectionEnd ?? 0;
      if (!box || start === end) return story;
      const text = valueRef.current.slice(start, end);
      const intact = () => valueRef.current.slice(start, end) === text;
      const splice = (at: number, until: number, insert: string) => {
        lastEmitted.current = "\u0000";
        onChange(valueRef.current.slice(0, at) + insert + valueRef.current.slice(until));
      };
      return {
        scope: "selection",
        text,
        replace: (markdown) => {
          if (!intact()) return false;
          splice(start, end, markdown);
          return true;
        },
        insertAfter: (markdown) => {
          if (!intact()) return false;
          splice(end, end, `\n\n${markdown}`);
          return true;
        },
      };
    }

    if (!editor || editor.state.selection.empty) return story;
    const { from, to, $from, $to } = editor.state.selection;
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

  function runAi(action: WritingAction) {
    if (action === "titles") {
      const text = valueRef.current;
      if (text.trim().split(/\s+/).length < 25) {
        showToast.error("Write a few sentences first, so the assistant has something to suggest a title from.");
        return;
      }
      assist.run("titles", { scope: "story", text: text.slice(0, AI_TEXT_MAX), replace: () => false });
      return;
    }
    const target = buildTarget();
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

  const visual = mode === "visual";
  const run = (fn: (e: Editor) => void) => () => editor && fn(editor);

  return (
    <div
      className="mt-8"
      onKeyDown={(e) => {
        if (visual && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          openLink();
        }
      }}
    >
      {/* Toolbar: stays in reach under the dashboard's top bar on long stories. */}
      <div className="sticky top-[4.5rem] z-20">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="m-paper flex flex-wrap items-center gap-0.5 rounded-xl border m-rule p-1.5 font-sans shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-6px_rgba(0,0,0,0.12)]"
        >
          {visual ? (
            <>
              <div className="relative">
                <label htmlFor="article-block-style" className="sr-only">
                  Text style
                </label>
                <select
                  id="article-block-style"
                  value={state?.block ?? "p"}
                  disabled={!editor}
                  onChange={(e) => setBlock(e.target.value as BlockStyle)}
                  className="m-ink h-8 cursor-pointer appearance-none rounded-md bg-transparent pl-2.5 pr-7 text-[13px] font-medium outline-none hover:bg-[var(--m-brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--m-brand)]"
                >
                  <option value="p">Paragraph</option>
                  <option value="h2">Heading</option>
                  <option value="h3">Subheading</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" className="m-muted pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
              <Separator />
              <ToolButton label="Bold" shortcut={`${mod}+B`} active={state?.bold} disabled={!editor} onClick={run((e) => e.chain().focus().toggleBold().run())}>
                <Bold size={16} strokeWidth={2.25} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Italic" shortcut={`${mod}+I`} active={state?.italic} disabled={!editor} onClick={run((e) => e.chain().focus().toggleItalic().run())}>
                <Italic size={16} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Link" shortcut={`${mod}+K`} active={state?.link || linkOpen} disabled={!editor} onClick={openLink}>
                <Link2 size={16} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Inline code" shortcut={`${mod}+E`} active={state?.code} disabled={!editor} onClick={run((e) => e.chain().focus().toggleCode().run())}>
                <Code size={16} aria-hidden="true" />
              </ToolButton>
              <Separator />
              <ToolButton label="Bulleted list" active={state?.bullet} disabled={!editor} onClick={run((e) => e.chain().focus().toggleBulletList().run())}>
                <List size={16} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Numbered list" active={state?.ordered} disabled={!editor} onClick={run((e) => e.chain().focus().toggleOrderedList().run())}>
                <ListOrdered size={16} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Quote" active={state?.quote} disabled={!editor} onClick={run((e) => e.chain().focus().toggleBlockquote().run())}>
                <Quote size={16} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Divider line" disabled={!editor} onClick={run((e) => e.chain().focus().setHorizontalRule().run())}>
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
          ) : (
            <p className="m-muted flex items-center gap-2 px-2 text-[13px]">
              <FileCode2 size={15} aria-hidden="true" /> Editing the Markdown directly
            </p>
          )}

          <div className="ml-auto flex items-center gap-2 pl-1">
            <AiMenu scope={visual && state?.hasSelection ? "selection" : "story"} disabled={visual && !editor} onPick={runAi} />
          <div
            role="group"
            aria-label="Editor mode"
            className="flex items-center gap-0.5 rounded-lg bg-[var(--m-brand-soft)] p-0.5 text-[12px] font-medium"
          >
            {(
              [
                ["visual", "Write", PenLine],
                ["markdown", "Markdown", FileCode2],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => switchMode(m)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
                  mode === m
                    ? "m-paper m-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "m-muted hover:text-[var(--m-ink)]"
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          </div>
        </div>

        {visual && linkOpen && (
          <form
            onSubmit={applyLink}
            className="m-paper absolute left-0 right-0 top-full mt-2 rounded-xl border m-rule p-3 font-sans shadow-[0_8px_30px_-8px_rgba(0,0,0,0.25)] sm:left-auto sm:w-[420px]"
          >
            <div className="flex items-center gap-2">
              <Link2 size={16} aria-hidden="true" className="m-muted shrink-0" />
              <label htmlFor="article-link" className="sr-only">
                Link address
              </label>
              <input
                id="article-link"
                ref={linkInput}
                value={linkValue}
                onChange={(e) => {
                  setLinkValue(e.target.value);
                  setLinkError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeLink();
                  }
                }}
                placeholder="Paste a link, e.g. https://…"
                aria-invalid={linkError}
                aria-describedby={linkError ? "article-link-error" : undefined}
                className="m-ink min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-[var(--m-gray)]"
              />
              <button type="submit" className="m-pill !min-h-8 !px-3.5 text-[13px]">
                {state?.link ? "Update" : "Add link"}
              </button>
            </div>
            {linkError && (
              <p id="article-link-error" role="alert" className="mt-2 text-[12px] text-[var(--m-brand)]">
                Use a web address (https://…), an email address, or a page on this site (/…).
              </p>
            )}
            <div className="mt-2 flex items-center justify-between border-t m-rule pt-2 text-[12px]">
              <span className="m-muted">
                <Kbd>Enter</Kbd> to apply · <Kbd>Esc</Kbd> to cancel
              </span>
              {state?.link && (
                <button type="button" onClick={removeLink} className="m-muted hover:text-[var(--m-brand)]">
                  Remove link
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Selection menu, as on Medium: format without reaching for the toolbar. */}
      {editor && visual && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e, state: s }) => !s.selection.empty && !e.isActive("code") && e.isEditable && !linkOpen}
          className="flex items-center gap-0.5 rounded-lg bg-[var(--m-black)] p-1 font-sans shadow-xl"
        >
          <ToolButton tone="dark" label="Bold" active={state?.bold} onClick={run((e) => e.chain().focus().toggleBold().run())}>
            <Bold size={15} strokeWidth={2.25} aria-hidden="true" />
          </ToolButton>
          <ToolButton tone="dark" label="Italic" active={state?.italic} onClick={run((e) => e.chain().focus().toggleItalic().run())}>
            <Italic size={15} aria-hidden="true" />
          </ToolButton>
          <ToolButton tone="dark" label="Link" active={state?.link} onClick={openLink}>
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
          <ToolButton tone="dark" label="Fix spelling & grammar" onClick={() => runAi("fix")}>
            <SpellCheck size={15} aria-hidden="true" />
          </ToolButton>
          <ToolButton tone="dark" label="Improve writing" onClick={() => runAi("improve")}>
            <Wand2 size={15} aria-hidden="true" />
          </ToolButton>
        </BubbleMenu>
      )}

      {visual ? (
        <EditorContent editor={editor} className="m-article m-editor mt-8" />
      ) : (
        <div className="m-paper mt-6 rounded-xl border m-rule">
          <label htmlFor="article-body" className="sr-only">
            Your story
          </label>
          <textarea
            id="article-body"
            ref={sourceBox}
            value={value}
            onChange={(e) => {
              lastEmitted.current = "\u0000"; // Re-sync the editor when switching back.
              onChange(e.target.value);
            }}
            placeholder={"Tell your story…\n\n## A heading\n\nSome **bold** and *italic* words.\n\n- A list item"}
            maxLength={maxLength}
            spellCheck
            className="block w-full resize-none overflow-hidden rounded-xl border-0 bg-transparent px-5 py-4 font-mono text-[14px] leading-7 text-[var(--m-ink)] outline-none placeholder:text-[var(--m-gray)] placeholder:opacity-60 focus:ring-0"
          />
        </div>
      )}

      {/* Status bar */}
      <div className="m-muted mt-6 flex flex-wrap items-center justify-between gap-3 border-t m-rule pt-3 font-sans text-[12px]">
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          aria-expanded={helpOpen}
          className="inline-flex items-center gap-1.5 rounded-md py-1 hover:text-[var(--m-ink)]"
        >
          <HelpCircle size={14} aria-hidden="true" /> Formatting help
        </button>
        {status}
      </div>
      {helpOpen && <Shortcuts mod={mod} onClose={() => setHelpOpen(false)} />}

      <AiPanel
        job={assist.job}
        onClose={assist.close}
        onRetry={() => assist.job && assist.run(assist.job.action, assist.job.target)}
        onApplyTitle={onApplyTitle}
      />
    </div>
  );
}
