import { Check, RotateCcw } from "lucide-react";

const QUIET =
  "m-muted inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium hover:bg-[var(--m-brand-soft)] hover:text-[var(--m-ink)]";

/** Replace / Insert below / Try again / Discard, or just Cancel while loading. */
export function PanelFooter({
  loading,
  canApply,
  wholeStory,
  canInsert,
  finished,
  onReplace,
  onInsert,
  onRetry,
  onClose,
}: {
  loading: boolean;
  canApply: boolean;
  wholeStory: boolean;
  canInsert: boolean;
  /** Nothing left to decide (titles shown, or no changes): "Done" rather than "Discard". */
  finished: boolean;
  onReplace: () => void;
  onInsert: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (loading) {
    return (
      <footer className="flex justify-end border-t m-rule px-4 py-3">
        <button type="button" onClick={onClose} className={QUIET}>
          Cancel
        </button>
      </footer>
    );
  }
  return (
    <footer className="flex flex-wrap items-center gap-2 border-t m-rule px-4 py-3">
      {canApply && (
        <button
          type="button"
          onClick={onReplace}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--m-brand)] px-4 text-[13px] font-semibold text-[var(--m-on-brand)] hover:bg-[var(--m-brand-hover)]"
        >
          <Check size={14} aria-hidden="true" /> {wholeStory ? "Replace story" : "Replace"}
        </button>
      )}
      {canApply && canInsert && (
        <button type="button" onClick={onInsert} className="m-ink inline-flex h-9 items-center rounded-full border m-rule px-3.5 text-[13px] font-medium hover:border-[var(--m-ink)]">
          Insert below
        </button>
      )}
      <button type="button" onClick={onRetry} className={QUIET}>
        <RotateCcw size={14} aria-hidden="true" /> Try again
      </button>
      <button type="button" onClick={onClose} className={`${QUIET} ml-auto`}>
        {finished ? "Done" : "Discard"}
      </button>
    </footer>
  );
}
