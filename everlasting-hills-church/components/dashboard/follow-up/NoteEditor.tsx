"use client";

import { useState } from "react";

/** Editing one message in place: the box, Cancel and Save. */
export function NoteEditor({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (body: string) => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="mt-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            />
            <div className="mt-1.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-white/45 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!draft.trim() || busy}
                onClick={() => onSave(draft)}
                className="rounded-lg bg-[#87102C] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
  );
}
