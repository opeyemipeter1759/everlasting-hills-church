import type { DirectoryMeta, DirectoryParams } from "@/lib/api/people";
import { ROLE_CHIPS, type Chip } from "./constants";

export default function PeopleRoleChips({
  params,
  counts,
  onSelect,
}: {
  params: DirectoryParams;
  counts?: DirectoryMeta["counts"];
  onSelect: (c: Chip) => void;
}) {
  function chipActive(c: Chip): boolean {
    if (c.key === "all") return !params.role && params.hasUnit !== "false";
    if (c.key === "noUnit") return params.hasUnit === "false";
    return params.role === c.role;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ROLE_CHIPS.map((chip) => {
        const active = chipActive(chip);
        const count =
          chip.key === "all" ? counts?.total : chip.key === "role" ? counts?.byRole[chip.role] : undefined;
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSelect(chip)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              active
                ? "bg-[#87102C] text-white border-transparent"
                : "bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 border-[#E7CDD3] dark:border-white/10 hover:border-[#87102C]/40 hover:text-[#87102C] dark:hover:text-[#e8768a]"
            }`}
          >
            {chip.label}
            {count !== undefined && (
              <span className={`text-[10px] ${active ? "text-white/80" : "text-gray-400 dark:text-white/40"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
