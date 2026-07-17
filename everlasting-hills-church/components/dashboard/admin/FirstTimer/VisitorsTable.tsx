import type { VisitorRow } from "./types";
import VisitorRowItem from "./VisitorRowItem";

const TH =
  "text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em]";

export default function VisitorsTable({
  rows,
  onCreated,
}: {
  rows: VisitorRow[];
  onCreated: (visitorId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
            <th className={TH}>Name</th>
            <th className={`${TH} hidden sm:table-cell`}>Type</th>
            <th className={`${TH} hidden md:table-cell`}>Interest</th>
            <th className={`${TH} hidden lg:table-cell`}>Date</th>
            <th className={TH}>Action</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <VisitorRowItem key={v.id} visitor={v} onCreated={onCreated} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
