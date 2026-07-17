import type { PersonRow } from "@/lib/api/people";
import SearchBox from "./SearchBox";
import ResultList from "./ResultList";

export default function LeaderStep({
  leader,
  onChangeLeader,
  onClearLeader,
  search,
  onSearchChange,
  rows,
  loading,
}: {
  leader: { id: string; name: string } | null;
  onChangeLeader: (p: PersonRow) => void;
  onClearLeader: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  rows: PersonRow[];
  loading: boolean;
}) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-2">
        2 · Assign to leader
      </p>
      {leader ? (
        <div className="flex items-center justify-between rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6]/50 dark:bg-white/[0.03] px-3 py-2.5 mb-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{leader.name}</span>
          <button
            type="button"
            onClick={onClearLeader}
            className="text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <SearchBox value={search} onChange={onSearchChange} placeholder="Search leader (unit leads shown by default)…" />
          <ResultList rows={rows} loading={loading} isSelected={() => false} onPick={onChangeLeader} />
        </>
      )}
    </section>
  );
}
