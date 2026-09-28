"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Flag,
  GraduationCap,
  History,
  LayoutList,
  ListChecks,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Drawer from "@/components/ui/overlay/Drawer";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import {
  EVANGELISM_CONTACTS_KEY,
  EVANGELISM_NOTES_BASE,
  EVANGELISM_NOTE_KIND,
  useAssignContact,
  useDeleteContact,
  useEvangelismContact,
  useEvangelismTeam,
  useLogContactAction,
  useReviewContact,
  type ContactActivity,
  type ContactDetail,
  type ContactStatus,
  type ReviewOutcome,
} from "@/lib/api/evangelism";
import { ActivityThread } from "@/components/dashboard/follow-up/ActivityThread";
import { Select } from "@/components/ui/select";
import { ContactDialog } from "./ContactDialog";
import { TaskDialog } from "./TaskDialog";
import { ErrorNote, FlagBadge, Initials, Loading, SavedBadge, StatusBadge, cardClass, iconButton, primaryButton, secondaryButton, selectClass } from "./bits";
import {
  ACTION_LABEL,
  NEXT_ACTION_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  TASK_STATUS_LABEL,
  TASK_TYPE_LABEL,
  displayPhone,
  errorText,
  fmtDate,
  fmtDateTime,
  todayLagos,
} from "./labels";

/** One contact's profile: who they are, where they are in follow-up, and everything done so far. */
export function ContactDrawer({ contactId, canLead, onClose }: { contactId: string | null; canLead: boolean; onClose: () => void }) {
  const q = useEvangelismContact(contactId);
  return (
    <Drawer open={!!contactId} onClose={onClose} maxWidth="xl">
      {q.isLoading ? (
        <Loading />
      ) : q.isError || !q.data ? (
        <div className="p-6 pt-16">
          <ErrorNote>{errorText(q.error, "Couldn't load this contact.")}</ErrorNote>
        </div>
      ) : (
        <Profile contact={q.data} canLead={canLead} onClose={onClose} />
      )}
    </Drawer>
  );
}

type ProfileTab = "overview" | "activity";

