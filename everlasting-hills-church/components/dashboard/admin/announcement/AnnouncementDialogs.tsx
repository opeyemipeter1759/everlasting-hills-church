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
  unpublishTarget,
  onCloseUnpublish,
  onConfirmUnpublish,
  unpublishing,
}: {
  deleteTarget: Announcement | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  deleting: boolean;
  publishTarget: Announcement | null;
  onClosePublish: () => void;
  onConfirmPublish: () => void;
  publishing: boolean;
  unpublishTarget: Announcement | null;
  onCloseUnpublish: () => void;
  onConfirmUnpublish: () => void;
  unpublishing: boolean;
}) {
  // A draft that already has recipients was published once and then
  // unpublished. Publishing it again fans out a second time, so say so rather
  // than letting an admin re-notify the whole church by accident.
  const isRepublish = (publishTarget?.recipients ?? 0) > 0;
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
        title={isRepublish ? "Publish this again?" : "Publish this announcement?"}
        description={
          <>
            {isRepublish ? "This notifies every member again" : "This notifies every member"} in their
            dashboard bell
            {publishTarget?.sendEmail ? ", and emails everyone with an address on file" : ""} —{" "}
            <span className="font-semibold">{publishTarget?.title}</span>
            {isRepublish && (
              <>
                . It went out to {publishTarget?.recipients} member
                {publishTarget?.recipients === 1 ? "" : "s"} before.
              </>
            )}
          </>
        }
        confirmLabel={isRepublish ? "Publish again" : "Publish"}
        loading={publishing}
        onConfirm={onConfirmPublish}
        onCancel={onClosePublish}
      />

      <ConfirmDialog
        open={!!unpublishTarget}
        tone="warning"
        title="Unpublish this announcement?"
        description={
          <>
            <span className="font-semibold">{unpublishTarget?.title}</span> stops showing on the member
            dashboard and the public site, and moves back to Drafts — use this once an event has passed.
            Members who already saw it in their bell keep that notification, and nothing is deleted, so you
            can publish it again later.
          </>
        }
        confirmLabel="Unpublish"
        loading={unpublishing}
        onConfirm={onConfirmUnpublish}
        onCancel={onCloseUnpublish}
      />
    </>
  );
}
