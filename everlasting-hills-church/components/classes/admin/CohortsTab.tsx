"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2, UserPlus, X } from "lucide-react";
import {
  useAddFacilitator,
  useAddSession,
  useCohorts,
  useCreateCohort,
  useRemoveFacilitator,
  useRemoveSession,
  useUpdateCohort,
  type AdminCohort,
} from "@/lib/api/classes";
import { useFamilyDirectory } from "@/lib/api/family";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import RosterClient from "../RosterClient";
import { ClassError, ClassLoading, errorText, formatDate } from "../shared";

const input =
  "w-full rounded-[12px] border border-[var(--color-pink-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-burgundy)]/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-white";

async function attempt(p: Promise<unknown>, ok: string) {
  try {
    await p;
    showToast.success(ok);
    return true;
  } catch (err) {
    showToast.error(errorText(err));
    return false;
  }
}

export default function CohortsTab({ courseId }: { courseId: string }) {
  const { data, isLoading, error, refetch } = useCohorts(courseId);
  const create = useCreateCohort(courseId);
  const [form, setForm] = useState({ name: "", startsOn: "", minSessions: "3" });
  const [openId, setOpenId] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await attempt(
      create.mutateAsync({ name: form.name.trim(), startsOn: form.startsOn, minSessions: Number(form.minSessions) || 0 }),
      "Cohort started. Anyone waiting without a cohort has been placed in it.",
    );
    if (ok) setForm({ name: "", startsOn: "", minSessions: "3" });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="grid gap-3 rounded-[16px] border border-[var(--color-pink-border)] bg-[var(--color-blush)] p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end dark:border-white/10 dark:bg-white/[0.04]">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-[var(--color-ink)] dark:text-white">New cohort</span>
          <input className={input} placeholder="November 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={80} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-[var(--color-ink)] dark:text-white">Starts on</span>
          <input type="date" className={input} value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-[var(--color-ink)] dark:text-white">Sessions needed</span>
          <input type="number" min={0} max={20} className={input} value={form.minSessions} onChange={(e) => setForm({ ...form, minSessions: e.target.value })} />
        </label>
        <button type="submit" disabled={create.isPending} className="cls-btn cls-btn-primary !py-2">
          <Plus className="h-4 w-4" aria-hidden /> Start
        </button>
      </form>

      {isLoading && <ClassLoading />}
      {error && <ClassError error={error} onRetry={() => refetch()} />}
      {data && data.length === 0 && <p className="text-black/60 dark:text-white/60">No cohorts yet. Start one above.</p>}
      {data?.map((c) => (
        <CohortCard key={c.id} cohort={c} courseId={courseId} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />
      ))}
    </div>
  );
}

