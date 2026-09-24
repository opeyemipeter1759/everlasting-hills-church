"use client";

import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";

/** Deleting takes the message away for everyone, so it asks first. */
export function ConfirmDeleteMessage({
  note,
  loading,
  onConfirm,
  onCancel,
}: {
  note: FollowUpNote | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={!!note}
      tone="danger"
      title="Delete this message?"
      description={
        note && note.replies.length > 0
          ? `Its ${note.replies.length} ${note.replies.length === 1 ? "reply goes" : "replies go"} with it. This cannot be undone.`
          : "It will be removed from the thread for everyone. This cannot be undone."
      }
      confirmLabel="Delete"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
