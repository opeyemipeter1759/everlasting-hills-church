import { Eye, Mail, Pencil, Radio, Trash2, Users } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatRelativeDate } from "./format";
import type { Announcement } from "./types";

export default function AnnouncementCard({
  a,
  onView,
  onEdit,
  onDelete,
  onPublish,
}: {
  a: Announcement;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const isDraft = a.status === "DRAFT";
  return (
    <div
      className={`group flex gap-4 rounded-2xl border p-4 sm:p-5 transition-all ${
        isDraft
          ? "border-amber-200/60 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/[0.04] hover:bg-amber-50 dark:hover:bg-amber-500/[0.07]"
          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm"
      }`}
    >
      {a.imageUrl && (
        <div className="hidden sm:block w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5">
          <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col">
        <button type="button" onClick={onView} className="min-w-0 flex-1 flex items-start justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-1 whitespace-pre-wrap line-clamp-2">
              {a.body}
            </p>
          </div>
          <span className="text-[11px] text-gray-400 dark:text-white/30 flex-shrink-0">
            {formatRelativeDate(a.createdAt)}
          </span>
        </button>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3">
          <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-white/30">
            <span className="inline-flex items-center gap-1">
              <Users size={12} />
              {a.recipients} recipient{a.recipients === 1 ? "" : "s"}
            </span>
            {a.sendEmail && (
              <span className="inline-flex items-center gap-1">
                <Mail size={12} />
                Emailed
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onView}
              title="View details"
              aria-label="View details"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Eye size={14} />
            </button>
            {isDraft && (
              <button
                type="button"
                onClick={onPublish}
                title="Publish"
                aria-label="Publish"
                className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors"
              >
                <Radio size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              aria-label="Edit"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              aria-label="Delete"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
