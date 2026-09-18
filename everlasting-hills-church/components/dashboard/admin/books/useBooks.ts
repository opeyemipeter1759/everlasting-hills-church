import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import type { Book, BookCollection, BookFilter, BookFormValues } from "./types";

function toPayload(values: BookFormValues) {
  return {
    title: values.title.trim(),
    author: values.author.trim() || undefined,
    description: values.description.trim() || undefined,
    coverUrl: values.coverUrl || undefined,
    fileUrl: values.fileUrl,
    collectionId: values.collectionId,
  };
}

export function useBooks() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<BookFilter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Book | null>(null);
  const [createInCollectionId, setCreateInCollectionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<BookCollection | null>(null);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<BookCollection | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["books", "admin"],
    queryFn: async () => (await apiClient.get<Book[]>("/books")).data,
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ["book-collections", "admin"],
    queryFn: async () => (await apiClient.get<BookCollection[]>("/book-collections")).data,
  });

  const counts = useMemo(
    () => ({
      ALL: items.length,
      DRAFT: items.filter((b) => b.status === "DRAFT").length,
      PUBLISHED: items.filter((b) => b.status === "PUBLISHED").length,
    }),
    [items],
  );

  const filteredItems = useMemo(
    () => (filter === "ALL" ? items : items.filter((b) => b.status === filter)),
    [items, filter],
  );

  const groups = useMemo(() => {
    const byCollection = new Map<string, Book[]>();
    const uncategorized: Book[] = [];
    for (const b of filteredItems) {
      if (b.collectionId) {
        const list = byCollection.get(b.collectionId) ?? [];
        list.push(b);
        byCollection.set(b.collectionId, list);
      } else {
        uncategorized.push(b);
      }
    }
    const sections = collections.map((c) => ({ collection: c, books: byCollection.get(c.id) ?? [] }));
    return { sections, uncategorized };
  }, [filteredItems, collections]);

  function flash(label: string) {
    setJustDone(label);
    setTimeout(() => setJustDone(null), 2500);
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["books"] });
  }

  function invalidateCollections() {
    qc.invalidateQueries({ queryKey: ["book-collections"] });
    qc.invalidateQueries({ queryKey: ["books"] });
  }

  const createMutation = useMutation({
    mutationFn: ({ values, status }: { values: BookFormValues; status: "DRAFT" | "PUBLISHED" }) =>
      apiClient.post("/books", { ...toPayload(values), status }),
    onSuccess: (_data, { status }) => {
      setFormOpen(false);
      flash(status === "DRAFT" ? "Draft saved" : "Added to library");
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: BookFormValues) => apiClient.patch(`/books/${editingItem?.id}`, toPayload(values)),
    onSuccess: () => {
      setFormOpen(false);
      setEditingItem(null);
      flash("Updated");
      invalidate();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" }) =>
      apiClient.patch(`/books/${id}`, { status }),
    onSuccess: (_data, { status }) => {
      flash(status === "PUBLISHED" ? "Published" : "Unpublished");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/books/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      flash("Deleted");
      invalidate();
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: (name: string) => apiClient.post("/book-collections", { name }),
    onSuccess: () => {
      setCollectionModalOpen(false);
      flash("Collection added");
      invalidateCollections();
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: (name: string) => apiClient.patch(`/book-collections/${editingCollection?.id}`, { name }),
    onSuccess: () => {
      setCollectionModalOpen(false);
      setEditingCollection(null);
      flash("Collection renamed");
      invalidateCollections();
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/book-collections/${id}`),
    onSuccess: () => {
      setDeleteCollectionTarget(null);
      flash("Collection deleted");
      invalidateCollections();
    },
  });

  function openCreate(collectionId?: string) {
    setEditingItem(null);
    setCreateInCollectionId(collectionId ?? null);
    setFormOpen(true);
  }

  function openEdit(item: Book) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(null);
    setCreateInCollectionId(null);
  }

  function openNewCollection() {
    setEditingCollection(null);
    setCollectionModalOpen(true);
  }

  function openEditCollection(c: BookCollection) {
    setEditingCollection(c);
    setCollectionModalOpen(true);
  }

  function closeCollectionModal() {
    setCollectionModalOpen(false);
    setEditingCollection(null);
  }

  return {
    items: filteredItems,
    totalCount: items.length,
    isLoading,
    filter,
    setFilter,
    counts,
    collections,
    collectionsLoading,
    groups,
    formOpen,
    editingItem,
    createInCollectionId,
    openCreate,
    openEdit,
    closeForm,
    deleteTarget,
    setDeleteTarget,
    collectionModalOpen,
    editingCollection,
    openNewCollection,
    openEditCollection,
    closeCollectionModal,
    deleteCollectionTarget,
    setDeleteCollectionTarget,
    justDone,
    createMutation,
    updateMutation,
    toggleStatusMutation,
    deleteMutation,
    createCollectionMutation,
    updateCollectionMutation,
    deleteCollectionMutation,
  };
}
