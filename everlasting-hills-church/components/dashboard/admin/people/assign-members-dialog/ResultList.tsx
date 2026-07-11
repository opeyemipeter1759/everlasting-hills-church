import { Check } from "lucide-react";
import type { PersonRow } from "@/lib/api/people";
import { Avatar, ROLE_LABEL } from "../peopleShared";

export default function ResultList({
  rows,
  loading,
  isSelected,
  onPick,
  multi,
}: {
  rows: PersonRow[];
  loading: boolean;
  isSelected: (p: PersonRow) => boolean;
  onPick: (p: PersonRow) => void;
  multi?: boolean;
}) {
  return (
    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-[#E7CDD3]/60 dark:border-white/10 divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
      {loading ? (
        <p className="px-3 py-4 text-xs text-gray-400">Searching…</p>
      ) : rows.length === 0 ? (
        <p className="px-3 py-4 text-xs text-gray-400">No matches.</p>
      ) : (
        rows.map((p) => {
          const sel = isSelected(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                sel ? "bg-[#FFF4F6] dark:bg-[#87102C]/10" : "hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03]"
              }`}
            >
              <Avatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} size={32} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</span>
                <span className="block text-[11px] text-gray-400 dark:text-white/40 truncate">
                  {ROLE_LABEL[p.role]}
                  {p.email ? ` · ${p.email}` : ""}
                </span>
              </span>
              {multi && sel && <Check size={16} className="text-[#87102C] dark:text-[#e8768a]" />}
            </button>
          );
        })
      )}
    </div>
  );
}
