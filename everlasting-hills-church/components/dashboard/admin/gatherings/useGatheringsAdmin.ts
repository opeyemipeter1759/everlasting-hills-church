"use client";

import { useMemo, useState } from "react";
import {
  useAllGatherings,
  useCreateGathering,
  useDeleteGathering,
  useUpdateGathering,
  type Gathering,
} from "@/lib/api/gatherings";
import { emptyForm, fromGathering, toInput, type GatheringFilter, type GatheringFormValues } from "./types";

export function useGatheringsAdmin() {
  const [filter, setFilter] = useState<GatheringFilter>("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gathering | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gathering | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);

  const { data: items = [], isLoading, isError, refetch } = useAllGatherings();
  const createMutation = useCreateGathering();
  const updateMutation = useUpdateGathering();
  const deleteMutation = useDeleteGathering();

  const counts = useMemo(
    () => ({
      ALL: items.length,
      ACTIVE: items.filter((g) => g.isActive).length,
      INACTIVE: items.filter((g) => !g.isActive).length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (filter === "ACTIVE") return items.filter((g) => g.isActive);
    if (filter === "INACTIVE") return items.filter((g) => !g.isActive);
    return items;
  }, [items, filter]);

  function flash(label: string) {
    setJustDone(label);
    setTimeout(() => setJustDone(null), 2500);
  }

  function openCreate() {
    setEditingItem(null);
    setComposerOpen(true);
  }

  function openEdit(item: Gathering) {
    setEditingItem(item);
    setComposerOpen(true);
  }

  function closeComposer() {
    setComposerOpen(false);
    setEditingItem(null);
  }

  function submit(values: GatheringFormValues) {
    const body = toInput(values);

    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, ...body },
        {
          onSuccess: () => {
            closeComposer();
            flash("Schedule updated");
          },
        },
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: () => {
        closeComposer();
        flash("Gathering created");
      },
    });
  }

  /**
   * Deactivating is the reversible way to take a gathering off the member
   * dashboard, so it lives on the card as a one-click toggle and delete stays
   * behind a confirm.
   */
  function toggleActive(item: Gathering) {
    updateMutation.mutate(
      { id: item.id, isActive: !item.isActive },
      { onSuccess: () => flash(item.isActive ? "Paused" : "Resumed") },
    );
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        flash("Deleted");
      },
    });
  }

  return {
    items: filteredItems,
    totalCount: items.length,
    isLoading,
    isError,
    refetch,
    filter,
    setFilter,
    counts,
    composerOpen,
    editingItem,
    initialValues: editingItem ? fromGathering(editingItem) : emptyForm(),
    openCreate,
    openEdit,
    closeComposer,
    submit,
    saving: createMutation.isPending || updateMutation.isPending,
    /** Surfaced so the composer can show why a save did not land. */
    saveError: (createMutation.error ?? updateMutation.error) as Error | null,
    toggleActive,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    deleting: deleteMutation.isPending,
    justDone,
  };
}
