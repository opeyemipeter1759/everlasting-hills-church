import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { Announcement } from "./types";

export default function AnnouncementDialogs({
  deleteTarget,
  onCloseDelete,
  onConfirmDelete,
  deleting,
  publishTarget,
  onClosePublish,
  onConfirmPublish,
  publishing,
}: {
  deleteTarget: Announcement | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  deleting: boolean;
  publishTarget: Announcement | null;
  onClosePublish: () => void;
  onConfirmPublish: () => void;
  publishing: boolean;
}) {
  return (
    <>
      <ConfirmDialog
        open={!!deleteTarget}
        tone="danger"
        title="Delete announcement?"
        description={
          <>
            This permanently removes <span className="font-semibold">{deleteTarget?.title}</span>. Members
            who already saw it in their bell won&apos;t have it un-notified. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={onConfirmDelete}
        onCancel={onCloseDelete}
      />

      <ConfirmDialog
        open={!!publishTarget}
        tone="info"
        title="Publish this announcement?"
        description={
          <>
            This notifies every member in their dashboard bell
            {publishTarget?.sendEmail ? ", and emails everyone with an address on file" : ""} —{" "}
            <span className="font-semibold">{publishTarget?.title}</span>
          </>
        }
        confirmLabel="Publish"
        loading={publishing}
        onConfirm={onConfirmPublish}
        onCancel={onClosePublish}
      />
    </>
  );
}
