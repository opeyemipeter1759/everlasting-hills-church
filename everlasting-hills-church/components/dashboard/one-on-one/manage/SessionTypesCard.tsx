"use client";

import { useState } from "react";
import { Check, Copy, Hourglass, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import {
  shareUrl,
  useCreateSessionType,
  useDeleteSessionType,
  useUpdateSessionType,
  type HostDetail,
  type SessionType,
} from "@/lib/api/one-on-one";
import { Select } from "@/components/ui/select";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { Section, Toggle, btnGhost, btnPrimary, durationLabel, input, label, muted } from "./ui";

const DURATIONS = [30, 45, 60, 90, 120, 180].map((m) => ({ value: String(m), label: durationLabel(m) }));
const smallBtn = "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#87102C] hover:bg-[#FFE8ED] dark:text-[#FFB3C1] dark:hover:bg-white/[0.06]";

function SessionTypeRow({ host, type: t, hostName }: { host: HostDetail; type: SessionType; hostName: (id: string | null) => string }) {
  const update = useUpdateSessionType(host.id);
  const remove = useDeleteSessionType(host.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(t.name);
  const [description, setDescription] = useState(t.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = host.slug && t.slug ? shareUrl(host.slug, t.slug) : null;

  async function patch(change: Partial<SessionType>, done: string) {
    try {
      await update.mutateAsync({ id: t.id, ...change });
      showToast.success(done);
      return true;
    } catch (err) {
      showToast.error(errorText(err, "Couldn't update that session type."));
      return false;
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy. Select the link and copy it instead.");
    }
  }

  return (
    <li className={`rounded-xl border border-[#E7CDD3]/70 p-4 dark:border-white/10 ${t.active ? "" : "opacity-70"}`}>
      {editing ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await patch({ name: name.trim(), description: description.trim() }, "Session type updated")) setEditing(false);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className={label}>Name</span>
            <input id={`type-name-${t.id}`} className={input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Description people see (optional)</span>
            <textarea id={`type-desc-${t.id}`} className={`${input} min-h-[64px] resize-y`} value={description} maxLength={240} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <p className={`text-xs ${muted}`}>Renaming keeps the session’s share link the same, so links you’ve already sent still work.</p>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={!name.trim() || update.isPending}>
              Save
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setEditing(false);
                setName(t.name);
                setDescription(t.description ?? "");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[#111] dark:text-white">{t.name}</p>
              <p className={`text-sm ${muted}`}>
                {durationLabel(t.durationMinutes)}
                {t.jointWithHostId && ` · together with ${hostName(t.jointWithHostId)}`}
                {!t.active && " · switched off"}
              </p>
              {t.description && <p className={`mt-1 text-sm ${muted}`}>{t.description}</p>}
            </div>
            <div className="w-[8.5rem]">
              <Select
                aria-label={`${t.name} length`}
                value={String(t.durationMinutes)}
                onChange={(v) => patch({ durationMinutes: Number(v) }, `${t.name} is now ${durationLabel(Number(v))}`)}
                options={DURATIONS}
                disabled={update.isPending}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <Toggle
                id={`type-topic-${t.id}`}
                checked={t.askTopic}
                onChange={(v) => patch({ askTopic: v }, v ? "People will choose what it’s about" : "Only the note box is shown now")}
                label={`Ask what they'd like to talk about for ${t.name}`}
                disabled={update.isPending}
              />
              <span className="text-sm text-[#111] dark:text-white/80">Ask what they’d like to talk about</span>
            </div>
            {!t.jointWithHostId && (
              <div className="flex items-center gap-2.5">
                <Toggle
                  id={`type-visitors-${t.id}`}
                  checked={t.visitorsCanBook}
                  onChange={(v) => patch({ visitorsCanBook: v }, v ? `Visitors can request ${t.name}` : `${t.name} is for members only`)}
                  label={`Visitors can request ${t.name}`}
                  disabled={update.isPending}
                />
                <span className="text-sm text-[#111] dark:text-white/80">Visitors can request</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Toggle
                id={`type-active-${t.id}`}
                checked={t.active}
                onChange={(v) => patch({ active: v }, v ? `${t.name} switched on` : `${t.name} switched off`)}
                label={`${t.name} is offered`}
                disabled={update.isPending}
              />
              <span className="text-sm text-[#111] dark:text-white/80">Offered</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-[#E7CDD3]/50 pt-3 dark:border-white/[0.07]">
            {link && t.active && (
              <>
                <button type="button" className={smallBtn} onClick={copy}>
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy link"}
                </button>
                <a
                  className={smallBtn}
                  href={`https://wa.me/?text=${encodeURIComponent(`${t.name} with ${host.displayName}. Pick a time here: ${link}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              </>
            )}
            <button type="button" className={smallBtn} onClick={() => setEditing(true)}>
              <Pencil size={13} /> Edit
            </button>
            <button type="button" className={`${smallBtn} text-red-700 dark:text-red-300`} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
          {link && t.active && !t.visitorsCanBook && <p className={`mt-1.5 text-xs ${muted}`}>Members only: share this link with members.</p>}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${t.name}?`}
        description="People won't be able to request it any more and its share link will stop working. If it has been requested before, its past sessions are kept."
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(t.id);
            showToast.success(`${t.name} deleted`);
            setConfirmDelete(false);
          } catch (err) {
            showToast.error(errorText(err, "Couldn't delete that session type."));
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </li>
  );
}

export default function SessionTypesCard({ host, otherHosts }: { host: HostDetail; otherHosts: { hostId: string; displayName: string }[] }) {
  const create = useCreateSessionType(host.id);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [joint, setJoint] = useState("");

  const jointOptions = [{ value: "", label: "Just me" }, ...otherHosts.map((h) => ({ value: h.hostId, label: `With ${h.displayName}` }))];
  const hostName = (id: string | null) => otherHosts.find((h) => h.hostId === id)?.displayName ?? "the other pastor";

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ name: name.trim(), durationMinutes: Number(duration), jointWithHostId: joint || undefined });
      showToast.success(`${name.trim()} added`);
      setAdding(false);
      setName("");
      setDuration("60");
      setJoint("");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't add that session type."));
    }
  }

  return (
    <Section
      icon={Hourglass}
      eyebrow="What people can request"
      title="Session types"
      action={
        !adding && (
          <button type="button" className={`${btnGhost} px-2.5 py-1.5 text-xs`} onClick={() => setAdding(true)}>
            <Plus size={13} /> Add
          </button>
        )
      }
    >
      {host.sessionTypes.length === 0 && !adding && <p className={`text-sm ${muted}`}>No session types yet. Add one so people can request time with you.</p>}
      <ul className="flex flex-col gap-3">
        {host.sessionTypes.map((t) => (
          <SessionTypeRow key={t.id} host={host} type={t} hostName={hostName} />
        ))}
      </ul>

      {adding && (
        <form onSubmit={onCreate} className="mt-4 flex flex-col gap-3 rounded-xl bg-[#FFE8ED]/40 p-4 dark:bg-white/[0.04]">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Name</span>
            <input id="new-type-name" className={input} value={name} maxLength={60} placeholder="Couples & family" onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={label} id="lbl-new-duration">Length</span>
              <Select aria-labelledby="lbl-new-duration" value={duration} onChange={setDuration} options={DURATIONS} />
            </div>
            {otherHosts.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className={label} id="lbl-new-joint">Who hosts</span>
                <Select aria-labelledby="lbl-new-joint" value={joint} onChange={setJoint} options={jointOptions} />
              </div>
            )}
          </div>
          {joint && <p className={`text-xs ${muted}`}>Offered only at times when both of you are free, and it takes both of your time.</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={!name.trim() || create.isPending}>
              Add session type
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}
