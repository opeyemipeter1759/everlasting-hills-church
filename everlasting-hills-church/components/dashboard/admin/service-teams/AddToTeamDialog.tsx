"use client";

import { Loader2, UserPlus } from "lucide-react";
import FormModal, { btnGhost, btnPrimary } from "@/components/ui/overlay/FormModal";
import { useAddToTeam } from "./add-to-team/useAddToTeam";
import TeamPicker from "./add-to-team/TeamPicker";
import PickedPeople from "./add-to-team/PickedPeople";
import PeopleSearch from "./add-to-team/PeopleSearch";
import AddResults from "./add-to-team/AddResults";

/**
 * The minimum a caller must know about a team to offer it here.
 *
 * hasLead is optional on purpose. The service teams screen knows it and can
 * therefore offer "make them the lead" for a team that has none; the People
 * screen builds its list from the unit options endpoint, which does not carry
 * it, so the offer simply does not appear there. Optional beats defaulting it
 * to true, which would be asserting something the caller never established.
 */
export interface TeamChoice {
  id: string;
  name: string;
  departmentName?: string | null;
  memberCount?: number;
  hasLead?: boolean;
}

/**
 * Put people on a team.
 *
 * Several at once, because the realistic job is "the whole ushering rota needs
 * adding", not one person. The endpoint takes one member per call, so this
 * loops and reports per person: a half-successful batch tells you exactly who
 * landed and who did not, which is more useful than an all-or-nothing promise
 * the API cannot make anyway. The ones that failed stay selected so the button
 * retries just those.
 */
export default function AddToTeamDialog({
  open,
  onClose,
  teams,
  fixedTeam,
  preselected = [],
}: {
  open: boolean;
  onClose: () => void;
  teams: TeamChoice[];
  /** When opened from a team row, the team is decided and the picker is hidden. */
  fixedTeam?: { unitId: string; unitName: string } | null;
  /** When opened from People with rows ticked, those people start selected. */
  preselected?: { id: string; name: string }[];
}) {
  const s = useAddToTeam({ open, teams, fixedTeam, preselected });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={fixedTeam ? `Add to ${fixedTeam.unitName}` : "Add people to a service team"}
      subtitle="Pick the team, then the people who serve on it."
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            {s.added > 0 ? "Done" : "Cancel"}
          </button>
          <button type="button" className={btnPrimary} disabled={!s.unitId || s.picked.length === 0 || s.running} onClick={s.submit}>
            {s.running ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {s.running ? "Adding…" : `${s.failed.length ? "Retry" : "Add"} ${s.picked.length || ""}`.trim()}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <TeamPicker s={s} teams={teams} showSelect={!fixedTeam} />
        <PickedPeople s={s} />
        <PeopleSearch s={s} open={open} />
        <AddResults s={s} />
      </div>
    </FormModal>
  );
}
