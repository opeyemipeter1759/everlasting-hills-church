"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Edit3, Map, MapPin, Plus, Trash2, Users } from "lucide-react";
import Drawer from "@/components/ui/overlay/Drawer";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { useDeleteOutreach, useOutreach, useOutreaches, type Outreach } from "@/lib/api/evangelism";
import { ContactList } from "./ContactList";
import { OutreachDialog } from "./OutreachDialog";
import { EmptyState, ErrorNote, Loading, cardClass, primaryButton, secondaryButton } from "./bits";
import { errorText, fmtDate } from "./labels";

export function OutreachesTab({ canLead, onOpenContact }: { canLead: boolean; onOpenContact: (id: string) => void }) {
  const q = useOutreaches();
  const [editing, setEditing] = useState<Outreach | null | "new">(null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorNote>{errorText(q.error, "Couldn't load outreaches.")}</ErrorNote>;
  const { outreaches, personal } = q.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-white/50">
          Personal evangelism: <strong className="text-gray-800 dark:text-white/90">{personal.reached}</strong> reached ·{" "}
          <strong className="text-gray-800 dark:text-white/90">{personal.saved}</strong> saved
        </p>
        {canLead && (
          <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
            <Plus size={15} aria-hidden="true" /> New outreach
          </button>
        )}
      </div>

      {outreaches.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No outreaches yet"
          body={canLead ? "Create one before you go out, so the team can pick it on the form." : "Your leader will add outreaches here."}
        />
      ) : (
        <>
          <Comparison outreaches={outreaches} />
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {outreaches.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setOpenId(o.id)} className={`${cardClass} w-full p-4 text-left transition-colors hover:border-[#87102C]/30`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 dark:text-white">{o.name}</p>
                    {o.active && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        On form
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500 dark:text-white/50">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} aria-hidden="true" /> {fmtDate(o.date)}
                    </span>
                    {o.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} aria-hidden="true" /> {o.location}
                      </span>
                    )}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Reached" value={o.reached} />
                    <Stat label="Saved" value={o.saved} strong />
                    <Stat label="Students" value={o.students} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <OutreachDialog open={editing !== null} onClose={() => setEditing(null)} outreach={editing === "new" ? null : editing} />
      <OutreachDrawer
        id={openId}
        canLead={canLead}
        onClose={() => setOpenId(null)}
        onEdit={(o) => setEditing(o)}
        onOpenContact={onOpenContact}
      />
    </div>
  );
}

function Stat({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-2 dark:bg-white/[0.04]">
      <p className={`text-lg font-bold tabular-nums ${strong ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}

/** Saved (and reached) per outreach, oldest to newest, to see how the team is growing. */
function Comparison({ outreaches }: { outreaches: Outreach[] }) {
  const data = [...outreaches]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map((o) => ({
      name: o.name.length > 18 ? `${o.name.slice(0, 17)}…` : o.name,
      date: fmtDate(o.date),
      Saved: o.saved,
      Reached: o.reached,
    }));
  if (data.length < 2) return null;
  return (
    <div className={`${cardClass} p-4`}>
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">Saved per outreach</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-white/10" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string } | undefined)?.date ?? ""} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Reached" fill="#E5B7C1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saved" fill="#87102C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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
        <div className="p-6 pt-14">
          <ErrorNote>{errorText(q.error, "Couldn't load this outreach.")}</ErrorNote>
        </div>
      ) : (
        <div className="space-y-6 px-5 pb-10 pt-14 sm:px-6">
          <header>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{o.name}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
              {fmtDate(o.date)}
              {o.location ? ` · ${o.location}` : ""}
            </p>
            {o.description && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-white/75">{o.description}</p>}
            {canLead && (
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => onEdit(o)} className={secondaryButton}>
                  <Edit3 size={15} aria-hidden="true" /> Edit
                </button>
                <button type="button" onClick={() => setConfirm(true)} className={`${secondaryButton} text-rose-600 dark:text-rose-400`}>
                  <Trash2 size={15} aria-hidden="true" /> Delete
                </button>
              </div>
            )}
          </header>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Reached" value={o.reached} />
            <Stat label="Saved" value={o.saved} strong />
            <Stat label="Students" value={o.students} />
          </div>

          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Team who went</h3>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-gray-700 dark:text-white/80">
              <Users size={14} className="text-gray-400" aria-hidden="true" />
              {o.workers.length ? o.workers.map((w) => w.name).join(", ") : "Not recorded"}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">By worker</h3>
            {o.byWorker.length === 0 ? (
              <p className="text-sm text-gray-400">No contacts recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:border-white/10">
                      <th className="px-3 py-2">Worker</th>
                      <th className="px-3 py-2 text-right">Reached</th>
                      <th className="px-3 py-2 text-right">Saved</th>
                      <th className="px-3 py-2 text-right">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.byWorker.map((w) => (
                      <tr key={w.id ?? w.name} className="border-b border-gray-50 last:border-0 dark:border-white/[0.04]">
                        <td className="px-3 py-2 font-semibold text-gray-800 dark:text-white/90">{w.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{w.reached}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{w.saved}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{w.students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Contacts ({o.contacts.length})</h3>
            {o.contacts.length === 0 ? (
              <p className="text-sm text-gray-400">No one recorded against this outreach yet.</p>
            ) : (
              <ContactList rows={o.contacts} onOpen={onOpenContact} showOutreach={false} />
            )}
          </section>

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
