"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, ChevronRight, Map, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Drawer from "@/components/ui/overlay/Drawer";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { useDeleteOutreach, useOutreach, useOutreaches, type Outreach } from "@/lib/api/evangelism";
import { ContactList } from "./ContactList";
import { OutreachDialog } from "./OutreachDialog";
import { EmptyState, ErrorNote, Initials, Loading, Panel, SectionHeader, cardClass, dangerButton, primaryButton, secondaryButton } from "./bits";
import { errorText, fmtDate } from "./labels";

export function OutreachesTab({ canLead, onOpenContact }: { canLead: boolean; onOpenContact: (id: string) => void }) {
  const q = useOutreaches();
  const [editing, setEditing] = useState<Outreach | null | "new">(null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorNote>{errorText(q.error, "Couldn't load outreaches.")}</ErrorNote>;
  const { outreaches, personal } = q.data;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Outreaches"
        count={outreaches.length}
        description={
          <>
            Plus personal evangelism: {personal.reached} reached, {personal.saved} saved
          </>
        }
        actions={
          canLead ? (
            <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
              <Plus size={16} aria-hidden="true" /> New outreach
            </button>
          ) : null
        }
      />

      {outreaches.length === 0 ? (
        <div className={cardClass}>
          <EmptyState
            icon={Map}
            title="No outreaches yet"
            body={canLead ? "Create one before you go out, so the team can pick it on the form." : "Your leader will add outreaches here."}
          />
        </div>
      ) : (
        <>
          <Comparison outreaches={outreaches} />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {outreaches.map((o) => (
              <li key={o.id}>
                <OutreachCard outreach={o} onOpen={() => setOpenId(o.id)} />
              </li>
            ))}
          </ul>
        </>
      )}

      <OutreachDialog open={editing !== null} onClose={() => setEditing(null)} outreach={editing === "new" ? null : editing} />
      <OutreachDrawer id={openId} canLead={canLead} onClose={() => setOpenId(null)} onEdit={(o) => setEditing(o)} onOpenContact={onOpenContact} />
    </div>
  );
}

