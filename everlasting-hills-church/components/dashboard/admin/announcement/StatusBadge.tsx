import { FileText, Radio } from "lucide-react";
import type { AnnouncementStatus } from "./types";

export default function StatusBadge({ status }: { status: AnnouncementStatus }) {
  const isDraft = status === "DRAFT";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isDraft
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      }`}
    >
      {isDraft ? <FileText size={9} /> : <Radio size={9} />}
      {isDraft ? "Draft" : "Published"}
    </span>
  );
}
