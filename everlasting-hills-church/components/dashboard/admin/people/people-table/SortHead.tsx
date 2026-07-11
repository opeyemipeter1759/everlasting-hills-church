import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export default function SortHead({
  label,
  col,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  col: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (c: string) => void;
}) {
  const active = sortBy === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
    >
      {label}
      {active ? (
        sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ChevronsUpDown size={12} className="opacity-40" />
      )}
    </button>
  );
}
