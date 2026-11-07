import { FileCode2, PenLine } from "lucide-react";
import type { Mode } from "./mode";

const MODES = [
  ["visual", "Write", PenLine],
  ["markdown", "Markdown", FileCode2],
] as const;

/** Write (formatted) or Markdown (source) for the story box. */
export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div role="group" aria-label="Editor mode" className="flex items-center gap-0.5 rounded-lg bg-[var(--m-brand-soft)] p-0.5 text-[12px] font-medium">
      {MODES.map(([m, label, Icon]) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => mode !== m && onChange(m)}
          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
            mode === m ? "m-paper m-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "m-muted hover:text-[var(--m-ink)]"
          }`}
        >
          <Icon size={13} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
