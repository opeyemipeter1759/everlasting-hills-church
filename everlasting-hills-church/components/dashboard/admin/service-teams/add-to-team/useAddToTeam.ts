import { useEffect, useState } from "react";
import { useAddMemberToUnit, type PersonRow } from "@/lib/api/people";
import type { TeamChoice } from "../AddToTeamDialog";

export interface Picked {
  id: string;
  name: string;
}

export interface Outcome extends Picked {
  ok: boolean;
  message?: string;
}

/**
 * The dialog's state: chosen team, picked people, the lead offer, and the
 * per-person results of adding them. Resets each time the dialog opens.
 */
export function useAddToTeam({ open, teams, fixedTeam, preselected }: {
  open: boolean;
  teams: TeamChoice[];
  fixedTeam?: { unitId: string; unitName: string } | null;
  preselected: Picked[];
}) {
  const [unitId, setUnitId] = useState("");
  const [asLead, setAsLead] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [results, setResults] = useState<Outcome[]>([]);
  const [running, setRunning] = useState(false);
  const addToUnit = useAddMemberToUnit();

  const preselectedKey = preselected.map((p) => p.id).join(",");
  useEffect(() => {
    if (!open) return;
    setUnitId(fixedTeam?.unitId ?? "");
    setPicked(preselected);
    setAsLead(false);
    setResults([]);
    setSearch("");
    // preselected is a new array each render; its ids are the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedTeam?.unitId, preselectedKey]);

  const team = teams.find((t) => t.id === unitId);
  // Only when the caller actually knows the team has no lead, and only for a
  // single person — "make these four the lead" is not a thing.
  const canOfferLead = Boolean(team && team.hasLead === false && picked.length === 1);

  function toggle(person: PersonRow) {
    setPicked((prev) =>
      prev.some((p) => p.id === person.id) ? prev.filter((p) => p.id !== person.id) : [...prev, { id: person.id, name: person.name }],
    );
  }

  const unpick = (id: string) => setPicked((prev) => prev.filter((x) => x.id !== id));

  async function submit() {
    if (!unitId || picked.length === 0) return;
    setRunning(true);
    setResults([]);

    const outcomes: Outcome[] = [];
    for (const person of picked) {
      try {
        await addToUnit.mutateAsync({ unitId, memberId: person.id, ...(canOfferLead && asLead ? { isLead: true } : {}) });
        outcomes.push({ id: person.id, name: person.name, ok: true });
      } catch (err) {
        outcomes.push({ id: person.id, name: person.name, ok: false, message: (err as { message?: string })?.message ?? "Could not add" });
      }
    }

    setResults(outcomes);
    // Keep only the failures selected, ids intact, so the button retries them.
    setPicked(outcomes.filter((o) => !o.ok).map((o) => ({ id: o.id, name: o.name })));
    setRunning(false);
  }

  return {
    unitId, setUnitId, asLead, setAsLead, search, setSearch, picked, results, running,
    team, canOfferLead, toggle, unpick, submit,
    added: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok),
  };
}

export type AddToTeamState = ReturnType<typeof useAddToTeam>;
