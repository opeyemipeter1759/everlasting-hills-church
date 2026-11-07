import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ArticleStatus } from "@/lib/api/articles";

/** Back link and status on the left; preview and the save/submit actions on the right. */
export function EditorHeader({ status, savedOnDevice, preview, busy, saving, onTogglePreview, onSave, onUnpublish }: {
  status: ArticleStatus | undefined;
  savedOnDevice: boolean;
  preview: boolean;
  busy: boolean;
  saving: boolean;
  onTogglePreview: () => void;
  onSave: (publish: boolean) => void;
  onUnpublish: () => void;
}) {
  const isPublished = status === "PUBLISHED";
  const isPending = status === "PENDING_REVIEW";
  const statusLine = isPending ? "Waiting for approval" : isPublished ? "Published" : "Draft";

  return (
    <header className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3 border-b m-rule pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard/articles/mine" className="m-muted inline-flex min-h-11 items-center gap-1.5 text-sm hover:text-[var(--m-ink)]">
          <ArrowLeft size={15} aria-hidden="true" /> Your stories
        </Link>
        <span className="m-muted truncate text-sm" aria-live="polite">
          {statusLine}
          {savedOnDevice ? " · Saved on this device" : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onTogglePreview} className="m-icon-btn px-2 text-sm">
          {preview ? "Edit" : "Preview"}
        </button>
        {!isPublished && (
          <button type="button" onClick={() => onSave(false)} disabled={busy} className="m-pill-outline !min-h-9 !px-4">
            {isPending ? "Withdraw to draft" : "Save draft"}
          </button>
        )}
        {isPublished && (
          <button type="button" onClick={onUnpublish} disabled={busy} className="m-pill-outline !min-h-9 !px-4">
            Unpublish
          </button>
        )}
        <button type="button" onClick={() => onSave(true)} disabled={busy} className="m-pill !min-h-9 !px-4">
          {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {isPending ? "Update submission" : isPublished ? "Submit changes" : "Submit for review"}
        </button>
      </div>
    </header>
  );
}
