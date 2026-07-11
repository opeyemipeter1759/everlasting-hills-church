import { Calendar, Globe, Mail, Pencil, Users } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "./format";
import type { Announcement } from "./types";

export default function AnnouncementDetailModal({
  a,
  onClose,
}: {
  a: Announcement | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!a} onClose={onClose} title={a?.title ?? ""} maxWidth="lg">
      {a && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={a.status} />
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-white/40">
              <Globe size={11} />
              {a.audience === "all" ? "Everyone" : a.audience}
            </span>
          </div>

          {a.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/8">
              <img src={a.imageUrl} alt="" className="w-full max-h-64 object-cover" />
            </div>
          )}

          <p className="text-sm text-gray-700 dark:text-white/70 whitespace-pre-wrap leading-relaxed">
            {a.body}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-white/8">
            <div className="flex items-start gap-2">
              <Users size={14} className="text-gray-300 dark:text-white/20 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400 dark:text-white/40">Recipients</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{a.recipients}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail size={14} className="text-gray-300 dark:text-white/20 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400 dark:text-white/40">Email</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {a.sendEmail ? "Sent" : "Not sent"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-300 dark:text-white/20 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400 dark:text-white/40">Created</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {formatDateTime(a.createdAt)}
                </p>
              </div>
            </div>
            {a.updatedAt !== a.createdAt && (
              <div className="flex items-start gap-2">
                <Pencil size={14} className="text-gray-300 dark:text-white/20 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400 dark:text-white/40">Last edited</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {formatDateTime(a.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
