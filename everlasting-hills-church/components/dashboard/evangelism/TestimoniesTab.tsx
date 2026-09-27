"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Camera, Edit3, Loader2, MessageSquareQuote, Plus, Trash2, X } from "lucide-react";
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
import { EmptyState, ErrorNote, Loading, cardClass, primaryButton, secondaryButton } from "./bits";
import { errorText, fmtDate, inputClass, labelClass, todayLagos } from "./labels";

type Filter = "" | "APPROVED" | "WAITING";

export function TestimoniesTab({ canLead, myMemberId }: { canLead: boolean; myMemberId: string | null }) {
  const q = useFieldTestimonies();
  const save = useSaveTestimony();
  const remove = useDeleteTestimony();
  const [filter, setFilter] = useState<Filter>("");
  const [editing, setEditing] = useState<FieldTestimony | null | "new">(null);
  const [deleting, setDeleting] = useState<FieldTestimony | null>(null);

  const rows = (q.data ?? []).filter((t) => (filter === "APPROVED" ? t.approved : filter === "WAITING" ? !t.approved : true));

  async function toggleApproved(t: FieldTestimony) {
    try {
      await save.mutateAsync({ id: t.id, approved: !t.approved });
      showToast.success(t.approved ? "No longer marked to share" : "Approved to share");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't update"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-48">
          <Select
            aria-label="Show"
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { value: "", label: "All testimonies" },
              { value: "APPROVED", label: "Approved to share" },
              { value: "WAITING", label: "Not yet approved" },
            ]}
          />
        </div>
        <button type="button" onClick={() => setEditing("new")} className={`${primaryButton} ml-auto`}>
          <Plus size={15} aria-hidden="true" /> Record a testimony
        </button>
      </div>

      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <ErrorNote>{errorText(q.error, "Couldn't load testimonies.")}</ErrorNote>
      ) : rows.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No testimonies yet" body="Heard what God did through an outreach? Record it here." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((t) => {
            const own = !!myMemberId && t.submittedBy.id === myMemberId;
            return (
              <li key={t.id} className={`${cardClass} overflow-hidden`}>
                {t.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- user uploads from storage, any host
                  <img src={t.photoUrl} alt="" loading="lazy" className="h-44 w-full object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 dark:text-white">{t.title}</p>
                    {t.approved && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <BadgeCheck size={12} aria-hidden="true" /> Approved to share
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/80">{t.body}</p>
                  <p className="mt-3 text-[11px] text-gray-400 dark:text-white/40">
                    {fmtDate(t.date)}
                    {t.worker ? ` · ${t.worker.name}` : ""}
                    {t.contact ? ` · about ${t.contact.name}` : ""}
                    {t.outreach ? ` · ${t.outreach.name}` : ""} · recorded by {t.submittedBy.name}
                    {t.approved && t.approvedByName ? ` · approved by ${t.approvedByName}` : ""}
                  </p>
                  {(canLead || own) && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                      {canLead && (
                        <button
                          type="button"
                          onClick={() => toggleApproved(t)}
                          disabled={save.isPending}
                          className={t.approved ? secondaryButton : primaryButton}
                        >
                          <BadgeCheck size={15} aria-hidden="true" /> {t.approved ? "Unapprove" : "Approve to share"}
                        </button>
                      )}
                      <button type="button" onClick={() => setEditing(t)} className={secondaryButton}>
                        <Edit3 size={15} aria-hidden="true" /> Edit
                      </button>
                      <button type="button" onClick={() => setDeleting(t)} className={`${secondaryButton} text-rose-600 dark:text-rose-400`}>
                        <Trash2 size={15} aria-hidden="true" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
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
