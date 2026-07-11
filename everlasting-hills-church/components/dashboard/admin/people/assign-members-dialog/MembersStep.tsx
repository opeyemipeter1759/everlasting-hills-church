import { X } from "lucide-react";
import type { PersonRow } from "@/lib/api/people";
import SearchBox from "./SearchBox";
import ResultList from "./ResultList";

export default function MembersStep({
  selected,
  selectedIds,
  onRemove,
  search,
  onSearchChange,
  rows,
  loading,
  onPick,
}: {
  selected: Record<string, string>;
  selectedIds: string[];
  onRemove: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  rows: PersonRow[];
  loading: boolean;
  onPick: (p: PersonRow) => void;
}) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-2">
        1 · People to assign
      </p>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-full bg-[#87102C] text-white"
            >
              {selected[id]}
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="hover:bg-white/20 rounded-full p-0.5"
                aria-label={`Remove ${selected[id]}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <SearchBox value={search} onChange={onSearchChange} placeholder="Search people to assign…" />
      <ResultList rows={rows} loading={loading} isSelected={(p) => Boolean(selected[p.id])} onPick={onPick} multi />
    </section>
  );
}
