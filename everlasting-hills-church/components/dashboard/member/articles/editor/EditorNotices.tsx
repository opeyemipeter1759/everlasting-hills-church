import type { ArticleStatus } from "@/lib/api/articles";
import type { LocalDraft } from "./article-form";

const PUBLISHING_NOTE: Record<"pending" | "published" | "draft", string> = {
  pending: "Waiting for the head of comms or an admin. You can update it, or withdraw it to a draft.",
  published:
    "Submitting changes takes this story off the site until they are approved: it moves to Waiting for approval in Your stories, and someone other than you (the head of comms, a pastor or an admin) approves it.",
  draft: "When you submit, the head of comms or an admin reads it first. Once approved it appears to the church and on the public blog.",
};

/** Words left on this device, how publishing works, and any changes a reviewer asked for. */
export function EditorNotices({ restorable, status, reviewNote, onRestore, onDiscard }: {
  restorable: LocalDraft | null;
  status: ArticleStatus | undefined;
  reviewNote: string | null | undefined;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const savedAt = restorable && new Date(restorable.savedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const note = status === "PENDING_REVIEW" ? "pending" : status === "PUBLISHED" ? "published" : "draft";
  return (
    <>
      {restorable && (
        <div role="status" className="m-paper m-ink mb-6 flex flex-wrap items-center justify-between gap-3 border m-rule px-4 py-3 text-sm">
          <span>You have unsaved words from {savedAt} on this device.</span>
          <span className="flex gap-2">
            <button type="button" className="m-pill !min-h-9 !px-4" onClick={onRestore}>
              Restore
            </button>
            <button type="button" className="m-pill-outline !min-h-9 !px-4" onClick={onDiscard}>
              Discard
            </button>
          </span>
        </div>
      )}
      <p className="m-muted mb-6 text-[13px]">{PUBLISHING_NOTE[note]}</p>
      {status === "DRAFT" && reviewNote && (
        <p className="m-paper m-ink mb-6 border-l-2 border-[var(--m-ink)] px-4 py-3 text-sm">
          <strong>Changes requested:</strong> {reviewNote}
        </p>
      )}
    </>
  );
}
