import { format } from "date-fns";
import { UserRound } from "lucide-react";
import { Avatar } from "@/components/dashboard/admin/people/peopleShared";
import type { PersonRow } from "@/lib/api/people";

export default function MembersList({ members }: { members: PersonRow[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-3 flex items-center gap-2">
        <UserRound size={15} className="text-[#87102C] dark:text-[#e8768a]" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
          Integrated this month ({members.length})
        </h2>
      </div>

      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-white/40">No new members yet this month.</p>
      ) : (
        <ul className="max-h-[420px] no-scrollbar space-y-2 overflow-y-auto pr-1">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02] px-3 py-2.5"
            >
              <Avatar photoUrl={m.photoUrl} firstName={m.firstName} lastName={m.lastName} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{m.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-white/40">
                  Joined {format(new Date(m.joinedAt), "d MMM")}
                  {m.units.length > 0 && ` · ${m.units.map((u) => u.name).join(", ")}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
