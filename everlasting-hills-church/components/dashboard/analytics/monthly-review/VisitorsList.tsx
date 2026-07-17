import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/dashboard/admin/people/peopleShared";
import type { PersonRow } from "@/lib/api/people";

export default function VisitorsList({ visitors }: { visitors: PersonRow[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-amber-500" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
          Visitors this month ({visitors.length})
        </h2>
      </div>

      {visitors.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-white/40">No new visitors yet this month.</p>
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {visitors.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02] px-3 py-2.5"
            >
              <Avatar photoUrl={v.photoUrl} firstName={v.firstName} lastName={v.lastName} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{v.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-white/40">
                  Visited {format(new Date(v.joinedAt), "d MMM")}
                  {v.phone && ` · ${v.phone}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
