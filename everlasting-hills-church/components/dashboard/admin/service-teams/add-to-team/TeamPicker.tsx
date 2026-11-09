import { Crown } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { TeamChoice } from "../AddToTeamDialog";
import type { AddToTeamState } from "./useAddToTeam";

/** The team dropdown (hidden when the team is fixed) and, where it applies, "Make them the lead". */
export default function TeamPicker({ s, teams, showSelect }: { s: AddToTeamState; teams: TeamChoice[]; showSelect: boolean }) {
  return (
    <>
      {showSelect && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-white/50">Team</label>
          <Select
            aria-label="Team"
            value={s.unitId}
            onChange={s.setUnitId}
            placeholder="Choose a team"
            options={teams.map((t) => ({
              value: t.id,
              label:
                `${t.name}` +
                (t.departmentName ? ` — ${t.departmentName}` : "") +
                (t.memberCount === undefined ? "" : ` (${t.memberCount})`),
            }))}
          />
        </div>
      )}

      {s.canOfferLead && (
        <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/[0.07]">
          <input
            type="checkbox"
            checked={s.asLead}
            onChange={(e) => s.setAsLead(e.target.checked)}
            className="mt-0.5 accent-[#87102C]"
          />
          <span className="text-xs text-amber-900 dark:text-amber-300">
            <span className="inline-flex items-center gap-1 font-bold">
              <Crown size={11} /> Make them the lead
            </span>
            <span className="mt-0.5 block opacity-80">{s.team?.name} has no lead. This also grants them Unit Lead.</span>
          </span>
        </label>
      )}
    </>
  );
}
