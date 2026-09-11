"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Loader2, Search, UserPlus, X } from "lucide-react";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { Select } from "@/components/ui/select";
import { usePeople, useAddMemberToUnit, type PersonRow } from "@/lib/api/people";

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

interface Outcome {
  id: string;
  name: string;
  ok: boolean;
  message?: string;
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
  const [unitId, setUnitId] = useState("");
  const [asLead, setAsLead] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([]);
  const [results, setResults] = useState<Outcome[]>([]);
  const [running, setRunning] = useState(false);

  const addToUnit = useAddMemberToUnit();
  const people = usePeople({ search, limit: 20 });

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
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, { id: person.id, name: person.name }],
    );
  }

  async function submit() {
    if (!unitId || picked.length === 0) return;
    setRunning(true);
    setResults([]);

    const outcomes: Outcome[] = [];
    for (const person of picked) {
      try {
        await addToUnit.mutateAsync({
          unitId,
          memberId: person.id,
          ...(canOfferLead && asLead ? { isLead: true } : {}),
        });
        outcomes.push({ id: person.id, name: person.name, ok: true });
      } catch (err) {
        outcomes.push({
          id: person.id,
          name: person.name,
          ok: false,
          message: (err as { message?: string })?.message ?? "Could not add",
        });
      }
    }

    setResults(outcomes);
    // Keep only the failures selected, ids intact, so the button retries them.
    setPicked(outcomes.filter((o) => !o.ok).map((o) => ({ id: o.id, name: o.name })));
    setRunning(false);
  }

  const added = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

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
            {added > 0 ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={!unitId || picked.length === 0 || running}
            onClick={submit}
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {running ? "Adding…" : `${failed.length ? "Retry" : "Add"} ${picked.length || ""}`.trim()}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {!fixedTeam && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-white/50">
              Team
            </label>
            <Select
              aria-label="Team"
              value={unitId}
              onChange={setUnitId}
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

        {canOfferLead && (
          <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/[0.07]">
            <input
              type="checkbox"
              checked={asLead}
              onChange={(e) => setAsLead(e.target.checked)}
              className="mt-0.5 accent-[#87102C]"
            />
            <span className="text-xs text-amber-900 dark:text-amber-300">
              <span className="inline-flex items-center gap-1 font-bold">
                <Crown size={11} /> Make them the lead
              </span>
              <span className="mt-0.5 block opacity-80">
                {team?.name} has no lead. This also grants them Unit Lead.
              </span>
            </span>
          </label>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-white/50">
            People {picked.length > 0 && `(${picked.length})`}
          </label>
          {picked.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-white/30">Nobody picked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {picked.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FFF4F6] px-2.5 py-1 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#FFB3C1]"
                >
                  {p.name}
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))}
                    className="opacity-60 hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30"
            />
            <input
              className={`${fieldCls} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by name, email or phone"
            />
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10">
            {people.isLoading ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-white/30">
                Searching…
              </p>
            ) : (people.data?.data ?? []).length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-white/30">
                No matches.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {(people.data?.data ?? []).map((person) => {
                  const already = Boolean(unitId) && person.units.some((u) => u.id === unitId);
                  const isPicked = picked.some((p) => p.id === person.id);
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        disabled={already}
                        onClick={() => toggle(person)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-45 dark:hover:bg-white/[0.03]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-gray-800 dark:text-white/80">
                            {person.name}
                          </span>
                          <span className="block truncate text-[11px] text-gray-400 dark:text-white/35">
                            {already
                              ? "Already on this team"
                              : person.units.length
                                ? person.units.map((u) => u.name).join(", ")
                                : "No team yet"}
                          </span>
                        </span>
                        {isPicked && (
                          <Check
                            size={15}
                            className="flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1]"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-1.5">
            {added > 0 && (
              <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Check size={15} /> Added {added} {added === 1 ? "person" : "people"}.
              </p>
            )}
            {failed.map((f) => (
              <p
                key={f.id}
                className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400"
              >
                {f.name}: {f.message}
              </p>
            ))}
          </div>
        )}
      </div>
    </FormModal>
  );
}
