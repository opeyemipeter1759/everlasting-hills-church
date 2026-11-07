import type { Article } from "@/lib/api/articles";
import ReviewNotes, { applySuggestion } from "../ReviewNotes";
import { DeleteStory } from "./DeleteStory";

/** Under the story: a save error, the reviewers' notes, and deleting the story. */
export function EditorFooter({ existing, body, error, busy, deleting, onBody, onDelete }: {
  existing: Article | undefined;
  body: string;
  error: string | null;
  busy: boolean;
  deleting: boolean;
  onBody: (body: string) => void;
  onDelete: () => void;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="m-paper m-ink mt-6 border-l-2 border-[var(--m-ink)] px-4 py-3 text-sm">
          {error}
        </p>
      )}
      {existing && (
        <ReviewNotes
          articleId={existing.id}
          enabled
          onApply={(note) => {
            const next = note.quote && note.suggestion != null ? applySuggestion(body, note.quote, note.suggestion) : null;
            if (next == null) return false;
            onBody(next);
            return true;
          }}
        />
      )}
      {existing && <DeleteStory busy={busy} deleting={deleting} onDelete={onDelete} />}
    </>
  );
}
