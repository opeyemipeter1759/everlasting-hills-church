import { fmtDate } from "../peopleShared";
import type { MemberDetail } from "./types";

export default function PastorNotesSection({ notes }: { notes: MemberDetail["PastorNote"] }) {
  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <li
          key={n.id}
          className="rounded-xl bg-[#FFF4F6]/60 dark:bg-white/[0.03] border border-[#E7CDD3]/50 dark:border-white/10 p-4"
        >
          <p className="text-sm text-gray-700 dark:text-white/80 whitespace-pre-wrap">{n.content}</p>
          <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2">{fmtDate(n.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
