import { Empty } from "./shared";
import type { MemberDetail } from "./types";

export default function ServiceTeamsSection({ units }: { units: MemberDetail["UnitMember"] }) {
  if (units.length === 0) return <Empty>Not on any service team yet.</Empty>;
  return (
    <div className="flex flex-wrap gap-2">
      {units.map((u) => (
        <span
          key={u.id}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFF4F6] text-[#9b3050] border border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10"
        >
          {u.Unit.name}
          {u.isLead && <span className="text-[9px] uppercase font-bold text-[#87102C] dark:text-[#e8768a]">Lead</span>}
          {u.isAssistant && <span className="text-[9px] uppercase font-bold text-gray-400">Asst</span>}
        </span>
      ))}
    </div>
  );
}
