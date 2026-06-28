"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import FileUpload from "@/components/ui/form/FileUpload";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { EventDetail, EventRsvp } from "@/types";

/**
 * Events CMS — full CRUD for church events, mirroring TestimonialsCmsClient.
 *
 * Talks to /events/admin* via apiClient (JWT cookie attached, envelope unwrapped).
 * ADMIN+ enforced by the backend RolesGuard. The flyer field reuses the shared
 * FileUpload → /uploads/image. RSVPs are viewable per-event in a side panel.
 */

const inputCls =
  "w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

type EditingState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; event: EventDetail };

/** ISO → value for <input type="datetime-local"> in the admin's local timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRange(startIso: string, endIso: string | null): string {
  const s = new Date(startIso);
  if (Number.isNaN(s.getTime())) return "";
  const dateStr = s.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = s.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateStr} · ${time}`;
}

export default function EventsCmsClient() {
  const [items, setItems] = useState<EventDetail[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>({ kind: "closed" });
  const [toDelete, setToDelete] = useState<EventDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rsvpFor, setRsvpFor] = useState<EventDetail | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const res = await apiClient.get<EventDetail[]>("/events/admin");
      setItems(res.data);
    } catch (err) {
      setLoadError((err as { message?: string }).message ?? "Failed to load events");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/events/admin/${toDelete.id}`);
      setToDelete(null);
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function togglePublish(ev: EventDetail) {
    try {
      await apiClient.patch(`/events/admin/${ev.id}`, {
        status: ev.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      });
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Toggle failed");
    }
  }

  const publishedCount = items?.filter((e) => e.status === "PUBLISHED").length ?? 0;
  const draftCount = items?.filter((e) => e.status === "DRAFT").length ?? 0;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage church events. Published events appear on the public
            <span className="font-medium"> /events</span> page.
            {items && (
              <> {" "}· {publishedCount} published, {draftCount} drafts</>
            )}
          </p>
        </div>
        {editing.kind === "closed" && (
          <button
            type="button"
            onClick={() => setEditing({ kind: "create" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New event
          </button>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          {loadError}
        </div>
      )}

      {/* Editor */}
      {editing.kind !== "closed" && (
        <EventForm
          initial={editing.kind === "edit" ? editing.event : null}
          onCancel={() => setEditing({ kind: "closed" })}
          onSaved={async () => {
            setEditing({ kind: "closed" });
            await loadAll();
          }}
        />
      )}

      {/* Skeleton */}
      {items === null && !loadError && <SkeletonList />}

      {/* Empty */}
      {items !== null && items.length === 0 && editing.kind === "closed" && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <CalendarDays size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No events yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Click <span className="font-semibold text-[#87102C]">New event</span> to add the first one.
          </p>
        </div>
      )}

      {/* List */}
      {items !== null && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((ev) => (
            <li
              key={ev.id}
              className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
                  {ev.flyerImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.flyerImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <CalendarDays size={22} className="text-[#87102C]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {ev.title}
                    </p>
                    {ev.status === "PUBLISHED" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Published
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                        Draft
                      </span>
                    )}
                    {ev.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFE8ED] text-[#87102C]">
                        Featured
                      </span>
                    )}
                    {ev.customPath && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Custom page
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRange(ev.startAt, ev.endAt)}
                    {ev.venueName ? ` · ${ev.venueName}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRsvpFor(ev)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:gap-2 transition-all"
                  >
                    <Users size={13} />
                    {ev._count?.Rsvps ?? 0} RSVP{(ev._count?.Rsvps ?? 0) === 1 ? "" : "s"} · View
                  </button>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublish(ev)}
                    title={ev.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {ev.status === "PUBLISHED" ? <EyeOff size={15} /> : <CheckCircle2 size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ kind: "edit", event: ev })}
                    title="Edit"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(ev)}
                    title="Delete"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title="Delete event?"
        description={
          <>
            This permanently deletes <span className="font-semibold">{toDelete?.title}</span> and
            all its RSVPs. This cannot be undone.
          </>
        }
        confirmLabel="Delete event"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />

      {rsvpFor && <RsvpPanel event={rsvpFor} onClose={() => setRsvpFor(null)} />}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

interface FormProps {
  initial: EventDetail | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}

function EventForm({ initial, onCancel, onSaved }: FormProps) {
  const [data, setData] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    startAt: toLocalInput(initial?.startAt ?? null),
    endAt: toLocalInput(initial?.endAt ?? null),
    venueName: initial?.venueName ?? "",
    venueAddress: initial?.venueAddress ?? "",
    mapsLink: initial?.mapsLink ?? "",
    flyerImageUrl: initial?.flyerImageUrl ?? "",
    hostName: initial?.hostName ?? "",
    guestMinister: initial?.guestMinister ?? "",
    contactPhone: initial?.contactPhone ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactWhatsapp: initial?.contactWhatsapp ?? "",
    status: initial?.status ?? "DRAFT",
    featured: initial?.featured ?? false,
    rsvpEnabled: initial?.rsvpEnabled ?? true,
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    customPath: initial?.customPath ?? "",
    order: initial?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial;
  function set<K extends keyof typeof data>(key: K, value: (typeof data)[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title.trim() || !data.startAt) {
      setError("Title and start date/time are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const text = (v: string) => (v.trim() ? v.trim() : undefined);
      const payload = {
        title: data.title.trim(),
        startAt: new Date(data.startAt).toISOString(),
        endAt: data.endAt ? new Date(data.endAt).toISOString() : undefined,
        status: data.status,
        featured: data.featured,
        rsvpEnabled: data.rsvpEnabled,
        order: Number(data.order) || 0,
        slug: text(data.slug),
        tagline: text(data.tagline),
        description: text(data.description),
        venueName: text(data.venueName),
        venueAddress: text(data.venueAddress),
        mapsLink: text(data.mapsLink),
        flyerImageUrl: text(data.flyerImageUrl),
        hostName: text(data.hostName),
        guestMinister: text(data.guestMinister),
        contactPhone: text(data.contactPhone),
        contactEmail: text(data.contactEmail),
        contactWhatsapp: text(data.contactWhatsapp),
        customPath: text(data.customPath),
        ...(data.capacity.trim() && { capacity: Number(data.capacity) }),
      };
      if (isEdit) {
        await apiClient.patch(`/events/admin/${initial.id}`, payload);
      } else {
        await apiClient.post("/events/admin", payload);
      }
      await onSaved();
    } catch (err) {
      const e2 = err as { message?: string; details?: { path: string; message: string }[] };
      const detail = e2.details?.[0];
      setError(detail ? `${detail.path}: ${detail.message}` : e2.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit event" : "New event"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      {/* Basics */}
      <Field label="Title *">
        <input required value={data.title} onChange={(e) => set("title", e.target.value)}
          placeholder="Heaven on Earth" className={inputCls} maxLength={200} />
      </Field>
      <Field label="Tagline">
        <input value={data.tagline} onChange={(e) => set("tagline", e.target.value)}
          placeholder="A one-line hook for the event" className={inputCls} maxLength={300} />
      </Field>
      <Field label="Description">
        <textarea rows={4} value={data.description} onChange={(e) => set("description", e.target.value)}
          placeholder="What's this gathering about?" className={`${inputCls} resize-y`} maxLength={5000} />
      </Field>

      {/* When */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Starts *">
          <input required type="datetime-local" value={data.startAt}
            onChange={(e) => set("startAt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ends">
          <input type="datetime-local" value={data.endAt}
            onChange={(e) => set("endAt", e.target.value)} className={inputCls} />
        </Field>
      </div>

      {/* Where */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Venue name">
          <input value={data.venueName} onChange={(e) => set("venueName", e.target.value)}
            placeholder="Hills Auditorium" className={inputCls} />
        </Field>
        <Field label="Venue address">
          <input value={data.venueAddress} onChange={(e) => set("venueAddress", e.target.value)}
            placeholder="Ibadan, Oyo State" className={inputCls} />
        </Field>
      </div>
      <Field label="Google Maps link">
        <input value={data.mapsLink} onChange={(e) => set("mapsLink", e.target.value)}
          placeholder="https://maps.google.com/…" className={inputCls} />
      </Field>

      {/* Flyer */}
      <Field label="Flyer image">
        <FileUpload
          type="image"
          endpoint="/uploads/image"
          value={data.flyerImageUrl}
          onChange={(url) => set("flyerImageUrl", url)}
        />
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">
          Used as the hero background and the card thumbnail.
        </p>
      </Field>

      {/* People */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Host">
          <input value={data.hostName} onChange={(e) => set("hostName", e.target.value)}
            placeholder="Pastor Bowale Okunola" className={inputCls} />
        </Field>
        <Field label="Guest minister">
          <input value={data.guestMinister} onChange={(e) => set("guestMinister", e.target.value)}
            placeholder="TBA" className={inputCls} />
        </Field>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Contact phone">
          <input value={data.contactPhone} onChange={(e) => set("contactPhone", e.target.value)}
            placeholder="+234…" className={inputCls} />
        </Field>
        <Field label="Contact email">
          <input type="email" value={data.contactEmail} onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="events@…" className={inputCls} />
        </Field>
        <Field label="WhatsApp link">
          <input value={data.contactWhatsapp} onChange={(e) => set("contactWhatsapp", e.target.value)}
            placeholder="https://wa.me/…" className={inputCls} />
        </Field>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Status">
          <select value={data.status} onChange={(e) => set("status", e.target.value as "DRAFT" | "PUBLISHED")} className={inputCls}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </Field>
        <Field label="Capacity (optional)">
          <input type="number" min={1} value={data.capacity}
            onChange={(e) => set("capacity", e.target.value)} placeholder="No limit" className={inputCls} />
        </Field>
        <Field label="Display order">
          <input type="number" value={data.order}
            onChange={(e) => set("order", Number(e.target.value) || 0)} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={data.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="w-4 h-4 rounded accent-[#87102C]" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Feature this event</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={data.rsvpEnabled}
            onChange={(e) => set("rsvpEnabled", e.target.checked)}
            className="w-4 h-4 rounded accent-[#87102C]" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Allow RSVPs</span>
        </label>
      </div>

      {/* Advanced */}
      <details className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
        <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer">
          Advanced
        </summary>
        <div className="mt-3">
          <Field label="Slug (auto from title if blank)">
            <input value={data.slug} onChange={(e) => set("slug", e.target.value)}
              placeholder="heaven-on-earth" className={inputCls} />
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">
              The event opens at <span className="font-mono">/events/{data.slug || "your-slug"}</span>.
            </p>
          </Field>
        </div>
      </details>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── RSVP panel ──────────────────────────────────────────────────────────────

function RsvpPanel({ event, onClose }: { event: EventDetail; onClose: () => void }) {
  const [rsvps, setRsvps] = useState<EventRsvp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<EventRsvp[]>(`/events/admin/${event.id}/rsvps`);
        setRsvps(res.data);
      } catch (err) {
        setError((err as { message?: string }).message ?? "Failed to load RSVPs");
      }
    })();
  }, [event.id]);

  const totalAttendees = rsvps?.reduce((sum, r) => sum + (r.attendees || 0), 0) ?? 0;

  function exportCsv() {
    if (!rsvps || rsvps.length === 0) return;
    const head = ["Name", "Email", "Phone", "Attendees", "Date"];
    const rows = rsvps.map((r) => [
      r.fullName,
      r.email,
      r.phone ?? "",
      String(r.attendees),
      new Date(r.createdAt).toLocaleString("en-GB"),
    ]);
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [head, ...rows].map((row) => row.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps-${event.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 dark:border-white/10">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">RSVPs · {event.title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {rsvps?.length ?? 0} submission{(rsvps?.length ?? 0) === 1 ? "" : "s"} · {totalAttendees} attendee{totalAttendees === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rsvps && rsvps.length > 0 && (
              <button type="button" onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <Download size={13} /> CSV
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {!rsvps && !error && <p className="text-sm text-gray-400">Loading…</p>}
          {rsvps && rsvps.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No RSVPs yet.</p>
          )}
          {rsvps && rsvps.length > 0 && (
            <ul className="space-y-2">
              {rsvps.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 dark:border-white/8 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {r.email}{r.phone ? ` · ${r.phone}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#87102C] dark:text-[#e8768a] flex-shrink-0">
                    {r.attendees} seat{r.attendees === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-40 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-28 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