function CohortCard({ cohort, courseId, open, onToggle }: { cohort: AdminCohort; courseId: string; open: boolean; onToggle: () => void }) {
  const update = useUpdateCohort(courseId);
  const addSession = useAddSession(courseId);
  const removeSession = useRemoveSession(courseId);
  const addFacilitator = useAddFacilitator(courseId);
  const removeFacilitator = useRemoveFacilitator(courseId);
  const [session, setSession] = useState({ title: "", weekNumber: "", startsAt: "", location: "" });
  const [search, setSearch] = useState("");
  const [showRoster, setShowRoster] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const found = useFamilyDirectory(search, 1);
  const people = search.trim().length >= 2 ? (found.data?.items ?? []).slice(0, 6) : [];

  async function onAddSession(e: React.FormEvent) {
    e.preventDefault();
    const ok = await attempt(
      addSession.mutateAsync({
        cohortId: cohort.id,
        title: session.title.trim(),
        weekNumber: session.weekNumber ? Number(session.weekNumber) : undefined,
        startsAt: new Date(session.startsAt).toISOString(),
        location: session.location.trim() || undefined,
      }),
      "Session added",
    );
    if (ok) setSession({ title: "", weekNumber: "", startsAt: "", location: "" });
  }

  return (
    <div className="rounded-[16px] border border-[var(--color-pink-border)] bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span>
          <span className="cls-display block text-2xl text-[var(--color-ink)] dark:text-white">{cohort.name}</span>
          <span className="block text-sm text-black/60 dark:text-white/60">
            Starts {formatDate(cohort.startsOn)} · {cohort._count.Enrollments} learner{cohort._count.Enrollments === 1 ? "" : "s"} · {cohort.Sessions.length} session
            {cohort.Sessions.length === 1 ? "" : "s"} · {cohort.minSessions} needed
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className={`cls-chip ${cohort.status === "CLOSED" ? "!bg-black/5 !text-black/50 dark:!bg-white/10 dark:!text-white/50" : ""}`}>{cohort.status === "OPEN" ? "Open" : "Closed"}</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>

      {open && (
        <div className="space-y-6 border-t border-[var(--color-pink-border)] p-4 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                attempt(
                  update.mutateAsync({ cohortId: cohort.id, status: cohort.status === "OPEN" ? "CLOSED" : "OPEN" }),
                  cohort.status === "OPEN" ? "Cohort closed to new learners" : "Cohort reopened",
                )
              }
              className="cls-btn cls-btn-outline !px-4 !py-2"
            >
              {cohort.status === "OPEN" ? "Close to new learners" : "Reopen"}
            </button>
            <button type="button" onClick={() => setShowRoster(!showRoster)} className="cls-btn cls-btn-primary !px-4 !py-2">
              {showRoster ? "Hide roster" : "Roster and attendance"}
            </button>
          </div>

          {showRoster && <RosterClient cohortId={cohort.id} embedded />}

          {/* Sessions */}
          <section>
            <h3 className="font-semibold text-[var(--color-ink)] dark:text-white">In-person sessions</h3>
            <ul className="mt-2 space-y-2">
              {cohort.Sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-black/75 dark:text-white/75">
                    {s.weekNumber ? `Week ${s.weekNumber}: ` : ""}
                    {s.title} · {formatDate(s.startsAt, true)}
                    {s.location ? ` · ${s.location}` : ""}
                  </span>
                  <button type="button" onClick={() => setRemoving(s.id)} className="text-black/40 hover:text-red-600 dark:text-white/40" aria-label={`Remove ${s.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {cohort.Sessions.length === 0 && <li className="text-sm text-black/50 dark:text-white/50">No sessions yet.</li>}
            </ul>
            <form onSubmit={onAddSession} className="mt-3 grid gap-2 sm:grid-cols-[2fr_80px_1.4fr_1fr_auto]">
              <input className={input} placeholder="Week 1: Welcome to the House" value={session.title} onChange={(e) => setSession({ ...session, title: e.target.value })} required minLength={2} maxLength={120} aria-label="Session title" />
              <input className={input} type="number" min={1} max={12} placeholder="Week" value={session.weekNumber} onChange={(e) => setSession({ ...session, weekNumber: e.target.value })} aria-label="Week number" />
              <input className={input} type="datetime-local" value={session.startsAt} onChange={(e) => setSession({ ...session, startsAt: e.target.value })} required aria-label="Date and time" />
              <input className={input} placeholder="Room" value={session.location} onChange={(e) => setSession({ ...session, location: e.target.value })} maxLength={120} aria-label="Location" />
              <button type="submit" disabled={addSession.isPending} className="cls-btn cls-btn-outline !px-4 !py-2">Add</button>
            </form>
          </section>

          {/* Facilitators */}
          <section>
            <h3 className="font-semibold text-[var(--color-ink)] dark:text-white">Facilitators</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {cohort.Facilitators.map(({ Member: m }) => (
                <span key={m.id} className="cls-chip">
                  {m.firstName} {m.lastName}
                  <button
                    type="button"
                    onClick={() => attempt(removeFacilitator.mutateAsync({ cohortId: cohort.id, memberId: m.id }), "Facilitator removed")}
                    aria-label={`Remove ${m.firstName}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {cohort.Facilitators.length === 0 && <span className="text-sm text-black/50 dark:text-white/50">None yet.</span>}
            </div>
            <div className="relative mt-3 max-w-sm">
              <input className={input} placeholder="Add a facilitator: type a name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Find a member" />
              {people.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-[12px] border border-[var(--color-pink-border)] bg-white shadow-lg dark:border-white/15 dark:bg-[#141414]">
                  {people.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (await attempt(addFacilitator.mutateAsync({ cohortId: cohort.id, memberId: p.id }), `${p.firstName} added`)) setSearch("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-blush)] dark:text-white dark:hover:bg-white/[0.06]"
                      >
                        <UserPlus className="h-4 w-4 text-[var(--color-burgundy)]" aria-hidden />
                        {p.firstName} {p.lastName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={!!removing}
        tone="danger"
        title="Remove this session?"
        description="Attendance marked for it is removed too."
        confirmLabel="Remove"
        loading={removeSession.isPending}
        onConfirm={async () => {
          if (removing && (await attempt(removeSession.mutateAsync(removing), "Session removed"))) setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
