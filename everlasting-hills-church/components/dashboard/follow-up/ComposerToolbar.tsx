"use client";

import { AtSign, Bold, Code, Italic, Link2, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Wrap =
  | { kind: "wrap"; before: string; after: string }
  | { kind: "prefix"; prefix: string }
  | { kind: "insert"; text: string };

const TOOLS: { icon: LucideIcon; label: string; action: Wrap }[] = [
  { icon: Bold, label: "Bold", action: { kind: "wrap", before: "*", after: "*" } },
  { icon: Italic, label: "Italic", action: { kind: "wrap", before: "_", after: "_" } },
  { icon: Strikethrough, label: "Strikethrough", action: { kind: "wrap", before: "~", after: "~" } },
  { icon: Link2, label: "Link", action: { kind: "insert", text: "https://" } },
  { icon: ListOrdered, label: "Numbered list", action: { kind: "prefix", prefix: "1. " } },
  { icon: List, label: "Bulleted list", action: { kind: "prefix", prefix: "- " } },
  { icon: Quote, label: "Quote", action: { kind: "prefix", prefix: "> " } },
  { icon: Code, label: "Code", action: { kind: "wrap", before: "`", after: "`" } },
];

const BUTTON =
  "flex h-7 w-7 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white";

/**
 * The formatting row above the box. Each button works on whatever is selected,
 * the way any editor does — nothing here stores HTML; it writes the same small
 * marks the message renderer understands.
 */
export function ComposerToolbar({ onApply, onMention }: { onApply: (action: Wrap) => void; onMention: () => void }) {
  return (
    <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 py-1.5 dark:border-white/[0.07]">
      {TOOLS.slice(0, 3).map((tool) => (
        <ToolButton key={tool.label} {...tool} onApply={onApply} />
      ))}
      <Divider />
      {TOOLS.slice(3, 7).map((tool) => (
        <ToolButton key={tool.label} {...tool} onApply={onApply} />
      ))}
      <Divider />
      <ToolButton {...TOOLS[7]} onApply={onApply} />
      <Divider />
      <button type="button" onClick={onMention} aria-label="Mention someone" title="Mention someone" className={BUTTON}>
        <AtSign size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  action,
  onApply,
}: {
  icon: LucideIcon;
  label: string;
  action: Wrap;
  onApply: (action: Wrap) => void;
}) {
  return (
    <button type="button" onClick={() => onApply(action)} aria-label={label} title={label} className={BUTTON}>
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px bg-gray-200 dark:bg-white/10" />;
}