function Profile({ contact: c, canLead, onClose }: { contact: ContactDetail; canLead: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const remove = useDeleteContact();
  const needsReview = c.window.flag === "REVIEW";
  const follower = c.assignee ?? { id: c.worker.id, name: c.worker.name, photoUrl: c.worker.photoUrl };

  async function doDelete() {
    try {
      await remove.mutateAsync(c.id);
      showToast.success(`${c.name} deleted`);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      showToast.error(errorText(err, "Couldn't delete"));
    }
  }

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutList },
    { id: "activity", label: "Activity", icon: History, count: c.activities.length + c.tasks.length },
  ];

  return (
    <div className="flex min-h-full flex-col">
      {/* Header: a soft wash of the church colour, the person, and where they stand. */}
      <header className="bg-gradient-to-b from-[#FFF1F4] via-[#FFF8F9] to-white px-5 pb-5 pt-5 dark:from-[#87102C]/25 dark:via-[#87102C]/10 dark:to-transparent sm:px-7">
        <div className="mr-10 flex h-8 items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#87102C]/70 dark:text-[#FFB3C1]/70">Evangelism contact</p>
          {canLead && (
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => setEditing(true)} aria-label="Edit contact" title="Edit" className={iconButton}>
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete contact"
                title="Delete"
                className={`${iconButton} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="rounded-full ring-4 ring-white dark:ring-[#161618]">
            <Initials name={c.name} size={64} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{c.name}</h2>
            <p className="mt-0.5 text-sm tabular-nums text-gray-500 dark:text-white/55">{displayPhone(c.phone)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <SavedBadge status={c.savedStatus} />
          <StatusBadge status={c.status} />
          {c.window.flag && <FlagBadge flag={c.window.flag} />}
          {c.isStudent && (
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white px-2.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">
              <GraduationCap size={12} aria-hidden="true" /> Student
            </span>
          )}
        </div>

        {/* Three facts at a glance. */}
        <dl className="mt-5 grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)] ring-1 ring-gray-200/70 dark:divide-white/[0.06] dark:bg-[#1c1c1e] dark:ring-white/10">
          <div className="min-w-0 px-3.5 py-3">
            <dt className="text-[11px] font-medium text-gray-500 dark:text-white/45">Follow-up</dt>
            <dd className="mt-1">
              {c.window.open ? (
                <>
                  <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    Day {c.window.day}
                    <span className="font-normal text-gray-400"> / {c.window.of}</span>
                  </span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <span
                      className={`block h-full rounded-full ${
                        c.window.flag === "OVERDUE" ? "bg-rose-500" : c.window.flag === "DUE" ? "bg-amber-500" : c.window.flag === "REVIEW" ? "bg-violet-500" : "bg-[#87102C]"
                      }`}
                      style={{ width: `${Math.max(4, Math.round((c.window.day / c.window.of) * 100))}%` }}
                    />
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-500 dark:text-white/50">Finished</span>
              )}
            </dd>
          </div>
          <div className="min-w-0 px-3.5 py-3">
            <dt className="text-[11px] font-medium text-gray-500 dark:text-white/45">Following up</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white" title={follower.name}>
              {follower.name.split(" ")[0]}
            </dd>
          </div>
          <div className="min-w-0 px-3.5 py-3">
            <dt className="text-[11px] font-medium text-gray-500 dark:text-white/45">Feedback</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {c.feedback.total} {c.feedback.total === 1 ? "message" : "messages"}
            </dd>
          </div>
        </dl>
      </header>

      {/* Tabs, pinned while the panel scrolls. */}
      <div role="tablist" aria-label="Contact sections" className="sticky top-0 z-10 grid grid-cols-2 border-b sm:flex sm:gap-1 border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-[#161618] sm:px-6">
        {tabs.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`relative flex h-12 items-center justify-center gap-2 px-1 text-sm font-medium transition-colors sm:justify-start sm:px-3 ${
                selected ? "text-[#87102C] dark:text-[#FFB3C1]" : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
              }`}
            >
              <t.icon size={16} aria-hidden="true" className={`hidden sm:block ${selected ? "" : "text-gray-400"}`} />
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    selected ? "bg-[#87102C] text-white dark:bg-[#FFB3C1] dark:text-[#5E0A1E]" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
                  }`}
                >
                  {t.count}
                </span>
              )}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#87102C] dark:bg-[#FFB3C1] ${selected ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="flex-1 space-y-6 bg-gray-50/60 px-5 py-6 dark:bg-transparent sm:px-7">
        {tab === "overview" && (
          <>
            {canLead && needsReview && <ReviewPanel contact={c} />}

            <FollowingUp contact={c} canLead={canLead} />

            {c.window.open && <StatusControl contact={c} />}

            <Section title="Details">
              <dl className={`${cardClass} divide-y divide-gray-100 dark:divide-white/[0.06]`}>
                <Fact icon={MapPin} label="Address" value={c.address} />
                <Fact icon={Flag} label="Outreach" value={c.outreach?.name ?? "Personal evangelism"} />
                <Fact icon={CalendarDays} label="Date of contact" value={fmtDate(c.contactDate)} />
                <Fact icon={UserRound} label="Preached to by" value={c.worker.name} />
                <Fact icon={ArrowRight} label="Next action" value={c.nextAction ? NEXT_ACTION_LABEL[c.nextAction] : "—"} />
                {c.isStudent && <Fact icon={GraduationCap} label="School" value={[c.school, c.level].filter(Boolean).join(" · ") || "—"} />}
                {c.status === "CALL_BACK" && c.callBackAt && <Fact icon={CalendarDays} label="Call back on" value={fmtDate(c.callBackAt)} />}
              </dl>
            </Section>

            {c.discussion && (
              <Section title="What was discussed">
                <blockquote className={`${cardClass} border-l-4 border-l-[#87102C] p-4 text-sm leading-relaxed text-gray-800 dark:border-l-[#FFB3C1] dark:text-white/85 sm:p-5`}>
                  <p className="whitespace-pre-wrap break-words">{c.discussion}</p>
                </blockquote>
              </Section>
            )}

            {/* Feedback is how the team records each follow-up: a thread, as on Follow Up. */}
            <div className={`${cardClass} px-4 pb-2 sm:px-5`}>
              <ActivityThread
                person={{ kind: EVANGELISM_NOTE_KIND, id: c.id, name: c.name }}
                title="Feedback"
                notesBase={EVANGELISM_NOTES_BASE}
                listKey={EVANGELISM_CONTACTS_KEY}
              />
            </div>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500 dark:text-white/40">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
              <span>
                {c.consent ? "Agreed to be contacted by the church." : "Did not confirm they agree to be contacted — go gently."} Recorded{" "}
                {c.source === "FORM" ? "on the outreach form" : `by ${c.createdBy ?? "the team"}`}
                {c.updatedBy ? `; last updated by ${c.updatedBy}, ${fmtDateTime(c.updatedAt)}` : ""}.
              </span>
            </p>
          </>
        )}

        {tab === "activity" && (
          <>
            <Section
              title="Tasks"
              count={c.tasks.length}
              action={
                canLead ? (
                  <button
                    type="button"
                    onClick={() => setAssigning(true)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
                  >
                    <Plus size={15} aria-hidden="true" /> Assign a task
                  </button>
                ) : null
              }
            >
              {c.tasks.length === 0 ? (
                <p className={`${cardClass} px-4 py-5 text-center text-sm text-gray-500 dark:text-white/45`}>No tasks for this contact.</p>
              ) : (
                <ul className={`${cardClass} divide-y divide-gray-100 dark:divide-white/[0.06]`}>
                  {c.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <ListChecks size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${t.status === "DONE" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>{t.title}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-white/45">
                          {TASK_TYPE_LABEL[t.type]} · {t.assignees.map((a) => a.name).join(", ")}
                          {t.dueAt ? ` · due ${fmtDate(t.dueAt)}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${t.overdue ? "text-rose-600" : "text-gray-500 dark:text-white/50"}`}>
                        {t.overdue ? "Overdue" : TASK_STATUS_LABEL[t.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="History" count={c.activities.length}>
              <div className={`${cardClass} p-4 sm:p-5`}>
                <HistoryList items={c.activities} />
              </div>
            </Section>

            {c.testimonies.length > 0 && (
              <Section title="Testimonies" count={c.testimonies.length}>
                <ul className={`${cardClass} divide-y divide-gray-100 dark:divide-white/[0.06]`}>
                  {c.testimonies.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white/90">{t.title}</span>
                      <span className="shrink-0 text-xs text-gray-500">{t.approved ? "Approved to share" : fmtDate(t.date)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>

      <ContactDialog open={editing} onClose={() => setEditing(false)} contact={c} />
      <TaskDialog open={assigning} onClose={() => setAssigning(false)} contact={{ id: c.id, name: c.name }} defaultAssigneeId={follower.id} />
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${c.name}?`}
        description="Their follow-up history goes too. Tasks about them stay, without the link. This cannot be undone."
        confirmLabel="Delete contact"
        tone="danger"
        loading={remove.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/**
 * Where they are in follow-up (New → Invited → Attended…), changed in one
 * step. It's what the 30-day tracking reads; the conversation itself goes in
 * the feedback thread below.
 */
function StatusControl({ contact: c }: { contact: ContactDetail }) {
  const log = useLogContactAction();
  const [pending, setPending] = useState<ContactStatus | null>(null);
  const [callBack, setCallBack] = useState("");

  async function save(status: ContactStatus, callBackOn?: string) {
    try {
      await log.mutateAsync({
        id: c.id,
        status,
        ...(callBackOn ? { callBackAt: new Date(`${callBackOn}T09:00:00+01:00`).toISOString() } : {}),
      });
      showToast.success(`Status: ${STATUS_LABEL[status]}`);
      setPending(null);
      setCallBack("");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't update the status"));
    }
  }

  function choose(value: string) {
    const status = value as ContactStatus;
    if (status === c.status) return;
    // A call-back needs a date before it can be saved.
    if (status === "CALL_BACK") setPending(status);
    else void save(status);
  }

  return (
    <section className={`${cardClass} p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-white/45">Status</p>
          <div className="mt-1">
            <StatusBadge status={c.status} />
          </div>
        </div>
        <div className="sm:w-64">
          <Select
            aria-label="Change status"
            className={selectClass}
            value={pending ?? c.status}
            disabled={log.isPending}
            onChange={choose}
            options={STATUS_ORDER.map((k) => ({ value: k, label: STATUS_LABEL[k] }))}
          />
        </div>
      </div>
      {pending === "CALL_BACK" && (
        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06] sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-white/60">Call back on</span>
            <input
              type="date"
              value={callBack}
              min={todayLagos()}
              onChange={(e) => setCallBack(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPending(null)} className={secondaryButton}>
              Cancel
            </button>
            <button type="button" disabled={!callBack || log.isPending} onClick={() => save("CALL_BACK", callBack)} className={primaryButton}>
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Who is following this person up: the worker who preached, unless a leader
 * has asked someone else. Leaders can assign anyone on the team, or hand it
 * back to the worker.
 */
function FollowingUp({ contact: c, canLead }: { contact: ContactDetail; canLead: boolean }) {
  const team = useEvangelismTeam(canLead);
  const assign = useAssignContact();
  const [picking, setPicking] = useState(false);
  const person = c.assignee ?? { id: c.worker.id, name: c.worker.name, photoUrl: c.worker.photoUrl };

  async function choose(value: string) {
    const assigneeMemberId = value === "" ? null : value;
    try {
      await assign.mutateAsync({ id: c.id, assigneeMemberId });
      showToast.success(assigneeMemberId ? "Assigned — they've been told" : `Handed back to ${c.worker.name}`);
      setPicking(false);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't assign"));
    }
  }

  return (
    <section className={`${cardClass} p-4 sm:p-5`}>
      <div className="flex items-center gap-3">
        <Initials name={person.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-white/45">Following up</p>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{person.name}</p>
          <p className="text-xs text-gray-500 dark:text-white/45">{c.assignee ? `Assigned · preached to by ${c.worker.name}` : "The worker who preached to them"}</p>
        </div>
        {canLead && !picking && (
          <button type="button" onClick={() => setPicking(true)} className={`${secondaryButton} h-9 px-3`}>
            {c.assignee ? "Reassign" : "Assign"}
          </button>
        )}
      </div>
      {canLead && picking && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Select
              aria-label="Assign to"
              className={selectClass}
              value={c.assignee?.id ?? ""}
              disabled={assign.isPending}
              onChange={choose}
              placeholder={team.isLoading ? "Loading the team…" : "Choose someone"}
              options={[
                { value: "", label: `${c.worker.name} (preached to them)` },
                ...(team.data ?? [])
                  .filter((m) => m.id !== c.worker.id)
                  .map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>
          <button type="button" onClick={() => setPicking(false)} className={`${secondaryButton} h-10`}>
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}

function ReviewPanel({ contact: c }: { contact: ContactDetail }) {
  const review = useReviewContact();
  const [note, setNote] = useState("");
  async function decide(outcome: ReviewOutcome) {
    try {
      await review.mutateAsync({ id: c.id, outcome, ...(outcome === "EXTENDED" ? { extendDays: 30 } : {}), note: note.trim() || undefined });
      showToast.success(outcome === "EXTENDED" ? "Follow-up extended by 30 days" : outcome === "HANDED_OVER" ? "Marked as handed over" : "Follow-up closed");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't save"));
    }
  }
  const option =
    "inline-flex h-10 items-center justify-center rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-800 transition-colors hover:bg-violet-100 disabled:opacity-50 dark:border-violet-500/30 dark:bg-transparent dark:text-violet-200";
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-500/30 dark:bg-violet-500/10 sm:p-5">
      <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">The 30 days are up — what next?</p>
      <p className="mt-0.5 text-sm text-violet-800/70 dark:text-violet-200/70">Where they are now: {STATUS_LABEL[c.status]}.</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        aria-label="Review note"
        className="mt-3 h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 dark:border-violet-500/30 dark:bg-white/5 dark:text-white"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button type="button" disabled={review.isPending} onClick={() => decide("HANDED_OVER")} className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-700 px-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
          Handed over
        </button>
        <button type="button" disabled={review.isPending} onClick={() => decide("EXTENDED")} className={option}>
          Extend 30 days
        </button>
        <button type="button" disabled={review.isPending} onClick={() => decide("CLOSED")} className={option}>
          Close
        </button>
      </div>
      <p className="mt-2 text-xs text-violet-800/60 dark:text-violet-200/50">&ldquo;Handed over&rdquo; records that the Follow-Up team has taken them on.</p>
    </div>
  );
}

function HistoryList({ items }: { items: ContactActivity[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-500">Nothing logged yet.</p>;
  return (
    <ol className="relative ml-3 space-y-5 border-l border-gray-200 pl-6 dark:border-white/10">
      {items.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[31px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-[#87102C] dark:bg-[#161618] dark:ring-[#FFB3C1]" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {headline(a)}
              {a.outcome && <span className="font-normal text-gray-600 dark:text-white/65"> · {a.outcome}</span>}
            </p>
            <time className="text-xs text-gray-400 dark:text-white/40">{fmtDateTime(a.happenedAt)}</time>
          </div>
          {a.statusTo && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
              {a.statusFrom ? `${STATUS_LABEL[a.statusFrom]} → ` : "Now: "}
              <span className="font-medium text-gray-700 dark:text-white/75">{STATUS_LABEL[a.statusTo]}</span>
            </p>
          )}
          {a.note && <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-white/75">{a.note}</p>}
          <p className="mt-1 text-xs text-gray-400 dark:text-white/40">by {a.actor.name}</p>
        </li>
      ))}
    </ol>
  );
}

function headline(a: ContactActivity): string {
  switch (a.kind) {
    case "CREATED":
      return "Recorded";
    case "STATUS":
      return "Status updated";
    case "EDIT":
      return "Details edited";
    case "REVIEW":
      return "Reviewed";
    default:
      return ACTION_LABEL[a.kind];
  }
}

function Section({ title, count, action, children }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          {title}
          {typeof count === "number" && count > 0 && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600 dark:bg-white/10 dark:text-white/60">{count}</span>
          )}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-3 sm:px-5">
      <dt className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/45 sm:text-sm">
        <Icon size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white/90">{value}</dd>
    </div>
  );
}
