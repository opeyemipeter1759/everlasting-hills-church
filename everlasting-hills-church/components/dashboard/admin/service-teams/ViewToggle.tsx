import { LayoutGrid, Users } from "lucide-react";

export type RosterView = "people" | "teams";

const TABS = [
  { key: "people", label: "By person", icon: Users },
  { key: "teams", label: "By team", icon: LayoutGrid },
] as const;

/** Switch between the person-first roster and the same roster grouped by team. */
export default function ViewToggle({ view, onChange }: { view: RosterView; onChange: (v: RosterView) => void }) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={view === key}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
            view === key
              ? "bg-[#87102C] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 dark:text-white/45 dark:hover:text-white"
          }`}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  );
}
