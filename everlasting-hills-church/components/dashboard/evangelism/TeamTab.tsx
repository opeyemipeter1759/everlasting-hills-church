"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy, UserMinus, UserPlus, Users } from "lucide-react";
import AddMemberForm from "@/components/dashboard/admin/unit/AddMemberForm";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import { useAddMemberToUnit, useRemoveMemberFromUnit } from "@/lib/api/people";
import { useEvangelismTeam, usePerformance, type PerformanceRange, type PerformanceRow, type TeamMember } from "@/lib/api/evangelism";
import { EmptyState, ErrorNote, Initials, Loading, Panel, SectionHeader, cardClass, iconButton, primaryButton } from "./bits";
import { errorText } from "./labels";

const RANGES: { value: PerformanceRange; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

const MEDAL = ["bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", "bg-gray-200 text-gray-700 dark:bg-white/15 dark:text-white/80", "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"];

export function TeamTab({ canLead, unitId }: { canLead: boolean; unitId: string }) {
  const [range, setRange] = useState<PerformanceRange>("month");
  const perf = usePerformance(range);
  const team = useEvangelismTeam();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeader
          title="Leaderboard"
          description="Who preached to and won the most — and how follow-up and tasks are going."
          actions={
            <div className="inline-flex h-10 items-center rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]" role="radiogroup" aria-label="Period">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={range === r.value}
                  onClick={() => setRange(r.value)}
                  className={`h-8 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors ${
                    range === r.value ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-white/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        />

        {perf.isLoading ? (
          <Loading />
        ) : perf.isError ? (
          <ErrorNote>{errorText(perf.error, "Couldn't load the figures.")}</ErrorNote>
        ) : (perf.data ?? []).length === 0 ? (
          <div className={cardClass}>
            <EmptyState icon={Trophy} title="Nothing to show yet" body="Figures appear once the team starts recording contacts." />
          </div>
        ) : (
          <Leaderboard rows={perf.data ?? []} />
        )}
      </section>

      <Roster canLead={canLead} unitId={unitId} team={team.data ?? []} loading={team.isLoading} />
    </div>
  );
}

function Rank({ i }: { i: number }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
        MEDAL[i] ?? "text-gray-400 dark:text-white/40"
      }`}
    >
      {i + 1}
    </span>
  );
}

function Leaderboard({ rows }: { rows: PerformanceRow[] }) {
  return (
    <div className="space-y-2">
      <ul className={`${cardClass} divide-y divide-gray-100 overflow-hidden dark:divide-white/[0.06] md:hidden`}>
        {rows.map((r, i) => (
          <li key={r.id} className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Rank i={i} />
              <Initials name={r.name} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
                <p className="text-xs text-gray-500 dark:text-white/45">
                  {r.preached} preached to{!r.onTeam ? " · left the team" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{r.saved}</p>
                <p className="text-[11px] text-gray-500">saved</p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 pl-9 text-center">
              <Mini label="Follow-ups" value={r.followUpsDone} sub={r.followUpsPending ? `${r.followUpsPending} waiting` : "none waiting"} warn={r.followUpsPending > 0} />
              <Mini label="Tasks done" value={r.tasksDone} sub={r.tasksPending ? `${r.tasksPending} open` : "none open"} />
              <Mini label="Outreaches" value={r.outreaches} />
            </dl>
          </li>
        ))}
      </ul>

      <div className={`${cardClass} hidden overflow-x-auto md:block`}>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-xs text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-white/45">
              <th scope="col" className="w-14 py-3 pl-5 text-left font-medium">#</th>
              <th scope="col" className="px-3 py-3 text-left font-medium">Worker</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Preached to</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Saved</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Follow-ups done</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Waiting</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Tasks done</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Open</th>
              <th scope="col" className="py-3 pl-3 pr-5 text-right font-medium">Outreaches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {rows.map((r, i) => (
              <tr key={r.id} className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                <td className="py-3 pl-5">
                  <Rank i={i} />
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2.5 font-medium text-gray-900 dark:text-white">
                    <Initials name={r.name} size={30} />
                    <span>
                      {r.name}
                      {!r.onTeam && <span className="block text-xs font-normal text-gray-400">Left the team</span>}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-white/75">{r.preached}</td>
                <td className="px-3 py-3 text-right text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{r.saved}</td>
                <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-white/75">{r.followUpsDone}</td>
                <td className={`px-3 py-3 text-right tabular-nums ${r.followUpsPending ? "font-semibold text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>{r.followUpsPending}</td>
                <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-white/75">{r.tasksDone}</td>
                <td className={`px-3 py-3 text-right tabular-nums ${r.tasksPending ? "text-gray-700 dark:text-white/75" : "text-gray-400"}`}>{r.tasksPending}</td>
                <td className="py-3 pl-3 pr-5 text-right tabular-nums text-gray-700 dark:text-white/75">{r.outreaches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-white/40">
        &ldquo;Waiting&rdquo; follow-ups and open tasks are as they stand today; everything else is for the period chosen.
      </p>
    </div>
  );
}

function Mini({ label, value, sub, warn = false }: { label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-2 dark:bg-white/[0.04]">
      <dd className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{value}</dd>
      <dt className="text-[11px] text-gray-500 dark:text-white/45">{label}</dt>
      {sub && <p className={`text-[10px] ${warn ? "font-medium text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>{sub}</p>}
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
    <Panel
      title="The team"
      count={team.length}
      description="Everyone here can open this page when they sign in."
      flush
      actions={
        canLead ? (
          <button type="button" onClick={() => setAdding(true)} className={`${primaryButton} h-9 px-3`}>
            <UserPlus size={15} aria-hidden="true" /> <span className="hidden xs:inline">Add member</span>
          </button>
        ) : null
      }
    >
      {loading ? (
        <Loading />
      ) : team.length === 0 ? (
        <EmptyState icon={Users} title="Nobody on the team yet" />
      ) : (
        <ul className="grid divide-y divide-gray-100 py-1 dark:divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
          {team.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <Initials name={m.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                <p className="text-xs text-gray-500 dark:text-white/45">{m.isLead ? "Unit leader" : m.isAssistant ? "Assistant" : "Member"}</p>
              </div>
              {canLead && !m.isLead && (
                <button
                  type="button"
                  onClick={() => setRemoving(m)}
                  aria-label={`Remove ${m.name}`}
                  title="Remove from team"
                  className={`${iconButton} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10`}
                >
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
    </Panel>
  );
}
