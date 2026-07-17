import { Gift, ChevronRight } from "lucide-react";
import { CHURCH } from "@/config/config";
import { PanelCard } from "./Primitives";

export function CommunityBirthdayPanel({ communityBirthdays }: {
  communityBirthdays: Array<{ firstName: string; lastName: string; photoUrl: string | null }>;
}) {
  return (
    <PanelCard kicker="Celebrations" title="Birthdays Today" icon={Gift}>
      {communityBirthdays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200/50 dark:border-rose-500/20">
            <Gift size={20} className="text-rose-400 dark:text-rose-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No birthdays today</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">Check back daily to celebrate the family</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {communityBirthdays.slice(0, 5).map((b, i) => {
            const initials = `${b.firstName[0]}${b.lastName[0]}`.toUpperCase();
            return (
              <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/15">
                {b.photoUrl ? (
                  <img src={b.photoUrl} alt={`${b.firstName} ${b.lastName}`}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0 ring-2 ring-rose-200 dark:ring-rose-500/30" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#87102C] dark:text-[#FFB3C1]">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
                    🎂 {b.firstName} {b.lastName}
                  </p>
                  <p className="text-[10px] text-rose-400 dark:text-rose-500 mt-0.5">Birthday today</p>
                </div>
                <a href={CHURCH.whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5">
                  Wish <ChevronRight size={11} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
