import SortHead from "./SortHead";
import { COL, TH } from "./constants";

export default function PeopleTableHead({
  allSelected,
  hasRows,
  onToggleAll,
  sortBy,
  sortOrder,
  onSort,
}: {
  allSelected: boolean;
  hasRows: boolean;
  onToggleAll: () => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  return (
    <thead>
      <tr>
        {/* Frozen: checkbox */}
        <th
          className={`${TH} sticky top-0 z-40`}
          style={{ left: COL.check.left, width: COL.check.width, minWidth: COL.check.width }}
        >
          <input
            type="checkbox"
            checked={allSelected && hasRows}
            onChange={onToggleAll}
            aria-label="Select all on this page"
            className="h-4 w-4 rounded border-gray-300 accent-[#87102C]"
          />
        </th>
        {/* Frozen: ID */}
        <th className={`${TH} sticky top-0 z-40`} style={{ left: COL.id.left, width: COL.id.width, minWidth: COL.id.width }}>
          ID
        </th>
        {/* Frozen: Person (name) */}
        <th
          className={`${TH} sticky top-0 z-40 shadow-[1px_0_0_0_rgba(231,205,211,0.6)]`}
          style={{ left: COL.name.left, width: COL.name.width, minWidth: COL.name.width }}
        >
          <SortHead label="Person" col="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </th>
        {/* Scrolling columns */}
        <th className={`${TH} sticky top-0 z-30`}>
          <SortHead label="Role" col="role" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </th>
        <th className={`${TH} sticky top-0 z-30`}>Phone</th>
        <th className={`${TH} sticky top-0 z-30`}>Gender</th>
        <th className={`${TH} sticky top-0 z-30`}>EHC Service Team</th>
        <th className={`${TH} sticky top-0 z-30`}>
          <SortHead label="Status" col="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </th>
        <th className={`${TH} sticky top-0 z-30`}>Profile</th>
        <th className={`${TH} sticky top-0 z-30`}>Birthday</th>
        <th className={`${TH} sticky top-0 z-30`}>
          <SortHead label="Joined" col="joinedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </th>
        <th className={`${TH} sticky top-0 z-30 text-right`}>Actions</th>
      </tr>
    </thead>
  );
}
