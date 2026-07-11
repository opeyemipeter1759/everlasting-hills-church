import { fmtDate } from "../peopleShared";
import type { MemberDetail } from "./types";

export default function FollowUpSection({ tasks }: { tasks: MemberDetail["FollowUpTask"] }) {
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between rounded-xl border border-[#E7CDD3]/50 dark:border-white/10 px-4 py-2.5"
        >
          <span
            className={`text-sm ${t.done ? "line-through text-gray-400 dark:text-white/40" : "text-gray-900 dark:text-white font-medium"}`}
          >
            {t.title}
          </span>
          <span className="text-xs text-gray-400 dark:text-white/40">
            {t.done ? "Done" : t.dueDate ? `Due ${fmtDate(t.dueDate)}` : "Open"}
          </span>
        </li>
      ))}
    </ul>
  );
}
