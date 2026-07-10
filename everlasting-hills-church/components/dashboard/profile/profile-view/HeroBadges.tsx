import { Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { fmtJoined } from "./helpers";

/** Anchor badge chips row: role, joined date, active status. */
export function HeroBadges({ role, joinedAt }: { role: string; joinedAt: string | null }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full
        bg-white/10 border border-white/15 backdrop-blur-sm
        px-3.5 py-1.5 text-[11px] font-semibold text-white/90">
        <ShieldCheck size={12} aria-hidden="true" />
        {role}
      </span>
      {joinedAt && (
        <span className="inline-flex items-center gap-1.5 rounded-full
          bg-white/10 border border-white/15 backdrop-blur-sm
          px-3.5 py-1.5 text-[11px] font-semibold text-white/90">
          <Calendar size={12} aria-hidden="true" />
          Joined {fmtJoined(joinedAt)}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 rounded-full
        bg-white/10 border border-white/15 backdrop-blur-sm
        px-3.5 py-1.5 text-[11px] font-semibold text-white/90">
        <Sparkles size={12} aria-hidden="true" />
        Active
      </span>
    </div>
  );
}
