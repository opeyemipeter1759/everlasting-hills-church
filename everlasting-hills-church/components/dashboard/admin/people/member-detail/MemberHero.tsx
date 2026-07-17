import { CalendarDays, Tag } from "lucide-react";
import { Avatar, displayId, fmtDate, ProfileCompletionMeter, ROLE_BADGE, ROLE_LABEL, STATUS_BADGE } from "../peopleShared";
import type { MemberDetail } from "./types";

export default function MemberHero({ member: m, completionPct }: { member: MemberDetail; completionPct: number }) {
  const role = m.Profile?.role ?? "MEMBER";
  // "Worker" is a display-only distinction, not a real role: a plain MEMBER who
  // also belongs to a unit (but isn't its lead — that's UNIT_LEAD, a real role).
  const isWorker = role === "MEMBER" && m.UnitMember.length > 0;
  const name = `${m.firstName} ${m.lastName}`.trim();

  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Avatar photoUrl={m.photoUrl} firstName={m.firstName} lastName={m.lastName} size={72} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{name}</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_BADGE[role]}`}>
              {isWorker ? "Worker" : ROLE_LABEL[role]}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${STATUS_BADGE[m.status] ?? STATUS_BADGE.INACTIVE}`}>
              {m.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-white/50">
            <span className="font-mono text-xs font-semibold text-[#87102C] dark:text-[#e8768a]">{displayId(m.id)}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} /> Joined {fmtDate(m.joinedAt)}
            </span>
          </div>
        </div>
        <div className="sm:w-44">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
            Profile completion
          </p>
          <ProfileCompletionMeter value={completionPct} />
        </div>
      </div>
      {m.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-5 border-t border-[#E7CDD3]/40 dark:border-white/[0.06]">
          <Tag size={13} className="text-gray-300 dark:text-white/30" />
          {m.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
