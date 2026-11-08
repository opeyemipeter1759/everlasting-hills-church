import { ListFilter } from "lucide-react";
import { COLS, type AttendanceRow, type ColKey } from "./attendance-data";
import { AttendanceTableRow, EmptyRow, SkeletonRows } from "./AttendanceRows";

/** The history table: column headers, an optional row of column filters, and the records. */
export function AttendanceTable({ rows, loading, showFilter, filters, onFilter }: {
  rows: AttendanceRow[];
  loading: boolean;
  showFilter: boolean;
  filters: Record<ColKey, string>;
  onFilter: (key: ColKey, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-x-auto shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#FFF4F6] dark:bg-[#140b10] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
            {COLS.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] xs:tracking-[0.15em] text-[#87102C]/70 dark:text-white/45 whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
          {showFilter && (
            <tr className="bg-[#FFF4F6]/50 dark:bg-[#140b10] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
              {COLS.map((c) => (
                <th key={c.key} className="px-3 py-2">
                  <div className="relative">
                    <input
                      value={filters[c.key]}
                      onChange={(e) => onFilter(c.key, e.target.value)}
                      aria-label={`Filter by ${c.label}`}
                      className="w-full rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 pl-2.5 pr-6 py-1.5 text-xs text-[#111] dark:text-white outline-none focus-visible:border-[#87102C] focus-visible:ring-2 focus-visible:ring-[#87102C]/15"
                    />
                    <ListFilter size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#b8a8ac] dark:text-white/30" />
                  </div>
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.05]">
          {loading ? (
            <SkeletonRows cols={COLS.length} />
          ) : rows.length === 0 ? (
            <EmptyRow cols={COLS.length} />
          ) : (
            rows.map((r, i) => <AttendanceTableRow key={`${r.raw.id}-${i}`} r={r} striped={i % 2 === 1} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
