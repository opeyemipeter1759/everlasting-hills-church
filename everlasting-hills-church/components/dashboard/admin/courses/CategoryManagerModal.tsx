"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import FormModal, { fieldCls, btnPrimary } from "@/components/ui/overlay/FormModal";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import {
  useCourseCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type CourseCategory,
} from "@/lib/api/courses";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export default function CategoryManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories = [] } = useCourseCategories();
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  async function handleAdd() {
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync({ name: name.trim(), parentId: parentId || null });
      showToast.success(`"${name.trim()}" added`);
      setName("");
      setParentId("");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't create category"));
    }
  }

  return (
    <FormModal open={open} title="Manage categories" subtitle="Organize the catalog into categories and subcategories" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3.5 space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
            className={fieldCls}
          />
          <div className="flex items-center gap-2">
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={fieldCls}>
              <option value="">— Top level —</option>
              {topLevel.map((c) => (
                <option key={c.id} value={c.id}>
                  Subcategory of {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!name.trim() || createCategory.isPending}
              className={`${btnPrimary} shrink-0 px-4`}
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>

        {topLevel.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No categories yet — add one above.</p>
        ) : (
          <ul className="space-y-1.5">
            {topLevel.map((c) => (
              <li key={c.id} className="space-y-1.5">
                <CategoryRow category={c} />
                {childrenOf(c.id).length > 0 && (
                  <ul className="ml-5 space-y-1.5 border-l border-gray-100 dark:border-white/10 pl-3">
                    {childrenOf(c.id).map((child) => (
                      <li key={child.id}>
                        <CategoryRow category={child} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormModal>
  );
}

function CategoryRow({ category }: { category: CourseCategory }) {
  const updateCategory = useUpdateCategory(category.id);
  const deleteCategory = useDeleteCategory();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveRename() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      setDraft(category.name);
      return;
    }
    try {
      await updateCategory.mutateAsync({ name: trimmed, parentId: category.parentId });
      showToast.success("Category renamed");
      setEditing(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't rename category"));
    }
  }

  async function handleDelete() {
    try {
      await deleteCategory.mutateAsync(category.id);
      showToast.success(`"${category.name}" deleted`);
      setConfirmDelete(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete category"));
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveRename()}
              className={`${fieldCls} py-1.5`}
            />
            <button type="button" onClick={saveRename} disabled={updateCategory.isPending} className="shrink-0 p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
              <Check size={15} />
            </button>
            <button type="button" onClick={() => { setEditing(false); setDraft(category.name); }} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">{category.name}</span>
            <span className="shrink-0 text-[11px] font-semibold text-gray-400">{category.courseCount} course{category.courseCount === 1 ? "" : "s"}</span>
            <button type="button" onClick={() => setEditing(true)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5">
              <Pencil size={14} />
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${category.name}"?`}
        description="This can't be undone. Categories with subcategories or courses assigned can't be deleted — move or delete those first."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteCategory.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
