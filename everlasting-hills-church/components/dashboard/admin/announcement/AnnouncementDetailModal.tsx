import Image from "next/image";
import { Calendar, Clock, Globe, Mail, MapPin, Pencil, Users } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { ROLE_LABEL } from "../people/peopleShared/roleMeta";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "./format";
import type { Announcement } from "./types";

const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female" };

function audienceSummary(a: Announcement): string {
  if (a.targetRoles.length === 0 && a.targetGenders.length === 0 && a.targetProfileIds.length === 0) {
    return "Everyone";
  }
  const parts: string[] = [];
  if (a.targetRoles.length > 0) parts.push(a.targetRoles.map((r) => ROLE_LABEL[r]).join(", "));
  if (a.targetGenders.length > 0) parts.push(a.targetGenders.map((g) => GENDER_LABEL[g] ?? g).join(", "));
  if (a.targetProfileIds.length > 0) {
    const names = a.targetProfileNames.slice(0, 2).join(", ");
    const extra = a.targetProfileIds.length - 2;
    parts.push(extra > 0 ? `${names} +${extra} more` : names);
  }
  return parts.join(" · ");
}

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
              Everyone sees this
            </span>
            {a.sendEmail && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-white/40">
                <Mail size={11} />
                Emailed: {audienceSummary(a)}
              </span>
            )}
          </div>

          {(a.eventTime || a.venue) && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#87102C] dark:text-[#e8768a]">
              {a.eventTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {a.eventTime}
                </span>
              )}
              {a.venue && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} /> {a.venue}
                </span>
              )}
            </div>
          )}

          {a.imageUrl && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-100 dark:border-white/8">
              <Image src={a.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
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
