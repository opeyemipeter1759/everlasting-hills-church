import { CheckCircle2, Mail, MailOpen } from "lucide-react";
import { useMarkTestimonialRead, useTogglePublishTestimonial, type AdminTestimonial } from "@/lib/api/testimonials";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage, fmt, OUTLINE_TOGGLE } from "./shared";

const BTN = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50";

/** Who read it and when, Mark as read/unread, and (PASTOR+) Publish / Move to draft. */
export default function TestimonialActions({ t, canTogglePublish }: { t: AdminTestimonial; canTogglePublish: boolean }) {
  const togglePublish = useTogglePublishTestimonial();
  const markRead = useMarkTestimonialRead();
  const isRead = !!t.readAt;

  function toggleRead() {
    markRead.mutate(
      { id: t.id, read: !isRead },
      {
        onSuccess: () => showToast.success(isRead ? "Moved back to Unread" : "Moved to Read"),
        onError: (err) => showToast.error(errorMessage(err, "Couldn't update")),
      },
    );
  }

  async function toggleStatus() {
    try {
      await togglePublish.mutateAsync({ id: t.id, published: !t.published });
      showToast.success(t.published ? "Moved to draft" : "Testimonial published");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't update status"));
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
      {t.readAt && (
        <p className="mr-auto text-[11px] text-gray-400 dark:text-white/40">
          Read{t.readByName ? ` by ${t.readByName}` : ""} · {fmt(t.readAt)}
        </p>
      )}
      <button
        type="button"
        onClick={toggleRead}
        disabled={markRead.isPending}
        className={`${BTN} ${isRead ? OUTLINE_TOGGLE : "bg-[#87102C] text-white hover:bg-[#6d0d24]"}`}
      >
        {isRead ? <Mail size={13} /> : <MailOpen size={13} />} {isRead ? "Mark as unread" : "Mark as read"}
      </button>
      {canTogglePublish && (
        <button
          type="button"
          onClick={toggleStatus}
          disabled={togglePublish.isPending}
          className={`${BTN} ${t.published ? OUTLINE_TOGGLE : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
        >
          <CheckCircle2 size={13} /> {t.published ? "Move to draft" : "Publish"}
        </button>
      )}
    </div>
  );
}
