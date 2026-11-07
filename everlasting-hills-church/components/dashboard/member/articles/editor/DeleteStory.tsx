"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";

/** "Delete this story", with a confirmation first. */
export function DeleteStory({ busy, deleting, onDelete }: { busy: boolean; deleting: boolean; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="mt-10 border-t m-rule pt-6">
        <button type="button" onClick={() => setConfirm(true)} disabled={busy} className="m-icon-btn text-sm">
          <Trash2 size={15} aria-hidden="true" /> Delete this story
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Delete this story?"
        description="It will be gone for good, with its likes and responses. Unpublishing keeps it as a draft instead."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
