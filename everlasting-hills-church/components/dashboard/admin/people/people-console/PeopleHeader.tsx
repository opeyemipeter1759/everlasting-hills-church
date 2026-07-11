import { UserCheck, UserPlus } from "lucide-react";
import { btnPrimaryHdr, btnSecondary } from "./constants";

export default function PeopleHeader({ onAssign, onCreate }: { onAssign: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a] mb-1.5">
          Administration
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">People</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
          One place to find, manage, assign, and shepherd every member.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAssign} className={btnSecondary}>
          <UserCheck size={15} /> Assign
        </button>
        <button type="button" onClick={onCreate} className={btnPrimaryHdr}>
          <UserPlus size={15} /> New Person
        </button>
      </div>
    </div>
  );
}
