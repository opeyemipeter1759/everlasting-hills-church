"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Camera, Loader2, Map, MessageSquareQuote, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { Combobox } from "@/components/ui/form/Combobox";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import {
  uploadTestimonyPhoto,
  useDeleteTestimony,
  useEvangelismContacts,
  useEvangelismTeam,
  useFieldTestimonies,
  useOutreaches,
  useSaveTestimony,
  type FieldTestimony,
} from "@/lib/api/evangelism";
import { EmptyState, ErrorNote, Initials, Loading, cardClass, iconButton, primaryButton, secondaryButton, selectClass } from "./bits";
import { errorText, fmtDate, inputClass, labelClass, todayLagos } from "./labels";

type Filter = "ALL" | "APPROVED" | "WAITING";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPROVED", label: "Approved to share" },
  { value: "WAITING", label: "Awaiting approval" },
];

export function TestimoniesTab({ canLead, myMemberId }: { canLead: boolean; myMemberId: string | null }) {
  const q = useFieldTestimonies();
  const save = useSaveTestimony();
  const remove = useDeleteTestimony();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<FieldTestimony | null | "new">(null);
  const [deleting, setDeleting] = useState<FieldTestimony | null>(null);

  const all = q.data ?? [];
  const rows = all.filter((t) => (filter === "APPROVED" ? t.approved : filter === "WAITING" ? !t.approved : true));
  const counts: Record<Filter, number> = {
    ALL: all.length,
    APPROVED: all.filter((t) => t.approved).length,
    WAITING: all.filter((t) => !t.approved).length,
  };

  async function toggleApproved(t: FieldTestimony) {
    try {
      await save.mutateAsync({ id: t.id, approved: !t.approved });
      showToast.success(t.approved ? "No longer marked to share" : "Approved to share");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't update"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-1 flex overflow-x-auto px-1">
          <div className="inline-flex h-10 shrink-0 items-center rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]" role="radiogroup" aria-label="Show">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors ${
                  filter === f.value ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-white/50"
                }`}
              >
                {f.label}
                <span className="text-xs tabular-nums text-gray-400">{counts[f.value]}</span>
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
          <Plus size={16} aria-hidden="true" /> Record a testimony
        </button>
      </div>

      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <ErrorNote>{errorText(q.error, "Couldn't load testimonies.")}</ErrorNote>
      ) : rows.length === 0 ? (
        <div className={cardClass}>
          <EmptyState icon={MessageSquareQuote} title="No testimonies here yet" body="Heard what God did through an outreach? Record it so the church can rejoice with you." />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((t) => (
            <TestimonyCard
              key={t.id}
              testimony={t}
              canLead={canLead}
              own={!!myMemberId && t.submittedBy.id === myMemberId}
              busy={save.isPending}
              onApprove={() => toggleApproved(t)}
              onEdit={() => setEditing(t)}
              onDelete={() => setDeleting(t)}
            />
          ))}
        </ul>
      )}

      <TestimonyDialog open={editing !== null} onClose={() => setEditing(null)} testimony={editing === "new" ? null : editing} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this testimony?"
        description={deleting ? `"${deleting.title}" will be removed.` : ""}
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            setDeleting(null);
          } catch (err) {
            showToast.error(errorText(err, "Couldn't delete"));
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function TestimonyCard({
  testimony: t,
  canLead,
  own,
  busy,
  onApprove,
  onEdit,
  onDelete,
}: {
  testimony: FieldTestimony;
  canLead: boolean;
  own: boolean;
  busy: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = t.body.length > 220;
  return (
    <li className={`${cardClass} flex flex-col overflow-hidden`}>
      {t.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads from storage, any host
        <img src={t.photoUrl} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 dark:text-white/45">{fmtDate(t.date)}</span>
          {t.approved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <BadgeCheck size={13} aria-hidden="true" /> Approved to share
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-white/10 dark:text-white/60">Awaiting approval</span>
          )}
        </div>
        <h3 className="mt-3 text-base font-semibold leading-snug text-gray-900 dark:text-white">{t.title}</h3>
        <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 dark:text-white/70 ${long && !expanded ? "line-clamp-4" : ""}`}>
          {t.body}
        </p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 self-start text-sm font-medium text-[#87102C] hover:underline dark:text-[#FFB3C1]">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {(t.contact || t.outreach) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {t.contact && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-gray-600 dark:bg-white/[0.05] dark:text-white/60">
                <UserRound size={12} aria-hidden="true" /> {t.contact.name}
              </span>
            )}
            {t.outreach && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-gray-600 dark:bg-white/[0.05] dark:text-white/60">
                <Map size={12} aria-hidden="true" /> {t.outreach.name}
              </span>
            )}
          </div>
        )}

        <div aria-hidden="true" className="min-h-5 flex-1" />
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
          <div className="flex min-w-0 items-center gap-2">
            <Initials name={t.worker?.name ?? t.submittedBy.name} size={28} />
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-gray-800 dark:text-white/85">{t.worker?.name ?? t.submittedBy.name}</p>
              <p className="truncate text-gray-500 dark:text-white/45">
                {t.approved && t.approvedByName ? `Approved by ${t.approvedByName}` : `Recorded by ${t.submittedBy.name}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canLead && (
              <button
                type="button"
                onClick={onApprove}
                disabled={busy}
                className={
                  t.approved
                    ? "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10"
                    : "inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#87102C] px-3 text-sm font-semibold text-white hover:bg-[#6d0d24]"
                }
              >
                {t.approved ? "Unapprove" : (
                  <>
                    <BadgeCheck size={15} aria-hidden="true" /> Approve
                  </>
                )}
              </button>
            )}
            {(canLead || own) && (
              <>
                <button type="button" onClick={onEdit} aria-label="Edit testimony" title="Edit" className={iconButton}>
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete testimony"
                  title="Delete"
                  className={`${iconButton} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10`}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function TestimonyDialog({ open, onClose, testimony }: { open: boolean; onClose: () => void; testimony: FieldTestimony | null }) {
  const save = useSaveTestimony();
  const team = useEvangelismTeam(open);
  const outreaches = useOutreaches();
  const [contactSearch, setContactSearch] = useState("");
  const contacts = useEvangelismContacts({ search: contactSearch, take: 20 });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(todayLagos());
  const [contactId, setContactId] = useState("");
  const [outreachId, setOutreachId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(testimony?.title ?? "");
    setBody(testimony?.body ?? "");
    setDate(testimony ? new Date(new Date(testimony.date).getTime() + 3_600_000).toISOString().slice(0, 10) : todayLagos());
    setContactId(testimony?.contact?.id ?? "");
    setOutreachId(testimony?.outreach?.id ?? "");
    setWorkerId(testimony?.worker?.id ?? "");
    setPhotoUrl(testimony?.photoUrl ?? "");
  }, [open, testimony]);

  const contactOptions = [
    ...(testimony?.contact && !(contacts.data?.data ?? []).some((c) => c.id === testimony.contact?.id)
      ? [{ id: testimony.contact.id, label: testimony.contact.name }]
      : []),
    ...(contacts.data?.data ?? []).map((c) => ({ id: c.id, label: c.name })),
  ];

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      setPhotoUrl(await uploadTestimonyPhoto(file));
    } catch (err) {
      showToast.error(errorText(err, "Couldn't upload the photo"));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return setError("Add a title and the testimony.");
    try {
      if (testimony) {
        await save.mutateAsync({
          id: testimony.id,
          title: title.trim(),
          body: body.trim(),
          date,
          contactId: contactId || null,
          outreachId: outreachId || null,
          ...(workerId ? { workerMemberId: workerId } : {}),
          photoUrl: photoUrl || null,
        });
      } else {
        await save.mutateAsync({
          title: title.trim(),
          body: body.trim(),
          date,
          contactId: contactId || undefined,
          outreachId: outreachId || undefined,
          workerMemberId: workerId || undefined,
          photoUrl: photoUrl || undefined,
        });
      }
      showToast.success("Testimony saved");
      onClose();
    } catch (err) {
      setError(errorText(err, "Couldn't save"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={testimony ? "Edit testimony" : "Record a testimony"} maxWidth="lg">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <span className={labelClass}>Title *</span>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Healed after prayer at the market" />
        </div>
        <div>
          <span className={labelClass}>Testimony *</span>
          <textarea className={`${inputClass} min-h-[120px]`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={8000} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Date</span>
            <input type="date" className={inputClass} value={date} max={todayLagos()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className={labelClass}>Worker</span>
            <Select
              className={selectClass}
              aria-label="Worker"
              value={workerId}
              onChange={setWorkerId}
              options={[
                { value: "", label: testimony ? (testimony.worker?.name ?? "—") : "Me" },
                ...(team.data ?? []).map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>
          <div>
            <span className={labelClass}>Contact (optional)</span>
            <Combobox
              options={[{ id: "", label: "None" }, ...contactOptions]}
              value={contactId}
              onChange={setContactId}
              onQueryChange={setContactSearch}
              placeholder="Link a contact"
              searchPlaceholder="Search contacts…"
              loading={contacts.isFetching}
            />
          </div>
          <div>
            <span className={labelClass}>Outreach (optional)</span>
            <Select
              className={selectClass}
              aria-label="Outreach"
              value={outreachId}
              onChange={setOutreachId}
              options={[{ value: "", label: "None" }, ...(outreaches.data?.outreaches ?? []).map((o) => ({ value: o.id, label: o.name }))]}
            />
          </div>
        </div>
        <div>
          <span className={labelClass}>Photo (optional)</span>
          {photoUrl ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview of the upload */}
              <img src={photoUrl} alt="" className="h-28 rounded-xl object-cover" />
              <button type="button" onClick={() => setPhotoUrl("")} aria-label="Remove photo" className="absolute -right-2 -top-2 rounded-full bg-gray-900 p-1 text-white">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className={`${secondaryButton} cursor-pointer`}>
              {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Camera size={15} aria-hidden="true" />}
              {uploading ? "Uploading…" : "Add a photo"}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={save.isPending || uploading} className={primaryButton}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
