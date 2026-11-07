"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Shortcuts } from "./Shortcuts";

/** "Formatting help" on the left, the caller's status (word count) on the right. */
export function StatusBar({ mod, status }: { mod: string; status?: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
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
    </>
  );
}
