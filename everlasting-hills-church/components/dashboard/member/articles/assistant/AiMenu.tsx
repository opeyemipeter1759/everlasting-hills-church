"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown, Sparkles, Type, type LucideIcon } from "lucide-react";
import type { WritingAction } from "@/lib/api/writing-assist";
import { AI_ACTIONS } from "./actions";
import { useDismiss } from "./useDismiss";

function MenuItem({ label, hint, Icon, onPick }: { label: string; hint: string; Icon: LucideIcon; onPick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      // Keep the editor's selection: the actions work on it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="flex w-full items-start gap-3 px-3.5 py-2 text-left transition-colors hover:bg-[var(--m-brand-soft)]"
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--m-brand)]" />
      <span className="min-w-0">
        <span className="m-ink block text-[13px] font-medium">{label}</span>
        <span className="m-muted block text-[12px]">{hint}</span>
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="m-muted px-3.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider">{children}</p>;
}

/** The toolbar's AI button and its list of actions. */
export function AiMenu({
  scope,
  disabled,
  onPick,
}: {
  /** What the actions will work on right now. */
  scope: "selection" | "story";
  disabled?: boolean;
  onPick: (action: WritingAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useDismiss(open, root, dismiss);

  const pick = (action: WritingAction) => {
    setOpen(false);
    onPick(action);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--m-brand)] to-[#b4234a] px-2.5 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Sparkles size={14} aria-hidden="true" />
        AI assist
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="AI writing assistant"
          className="m-paper absolute right-0 top-full z-40 mt-2 w-[290px] overflow-hidden rounded-xl border m-rule py-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] max-sm:fixed max-sm:inset-x-3 max-sm:top-auto max-sm:w-auto"
        >
          <SectionLabel>{scope === "selection" ? "Edit the selected text" : "Edit the whole story"}</SectionLabel>
          {AI_ACTIONS.map(({ action, label, hint, Icon }) => (
            <MenuItem key={action} label={label} hint={hint} Icon={Icon} onPick={() => pick(action)} />
          ))}
          <div className="my-1.5 border-t m-rule" />
          <SectionLabel>Your story</SectionLabel>
          <MenuItem label="Suggest a title" hint="Three title and subtitle ideas" Icon={Type} onPick={() => pick("titles")} />
          <p className="m-muted border-t m-rule px-3.5 pb-1 pt-2 text-[11px]">AI can make mistakes. Read each suggestion before you use it.</p>
        </div>
      )}
    </div>
  );
}
