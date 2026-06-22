"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

interface AbsentEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
  "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/**
 * Follow-up status: members absent 3+ Sundays. Self-fetching so it can drop into
 * the admin dashboard without touching the (mock) dashboard data loader.
 */
export default function FollowUpCard() {
  const { data: absent = [], isLoading } = useQuery({
    queryKey: ["members", "absent"],
    queryFn: async () => {
      const res = await apiClient.get<AbsentEntry[]>("/members/absent?missedSundays=3");
      return res.data;
    },
  });

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
            Follow-Up Needed
          </p>
          <h3 className="text-sm font-bold text-[#111] dark:text-white -mt-0.5">Absent 3+ Sundays</h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
          {absent.length}
        </span>
      </div>

      {isLoading ? (
        <p className="px-6 py-6 text-sm text-[#8a7e80] dark:text-white/40 text-center">Loading…</p>
      ) : absent.length === 0 ? (
        <p className="px-6 py-6 text-sm text-[#8a7e80] dark:text-white/40 text-center">
          All members attended recently
        </p>
      ) : (
        <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06] max-h-64 overflow-y-auto">
          {absent.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${avatarColor(`${a.firstName} ${a.lastName}`)}`}>
                {a.firstName[0]}{a.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111] dark:text-white leading-tight">
                  {a.firstName} {a.lastName}
                </p>
                {a.email && (
                  <p className="text-xs text-[#8a7e80] dark:text-white/40 truncate">{a.email}</p>
                )}
              </div>
              <Link
                href={`/dashboard/members/${a.id}`}
                className="text-[#b8a8ac] dark:text-white/25 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors flex-shrink-0"
                aria-label={`View ${a.firstName} ${a.lastName}`}
              >
                <ChevronRight size={14} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