function OutreachCard({ outreach: o, onOpen }: { outreach: Outreach; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${cardClass} group flex h-full w-full flex-col text-left transition-all hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold leading-snug text-gray-900 dark:text-white">{o.name}</p>
          {o.active ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> On the form
            </span>
          ) : (
            <ChevronRight size={16} className="mt-0.5 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" aria-hidden="true" />
          )}
        </div>
        <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-white/50">
          <p className="flex items-center gap-2">
            <CalendarDays size={14} className="shrink-0 text-gray-400" aria-hidden="true" /> {fmtDate(o.date)}
          </p>
          {o.location && (
            <p className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-gray-400" aria-hidden="true" /> <span className="truncate">{o.location}</span>
            </p>
          )}
        </div>
        {o.workers.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-1">
              {o.workers.slice(0, 5).map((w) => (
                <span key={w.id} title={w.name} className="rounded-full ring-2 ring-white dark:ring-[#161618]">
                  <Initials name={w.name} size={26} single />
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-white/45">
              {o.workers.length} {o.workers.length === 1 ? "worker" : "workers"}
            </span>
          </div>
        )}
      </div>
      <dl className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
        <Stat label="Reached" value={o.reached} />
        <Stat label="Saved" value={o.saved} strong />
        <Stat label="Students" value={o.students} />
      </dl>
    </button>
  );
}

function Stat({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="px-3 py-3 text-center">
      <dd className={`text-lg font-bold tabular-nums ${strong ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>{value}</dd>
      <dt className="text-xs text-gray-500 dark:text-white/45">{label}</dt>
    </div>
  );
}

/** Saved (and reached) per outreach, oldest to newest, to see the trend. */
function Comparison({ outreaches }: { outreaches: Outreach[] }) {
  const data = [...outreaches]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10)
    .map((o) => ({
      name: fmtDate(o.date).replace(/ \d{4}$/, ""),
      full: o.name,
      Saved: o.saved,
      Reached: o.reached,
    }));
  if (data.length < 2) return null;
  return (
    <Panel
      title="Saved per outreach"
      description="The last outreaches, oldest to newest"
      actions={
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#E9C3CC]" aria-hidden="true" /> Reached
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#87102C]" aria-hidden="true" /> Saved
          </span>
        </div>
      }
    >
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={6} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(135,16,44,0.05)" }}
              labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ""}
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            />
            <Bar dataKey="Reached" fill="#E9C3CC" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            <Bar dataKey="Saved" fill="#87102C" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function OutreachDrawer({
  id,
  canLead,
  onClose,
  onEdit,
  onOpenContact,
}: {
  id: string | null;
  canLead: boolean;
  onClose: () => void;
  onEdit: (o: Outreach) => void;
  onOpenContact: (id: string) => void;
}) {
  const q = useOutreach(id);
  const remove = useDeleteOutreach();
  const [confirm, setConfirm] = useState(false);
  const o = q.data;

  return (
    <Drawer open={!!id} onClose={onClose} maxWidth="xl">
      {q.isLoading ? (
        <Loading />
      ) : !o ? (
        <div className="p-6 pt-16">
          <ErrorNote>{errorText(q.error, "Couldn't load this outreach.")}</ErrorNote>
        </div>
      ) : (
        <div className="pb-10">
          <header className="border-b border-gray-100 px-5 pb-6 pt-14 dark:border-white/[0.06] sm:px-7">
            <p className="text-xs font-medium text-gray-500 dark:text-white/45">Outreach</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{o.name}</h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} aria-hidden="true" /> {fmtDate(o.date)}
              </span>
              {o.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden="true" /> {o.location}
                </span>
              )}
            </p>
            {o.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-white/75">{o.description}</p>}
            {canLead && (
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => onEdit(o)} className={secondaryButton}>
                  <Pencil size={15} aria-hidden="true" /> Edit
                </button>
                <button type="button" onClick={() => setConfirm(true)} className={dangerButton}>
                  <Trash2 size={15} aria-hidden="true" /> Delete
                </button>
              </div>
            )}
          </header>

          <div className="space-y-6 px-5 pt-6 sm:px-7">
            <dl className={`${cardClass} grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/[0.06]`}>
              <Stat label="Reached" value={o.reached} />
              <Stat label="Saved" value={o.saved} strong />
              <Stat label="Students" value={o.students} />
            </dl>

            <Panel title="By worker" flush>
              {o.byWorker.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500">No contacts recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 text-left text-xs text-gray-500 dark:bg-white/[0.02] dark:text-white/45">
                      <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">Worker</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Reached</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Saved</th>
                      <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-medium">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {o.byWorker.map((w) => (
                      <tr key={w.id ?? w.name}>
                        <td className="py-3 pl-5 pr-3">
                          <span className="flex items-center gap-2.5 font-medium text-gray-900 dark:text-white">
                            <Initials name={w.name} size={26} /> {w.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-white/75">{w.reached}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{w.saved}</td>
                        <td className="py-3 pl-3 pr-5 text-right tabular-nums text-gray-700 dark:text-white/75">{w.students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <section className="space-y-3">
              <SectionHeader title="People reached" count={o.contacts.length} />
              {o.contacts.length === 0 ? (
                <p className="text-sm text-gray-500">No one recorded against this outreach yet.</p>
              ) : (
                <ContactList rows={o.contacts} onOpen={onOpenContact} showOutreach={false} layout="list" />
              )}
            </section>
          </div>

          <ConfirmDialog
            open={confirm}
            title={`Delete ${o.name}?`}
            description="Its contacts are kept, as personal evangelism."
            confirmLabel="Delete outreach"
            tone="danger"
            loading={remove.isPending}
            onConfirm={async () => {
              try {
                await remove.mutateAsync(o.id);
                setConfirm(false);
                onClose();
              } catch (err) {
                showToast.error(errorText(err, "Couldn't delete"));
              }
            }}
            onCancel={() => setConfirm(false)}
          />
        </div>
      )}
    </Drawer>
  );
}
