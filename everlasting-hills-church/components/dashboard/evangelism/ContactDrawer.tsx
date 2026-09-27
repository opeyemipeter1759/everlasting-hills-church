"use client";

import { useState } from "react";
import {
  CalendarDays,
  Flag,
  GraduationCap,
  ListChecks,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
  ArrowRight,
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
  useReviewContact,
  type ContactActivity,
  type ContactDetail,
  type ReviewOutcome,
} from "@/lib/api/evangelism";
import { ActivityThread } from "@/components/dashboard/follow-up/ActivityThread";
import { Select } from "@/components/ui/select";
import { ContactDialog } from "./ContactDialog";
import { LogActionForm } from "./LogActionForm";
import { TaskDialog } from "./TaskDialog";
import { ErrorNote, FlagBadge, Initials, Loading, SavedBadge, StatusBadge, WindowProgress, cardClass, secondaryButton, selectClass } from "./bits";
import {
  ACTION_LABEL,
  NEXT_ACTION_LABEL,
  STATUS_LABEL,
  TASK_STATUS_LABEL,
  TASK_TYPE_LABEL,
  displayPhone,
  errorText,
  fmtDate,
  fmtDateTime,
  whatsappLink,
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

function Profile({ contact: c, canLead, onClose }: { contact: ContactDetail; canLead: boolean; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const remove = useDeleteContact();
  const needsReview = c.window.flag === "REVIEW";

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

  return (
    <div className="pb-12">
      <header className="px-5 pb-5 pt-14 sm:px-7">
        <div className="flex items-start gap-4">
          <Initials name={c.name} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white sm:text-2xl">{c.name}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">{displayPhone(c.phone)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <SavedBadge status={c.savedStatus} />
              <StatusBadge status={c.status} />
              {c.window.flag && <FlagBadge flag={c.window.flag} />}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <a href={`tel:${c.phone}`} className={`${secondaryButton} min-w-0 flex-1 px-3`}>
            <Phone size={16} aria-hidden="true" /> Call
          </a>
          <a href={whatsappLink(c.phone)} target="_blank" rel="noreferrer" className={`${secondaryButton} min-w-0 flex-1 px-3`}>
            <MessageCircle size={16} aria-hidden="true" /> WhatsApp
          </a>
          {canLead && (
            <>
              <button type="button" onClick={() => setEditing(true)} aria-label="Edit contact" title="Edit" className={`${secondaryButton} w-10 px-0`}>
                <Pencil size={16} className="shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete contact"
                title="Delete"
                className={`${secondaryButton} w-10 px-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:text-rose-400`}
              >
                <Trash2 size={16} className="shrink-0" />
              </button>
            </>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600 dark:text-white/60">30-day follow-up</span>
            {c.window.open && c.window.nextDueAt && c.window.flag !== "REVIEW" && (
              <span className="text-gray-500 dark:text-white/45">Next due {fmtDate(c.window.nextDueAt)}</span>
            )}
          </div>
          <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} />
        </div>
      </header>

      <div className="space-y-8 border-t border-gray-100 px-5 pt-6 dark:border-white/[0.06] sm:px-7">
        {canLead && needsReview && <ReviewPanel contact={c} />}

        <FollowingUp contact={c} canLead={canLead} />

        <Section title="Details">
          <dl className={`${cardClass} grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 sm:p-5`}>
            <Fact icon={MapPin} label="Address" value={c.address} />
            <Fact icon={Flag} label="Outreach" value={c.outreach?.name ?? "Personal evangelism"} />
            <Fact icon={CalendarDays} label="Date of contact" value={fmtDate(c.contactDate)} />
            <Fact icon={ArrowRight} label="Next action" value={c.nextAction ? NEXT_ACTION_LABEL[c.nextAction] : "—"} />
            <Fact icon={UserRound} label="Preached to by" value={c.worker.name} />
            {c.isStudent ? (
              <Fact icon={GraduationCap} label="Student" value={[c.school, c.level].filter(Boolean).join(" · ") || "Yes"} />
            ) : (
              <Fact icon={GraduationCap} label="Student" value="No" />
            )}
            {c.status === "CALL_BACK" && c.callBackAt && <Fact icon={Phone} label="Call back on" value={fmtDate(c.callBackAt)} />}
          </dl>
          {c.discussion && (
            <div className="mt-3 rounded-2xl border border-gray-100 p-4 dark:border-white/[0.06]">
              <p className="text-xs font-medium text-gray-500 dark:text-white/45">What was discussed</p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-white/85">{c.discussion}</p>
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-gray-400 dark:text-white/40">
            {c.consent ? "Agreed to be contacted by the church." : "Did not confirm they agree to be contacted — go gently."} Recorded{" "}
            {c.source === "FORM" ? "on the outreach form" : `by ${c.createdBy ?? "the team"}`}
            {c.updatedBy ? `; last updated by ${c.updatedBy}, ${fmtDateTime(c.updatedAt)}` : ""}.
          </p>
        </Section>

        <div className={`${cardClass} px-4 pb-2 sm:px-5`}>
          <ActivityThread
            person={{ kind: EVANGELISM_NOTE_KIND, id: c.id, name: c.name }}
            title="Feedback"
            notesBase={EVANGELISM_NOTES_BASE}
            listKey={EVANGELISM_CONTACTS_KEY}
          />
        </div>

        {c.window.open && (
          <Section title="Log a follow-up">
            <div className={`${cardClass} p-4 sm:p-5`}>
              <LogActionForm contactId={c.id} status={c.status} />
            </div>
          </Section>
        )}

        <Section
          title="Tasks"
          count={c.tasks.length}
          action={
            canLead ? (
              <button type="button" onClick={() => setAssigning(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                <Plus size={15} aria-hidden="true" /> Assign a task
              </button>
            ) : null
          }
        >
          {c.tasks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-white/45">No tasks for this contact.</p>
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
          <History items={c.activities} />
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
      </div>

      <ContactDialog open={editing} onClose={() => setEditing(false)} contact={c} />
      <TaskDialog open={assigning} onClose={() => setAssigning(false)} contact={{ id: c.id, name: c.name }} defaultAssigneeId={c.worker.id} />
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

function History({ items }: { items: ContactActivity[] }) {
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
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-gray-500 dark:text-white/45">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-gray-900 dark:text-white/90">{value}</dd>
      </div>
    </div>
  );
}
