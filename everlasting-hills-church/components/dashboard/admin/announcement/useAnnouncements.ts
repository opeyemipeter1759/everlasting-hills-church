import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import type { Announcement, AnnouncementFilter, AnnouncementFormValues } from "./types";

/** Flattens the composer's targetPeople chips into the parallel id/name arrays
 * the API expects, and drops the form-only field. */
function toPayload(values: AnnouncementFormValues) {
  const { targetPeople, ...rest } = values;
  return {
    ...rest,
    targetProfileIds: targetPeople.map((p) => p.id),
    targetProfileNames: targetPeople.map((p) => p.name),
  };
}

export function useAnnouncements() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<AnnouncementFilter>("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [viewTarget, setViewTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [publishTarget, setPublishTarget] = useState<Announcement | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await apiClient.get<Announcement[]>("/announcements")).data,
  });

  const counts = useMemo(
    () => ({
      ALL: items.length,
      DRAFT: items.filter((a) => a.status === "DRAFT").length,
      PUBLISHED: items.filter((a) => a.status === "PUBLISHED").length,
    }),
    [items],
  );

  const filteredItems = useMemo(
    () => (filter === "ALL" ? items : items.filter((a) => a.status === filter)),
    [items, filter],
  );

  function flash(label: string) {
    setJustDone(label);
    setTimeout(() => setJustDone(null), 2500);
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["announcements"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  const createMutation = useMutation({
    mutationFn: ({ values, status }: { values: AnnouncementFormValues; status: "DRAFT" | "PUBLISHED" }) =>
      apiClient.post("/announcements", { ...toPayload(values), status }),
    onSuccess: (_data, { status }) => {
      setComposerOpen(false);
      flash(status === "DRAFT" ? "Draft saved" : "Published");
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) =>
      apiClient.patch(`/announcements/${editingItem?.id}`, toPayload(values)),
    onSuccess: () => {
      setComposerOpen(false);
      setEditingItem(null);
      flash("Updated");
      invalidate();
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/announcements/${id}/publish`),
    onSuccess: () => {
      setPublishTarget(null);
      flash("Published");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/announcements/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
  });

  function openCreate() {
    setEditingItem(null);
    setComposerOpen(true);
  }

  function openEdit(item: Announcement) {
    setEditingItem(item);
    setComposerOpen(true);
  }

  function closeComposer() {
    setComposerOpen(false);
    setEditingItem(null);
  }

  return {
    items: filteredItems,
    totalCount: items.length,
    isLoading,
    filter,
    setFilter,
    counts,
    composerOpen,
    editingItem,
    openCreate,
    openEdit,
    closeComposer,
    viewTarget,
    setViewTarget,
    deleteTarget,
    setDeleteTarget,
    publishTarget,
    setPublishTarget,
    justDone,
    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
  };
}
