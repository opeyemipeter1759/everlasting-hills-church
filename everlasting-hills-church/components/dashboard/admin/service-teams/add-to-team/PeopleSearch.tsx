import { Check, Search } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import { usePeople } from "@/lib/api/people";
import type { AddToTeamState } from "./useAddToTeam";

const NOTE = "px-3 py-4 text-center text-xs text-gray-400 dark:text-white/30";

/** Search members and tick them; people already on the chosen team are greyed out. */
export default function PeopleSearch({ s, open }: { s: AddToTeamState; open: boolean }) {
  // The dialog stays mounted while closed, so the list only fetches once it opens.
  const people = usePeople({ search: s.search, limit: 20 }, { enabled: open });
  const rows = people.data?.data ?? [];

  return (
    <div>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30" />
        <input
          className={`${fieldCls} pl-9`}
          value={s.search}
          onChange={(e) => s.setSearch(e.target.value)}
          placeholder="Search members by name, email or phone"
        />
      </div>

      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10">
        {people.isLoading ? (
          <p className={NOTE}>Searching…</p>
        ) : rows.length === 0 ? (
          <p className={NOTE}>No matches.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {rows.map((person) => {
              const already = Boolean(s.unitId) && person.units.some((u) => u.id === s.unitId);
              const isPicked = s.picked.some((p) => p.id === person.id);
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => s.toggle(person)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-45 dark:hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-gray-800 dark:text-white/80">{person.name}</span>
                      <span className="block truncate text-[11px] text-gray-400 dark:text-white/35">
                        {already ? "Already on this team" : person.units.length ? person.units.map((u) => u.name).join(", ") : "No team yet"}
                      </span>
                    </span>
                    {isPicked && <Check size={15} className="flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
