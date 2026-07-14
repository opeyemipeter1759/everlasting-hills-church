import Link from "next/link";
import { Mail } from "lucide-react";
import type { PersonRow } from "@/lib/api/people";
import { Avatar } from "../peopleShared";
import { COL, TD } from "./constants";

export default function PersonCell({ p, sBg }: { p: PersonRow; sBg: string }) {
  return (
    <td
      className={`${TD} ${sBg} static lg:sticky lg:z-20 lg:shadow-[1px_0_0_0_rgba(231,205,211,0.5)]`}
      style={{ left: COL.name.left }}
    >
      <Link
        href={`/dashboard/admin/members/${p.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-3 group/link"
      >
        <Avatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/link:text-[#87102C] dark:group-hover/link:text-[#e8768a] transition-colors">
            {p.name}
          </p>
          {p.email && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40 truncate max-w-[200px]">
              <Mail size={11} className="flex-shrink-0" />
              <span className="truncate">{p.email}</span>
            </span>
          )}
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {p.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </td>
  );
}
