"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Edit3,
  Flag,
  GraduationCap,
  ListChecks,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import Drawer from "@/components/ui/overlay/Drawer";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import {
  useDeleteContact,
  useEvangelismContact,
  useReviewContact,
  type ContactActivity,
  type ContactDetail,
  type ReviewOutcome,
} from "@/lib/api/evangelism";
import { ContactDialog } from "./ContactDialog";
import { LogActionForm } from "./LogActionForm";
import { TaskDialog } from "./TaskDialog";
import { ErrorNote, FlagBadge, Loading, SavedBadge, StatusBadge, WindowProgress, secondaryButton } from "./bits";
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
        <div className="p-6 pt-14">
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
    <div className="pb-10">
      <header className="border-b border-gray-100 px-5 pb-5 pt-14 dark:border-white/10 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <SavedBadge status={c.savedStatus} />
          <StatusBadge status={c.status} />
          {c.window.flag && <FlagBadge flag={c.window.flag} />}
        </div>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{c.name}</h2>
        <div className="mt-3 max-w-xs">
          <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`tel:${c.phone}`} className={secondaryButton}>
            <Phone size={15} aria-hidden="true" /> Call
          </a>
          <a href={whatsappLink(c.phone)} target="_blank" rel="noreferrer" className={secondaryButton}>
            <MessageCircle size={15} aria-hidden="true" /> WhatsApp
          </a>
          {canLead && (
            <>
              <button type="button" onClick={() => setEditing(true)} className={secondaryButton}>
                <Edit3 size={15} aria-hidden="true" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`${secondaryButton} text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`}
              >
                <Trash2 size={15} aria-hidden="true" /> Delete
              </button>
            </>
          )}
        </div>
      </header>

      <div className="space-y-6 px-5 pt-5 sm:px-6">
        {canLead && needsReview && <ReviewPanel contact={c} />}

        <Section title="Details">
          <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            <Fact icon={Phone} label="Phone" value={displayPhone(c.phone)} />
            <Fact icon={MapPin} label="Address" value={c.address} />
            <Fact icon={UserRound} label="Preached to by" value={c.worker.name} />
            <Fact icon={Flag} label="Outreach" value={c.outreach?.name ?? "Personal evangelism"} />
            <Fact icon={CalendarPlus} label="Date of contact" value={fmtDate(c.contactDate)} />
            <Fact icon={ArrowRight} label="Next action" value={c.nextAction ? NEXT_ACTION_LABEL[c.nextAction] : "—"} />
            {c.isStudent && (
              <Fact icon={GraduationCap} label="Student" value={[c.school, c.level].filter(Boolean).join(" · ") || "Yes"} />
            )}
            {c.status === "CALL_BACK" && c.callBackAt && <Fact icon={Phone} label="Call back on" value={fmtDate(c.callBackAt)} />}
          </dl>
          {c.discussion && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-white/[0.04] dark:text-white/80">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Discussion</p>
              <p className="whitespace-pre-wrap break-words">{c.discussion}</p>
            </div>
          )}
          <p className="mt-3 text-[11px] text-gray-400 dark:text-white/40">
            {c.consent ? "Agreed to be contacted by the church." : "Did not confirm they agree to be contacted — go gently."} Recorded{" "}
            {c.source === "FORM" ? "on the outreach form" : `by ${c.createdBy ?? "the team"}`}
            {c.updatedBy ? ` · last updated by ${c.updatedBy}, ${fmtDateTime(c.updatedAt)}` : ""}.
          </p>
        </Section>

        {c.window.open && (
          <Section title="Log a follow-up">
            <LogActionForm contactId={c.id} status={c.status} />
          </Section>
        )}

        <Section
          title="Tasks"
          action={
            canLead ? (
              <button type="button" onClick={() => setAssigning(true)} className="inline-flex items-center gap-1 text-xs font-bold text-[#87102C] dark:text-[#FFB3C1]">
                <Plus size={13} aria-hidden="true" /> Assign a task
              </button>
            ) : null
          }
        >
          {c.tasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-white/40">No tasks for this contact.</p>
          ) : (
            <ul className="space-y-2">
              {c.tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 dark:border-white/10">
                  <ListChecks size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${t.status === "DONE" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>{t.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {TASK_TYPE_LABEL[t.type]} · {t.assignees.map((a) => a.name).join(", ")}
                      {t.dueAt ? ` · due ${fmtDate(t.dueAt)}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold ${t.overdue ? "text-rose-600" : "text-gray-500 dark:text-white/50"}`}>
                    {t.overdue ? "Overdue" : TASK_STATUS_LABEL[t.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Follow-up history">
          <History items={c.activities} />
        </Section>

        {c.testimonies.length > 0 && (
          <Section title="Testimonies">
            <ul className="space-y-1.5 text-sm">
              {c.testimonies.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800 dark:text-white/90">{t.title}</span>
                  <span className="text-[11px] text-gray-400">{t.approved ? "Approved to share" : fmtDate(t.date)}</span>
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
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
      <p className="text-sm font-bold text-violet-900 dark:text-violet-200">The 30 days are up — what next for {c.name}?</p>
      <p className="mt-0.5 text-xs text-violet-700/80 dark:text-violet-200/70">Currently: {STATUS_LABEL[c.status]}.</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        aria-label="Review note"
        className="mt-3 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm dark:border-violet-500/30 dark:bg-white/5 dark:text-white"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={review.isPending} onClick={() => decide("HANDED_OVER")} className="min-h-9 rounded-xl bg-violet-700 px-3 text-xs font-bold text-white hover:bg-violet-800 disabled:opacity-50">
          Mark handed over to Follow-Up
        </button>
        <button type="button" disabled={review.isPending} onClick={() => decide("EXTENDED")} className="min-h-9 rounded-xl border border-violet-300 bg-white px-3 text-xs font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-50 dark:bg-transparent dark:text-violet-200">
          Extend 30 days
        </button>
        <button type="button" disabled={review.isPending} onClick={() => decide("CLOSED")} className="min-h-9 rounded-xl border border-violet-300 bg-white px-3 text-xs font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-50 dark:bg-transparent dark:text-violet-200">
          Close
        </button>
      </div>
    </div>
  );
}

function History({ items }: { items: ContactActivity[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">Nothing logged yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-gray-200 pl-5 dark:border-white/10">
      {items.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-[#87102C] ring-4 ring-white dark:bg-[#FFB3C1] dark:ring-[#161618]" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {headline(a)}
            {a.outcome && <span className="font-normal text-gray-600 dark:text-white/70"> — {a.outcome}</span>}
          </p>
          {a.statusTo && (
            <p className="text-xs text-gray-500 dark:text-white/50">
              {a.statusFrom ? `${STATUS_LABEL[a.statusFrom]} → ` : ""}
              {STATUS_LABEL[a.statusTo]}
            </p>
          )}
          {a.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/75">{a.note}</p>}
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
            {a.actor.name} · {fmtDateTime(a.happenedAt)}
          </p>
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

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-gray-400 dark:text-white/40">{label}</dt>
        <dd className="break-words text-gray-800 dark:text-white/85">{value}</dd>
      </div>
    </div>
  );
}
