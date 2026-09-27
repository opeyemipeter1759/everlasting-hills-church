"use client";

import { useState } from "react";
import { Crown, Medal, Trophy, UserMinus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";
import AddMemberForm from "@/components/dashboard/admin/unit/AddMemberForm";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import { useAddMemberToUnit, useRemoveMemberFromUnit } from "@/lib/api/people";
import { useEvangelismTeam, usePerformance, type PerformanceRange, type PerformanceRow, type TeamMember } from "@/lib/api/evangelism";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorNote, Loading, cardClass, primaryButton } from "./bits";
import { errorText } from "./labels";

const RANGES: { value: PerformanceRange; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

export function TeamTab({ canLead, unitId }: { canLead: boolean; unitId: string }) {
  const [range, setRange] = useState<PerformanceRange>("month");
  const perf = usePerformance(range);
  const team = useEvangelismTeam();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
            <Trophy size={15} aria-hidden="true" /> Leaderboard
          </h2>
          <div className="inline-flex rounded-xl border border-gray-200 p-0.5 dark:border-white/10" role="radiogroup" aria-label="Period">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={range === r.value}
                onClick={() => setRange(r.value)}
                className={`min-h-9 rounded-lg px-3 text-xs font-bold ${range === r.value ? "bg-[#87102C] text-white" : "text-gray-600 dark:text-white/60"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {perf.isLoading ? (
          <Loading />
        ) : perf.isError ? (
          <ErrorNote>{errorText(perf.error, "Couldn't load the figures.")}</ErrorNote>
        ) : (perf.data ?? []).length === 0 ? (
          <EmptyState icon={Trophy} title="Nothing to show yet" body="Figures appear once the team starts recording contacts." />
        ) : (
          <Leaderboard rows={perf.data ?? []} />
        )}
      </section>

      <Roster canLead={canLead} unitId={unitId} team={team.data ?? []} loading={team.isLoading} />
    </div>
  );
}

function Rank({ i }: { i: number }) {
  if (i === 0) return <Crown size={16} className="text-amber-500" aria-label="First" />;
  if (i === 1) return <Medal size={16} className="text-gray-400" aria-label="Second" />;
  if (i === 2) return <Medal size={16} className="text-orange-400" aria-label="Third" />;
  return <span className="w-4 text-center text-xs font-bold text-gray-400">{i + 1}</span>;
}

function Leaderboard({ rows }: { rows: PerformanceRow[] }) {
  return (
    <>
      <ul className="space-y-2 md:hidden">
        {rows.map((r, i) => (
          <li key={r.id} className={`${cardClass} p-3.5`}>
            <div className="flex items-center gap-3">
              <Rank i={i} />
              <Avatar name={r.name} photoUrl={r.photoUrl} px={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{r.name}</p>
                {!r.onTeam && <p className="text-[11px] text-gray-400">No longer on the team</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{r.saved}</p>
                <p className="text-[10px] font-semibold uppercase text-gray-400">saved</p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px]">
              <Mini label="Preached" value={r.preached} />
              <Mini label="Follow-ups" value={`${r.followUpsDone}/${r.followUpsPending}`} hint="done / waiting" />
              <Mini label="Tasks" value={`${r.tasksDone}/${r.tasksPending}`} hint="done / open" />
              <Mini label="Outreaches" value={r.outreaches} />
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#161618] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:border-white/10">
              <th className="w-10 px-4 py-3" aria-label="Rank" />
              <th className="px-3 py-3">Worker</th>
              <th className="px-3 py-3 text-right">Preached to</th>
              <th className="px-3 py-3 text-right">Saved</th>
              <th className="px-3 py-3 text-right">Follow-ups done</th>
              <th className="px-3 py-3 text-right">Follow-ups waiting</th>
              <th className="px-3 py-3 text-right">Tasks done</th>
              <th className="px-3 py-3 text-right">Tasks open</th>
              <th className="px-3 py-3 text-right">Outreaches</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-gray-50 last:border-0 dark:border-white/[0.04]">
                <td className="px-4 py-3">
                  <Rank i={i} />
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <Avatar name={r.name} photoUrl={r.photoUrl} px={26} /> {r.name}
                    {!r.onTeam && <span className="text-[11px] font-normal text-gray-400">(left the team)</span>}
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{r.preached}</td>
                <td className="px-3 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{r.saved}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.followUpsDone}</td>
                <td className={`px-3 py-3 text-right tabular-nums ${r.followUpsPending ? "font-semibold text-amber-600" : ""}`}>{r.followUpsPending}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.tasksDone}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.tasksPending}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.outreaches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-white/40">
        Waiting follow-ups and open tasks are as they stand today; everything else is for the period chosen.
      </p>
    </>
  );
}

function Mini({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-1 py-1.5 dark:bg-white/[0.04]" title={hint}>
      <dd className="font-bold tabular-nums text-gray-900 dark:text-white">{value}</dd>
      <dt className="text-[10px] text-gray-400">{label}</dt>
    </div>
  );
}

/** The Evangelism unit roster — being on it is what gives someone access to this page. */
function Roster({ canLead, unitId, team, loading }: { canLead: boolean; unitId: string; team: TeamMember[]; loading: boolean }) {
  const add = useAddMemberToUnit();
  const removeMember = useRemoveMemberFromUnit();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["evangelism"] });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-white/40">The team ({team.length})</h2>
        {canLead && (
          <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
            <UserPlus size={15} aria-hidden="true" /> Add to team
          </button>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {team.map((m) => (
            <li key={m.id} className={`${cardClass} flex items-center gap-3 p-3`}>
              <Avatar name={m.name} photoUrl={m.photoUrl} px={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{m.name}</p>
                <p className="text-[11px] text-gray-400">{m.isLead ? "Unit leader" : m.isAssistant ? "Assistant" : "Member"}</p>
              </div>
              {canLead && !m.isLead && (
                <button type="button" onClick={() => setRemoving(m)} aria-label={`Remove ${m.name}`} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                  <UserMinus size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add to the Evangelism Team" description="They'll be able to open this page when they sign in.">
        <AddMemberForm
          existingMemberIds={team.map((m) => m.id)}
          canPromoteLead={false}
          onCancel={() => setAdding(false)}
          onAdded={async (memberId) => {
            await add.mutateAsync({ unitId, memberId });
            await refresh();
            showToast.success("Added to the team");
            setAdding(false);
          }}
        />
      </Modal>
      <ConfirmDialog
        open={!!removing}
        title={removing ? `Remove ${removing.name} from the team?` : ""}
        description="They'll lose access to the Evangelism page. Their contacts and history stay."
        confirmLabel="Remove"
        tone="danger"
        loading={removeMember.isPending}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await removeMember.mutateAsync({ unitId, memberId: removing.id });
            await refresh();
            setRemoving(null);
          } catch (err) {
            showToast.error(errorText(err, "Couldn't remove"));
          }
        }}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}
