"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { EventDetail } from "@/types";
import EventForm from "./events-cms/EventForm";
import EventsGrid from "./events-cms/EventsGrid";
import SkeletonGrid from "./events-cms/SkeletonGrid";
import EmptyState from "./events-cms/EmptyState";

/**
 * Events CMS — full CRUD for church events, mirroring TestimonialsCmsClient.
 *
 * Talks to /events/admin* via apiClient (JWT cookie attached, envelope unwrapped).
 * ADMIN+ enforced by the backend RolesGuard. Clicking a card navigates to its own
 * RSVP page at /dashboard/admin/events/[id].
 */

type EditingState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; event: EventDetail };

export default function EventsCmsClient() {
  const router = useRouter();
  const [items, setItems] = useState<EventDetail[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>({ kind: "closed" });
  const [toDelete, setToDelete] = useState<EventDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      showToast.success("Event deleted");
      setToDelete(null);
      await loadAll();
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function togglePublish(ev: EventDetail) {
    setTogglingId(ev.id);
    try {
      const nextStatus = ev.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      await apiClient.patch(`/events/admin/${ev.id}`, { status: nextStatus });
      showToast.success(nextStatus === "PUBLISHED" ? "Event published" : "Event unpublished");
      await loadAll();
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  }

  const publishedCount = items?.filter((e) => e.status === "PUBLISHED").length ?? 0;
  const draftCount = items?.filter((e) => e.status === "DRAFT").length ?? 0;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage church events. Published events appear on the public
            <span className="font-medium"> /events</span> page.
            {items && (
              <>
                {" "}
                · {publishedCount} published, {draftCount} drafts
              </>
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

      {items === null && !loadError && <SkeletonGrid />}

      {items !== null && items.length === 0 && editing.kind === "closed" && <EmptyState />}

      {items !== null && items.length > 0 && (
        <EventsGrid
          items={items}
          onOpenRsvps={(ev) => router.push(`/dashboard/admin/events/${ev.id}`)}
          onTogglePublish={togglePublish}
          onEdit={(ev) => setEditing({ kind: "edit", event: ev })}
          onDelete={setToDelete}
          togglingId={togglingId}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title="Delete event?"
        description={
          <>
            This permanently deletes <span className="font-semibold">{toDelete?.title}</span> and all its RSVPs.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete event"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
