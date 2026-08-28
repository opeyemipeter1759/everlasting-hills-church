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
  publishSendEmail,
  onPublishSendEmailChange,
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
  publishSendEmail: boolean;
  onPublishSendEmailChange: (value: boolean) => void;
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
            dashboard bell — <span className="font-semibold">{publishTarget?.title}</span>
            {isRepublish && (
              <>
                . It went out to {publishTarget?.recipients} member
                {publishTarget?.recipients === 1 ? "" : "s"} before.
              </>
            )}
            {/* Email is a separate, per-publish decision. Re-publishing a past
                event should not put a second copy of the same flyer in every
                inbox unless that is what the admin actually wants. */}
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <input
                type="checkbox"
                checked={publishSendEmail}
                onChange={(e) => onPublishSendEmailChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#87102C]"
              />
              <span className="text-xs text-gray-600 dark:text-white/60">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Also email everyone with an address on file
                </span>
                <br />
                {isRepublish
                  ? "Leave this off to reinstate the announcement without emailing again."
                  : "The in-app notification is sent either way."}
              </span>
            </label>
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
