"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Users, ChevronRight, UserCog, RefreshCw, Layers, Plus, X, Pencil, Trash2 } from "lucide-react";
import {
  useDepartments,
  useAssignUnits,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  type UnassignedUnit,
  type DepartmentListItem,
} from "@/lib/api/departments";
import { Avatar } from "./HeadPicker";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";

export default function DepartmentsConsole() {
  const q = useDepartments();
  const [showCreate, setShowCreate] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentListItem | null>(null);
  const [deletingDept, setDeletingDept] = useState<DepartmentListItem | null>(null);

  return (
    <div className="px-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Departments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            Administrative structures. Each Admin Head oversees the units grouped under their department.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => q.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-3 py-3 text-xs font-semibold text-white hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={13} /> Add Department
          </button>
        </div>
      </div>

      {/* Create department modal */}
      {showCreate && (
        <CreateDepartmentForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); q.refetch(); }} />
      )}

      {/* Edit department modal */}
      {editingDept && (
        <EditDepartmentForm
          department={editingDept}
          onClose={() => setEditingDept(null)}
          onUpdated={() => { setEditingDept(null); q.refetch(); }}
        />
      )}

      {/* Delete department confirmation */}
      {deletingDept && (
        <DeleteDepartmentConfirm
          department={deletingDept}
          onClose={() => setDeletingDept(null)}
          onDeleted={() => { setDeletingDept(null); q.refetch(); }}
        />
      )}

      {/* Department grid */}
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.departments.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/admin/departments/${d.id}`}
              className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 transition-all hover:-translate-y-0.5 hover:border-[#87102C]/30 hover:shadow-[0_8px_30px_rgba(135,16,44,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]">
                  <Building2 size={12} /> {d.code}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingDept(d); }}
                    className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={`Edit ${d.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingDept(d); }}
                    className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-0.5 dark:text-white/20" />
                </div>
              </div>
              <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-white">{d.name}</h2>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                {d.head ? (
                  <>
                    <Avatar name={d.head.name} photoUrl={d.head.photoUrl} px={28} />
                    <span className="truncate text-sm font-semibold text-gray-800 dark:text-white/80">{d.head.name}</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-white/40">
                    <UserCog size={15} /> No head assigned
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-gray-400 dark:text-white/40">
                <span className="inline-flex items-center gap-1"><Layers size={12} /> {d.unitCount} unit{d.unitCount === 1 ? "" : "s"}</span>
                <span className="inline-flex items-center gap-1"><Users size={12} /> {d.memberCount} member{d.memberCount === 1 ? "" : "s"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Unassigned units */}
      {q.data && q.data.unassignedUnits.length > 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={16} className="text-gray-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
              Unassigned units ({q.data.unassignedUnits.length})
            </h2>
          </div>
          <p className="mb-4 text-xs text-gray-400 dark:text-white/40">
            These units are not yet grouped under a department. Assign each one deliberately.
          </p>
          <ul className="space-y-2">
            {q.data.unassignedUnits.map((u) => (
              <QuickAssignRow key={u.id} unit={u} departments={q.data!.departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CreateDepartmentForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const create = useCreateDepartment();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    try {
      await create.mutateAsync({ code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || undefined });
      showToast.success(`Department "${name.trim()}" created`);
      onCreated();
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Failed to create department");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Department</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60">
              Department Code <span className="text-red-400">*</span>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. WORSHIP"
              maxLength={20}
              required
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 text-sm font-mono font-semibold uppercase text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60">
              Department Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Worship & Music"
              required
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this department's role…"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending || !code.trim() || !name.trim()}
              className="flex-1 rounded-xl bg-[#87102C] py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-colors"
            >
              {create.isPending ? "Creating…" : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDepartmentForm({
  department,
  onClose,
  onUpdated,
}: {
  department: DepartmentListItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const update = useUpdateDepartment(department.id);
  const [name, setName] = useState(department.name);
  const [description, setDescription] = useState(department.description ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await update.mutateAsync({ name: name.trim(), description: description.trim() || null });
      showToast.success(`Department "${name.trim()}" updated`);
      onUpdated();
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Failed to update department");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Department</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60">
              Department Code
            </label>
            <input
              value={department.code}
              disabled
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm font-mono font-semibold uppercase text-gray-400 dark:text-white/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60">
              Department Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Worship & Music"
              required
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this department's role…"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={update.isPending || !name.trim()}
              className="flex-1 rounded-xl bg-[#87102C] py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-colors"
            >
              {update.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteDepartmentConfirm({
  department,
  onClose,
  onDeleted,
}: {
  department: DepartmentListItem;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const del = useDeleteDepartment();

  async function handleDelete() {
    try {
      await del.mutateAsync(department.id);
      showToast.success(`Department "${department.name}" deleted`);
      onDeleted();
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Failed to delete department");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delete Department</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <p className="mb-5 text-sm text-gray-600 dark:text-white/60">
          Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{department.name}</span>?
          Its {department.unitCount} unit{department.unitCount === 1 ? "" : "s"} will become unassigned. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={del.isPending}
            onClick={handleDelete}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {del.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAssignRow({
  unit,
  departments,
}: {
  unit: UnassignedUnit;
  departments: { id: string; code: string; name: string }[];
}) {
  const [deptId, setDeptId] = useState("");
  const assign = useAssignUnits(deptId);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{unit.name}</p>
        <p className="text-[11px] text-gray-400">{unit.memberCount} member{unit.memberCount === 1 ? "" : "s"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          aria-label="Assign to department"
          value={deptId}
          onChange={setDeptId}
          className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
          options={[
            { value: "", label: "Assign to…" },
            ...departments.map((d) => ({ value: d.id, label: `${d.code}: ${d.name}` })),
          ]}
        />
        <button
          type="button"
          disabled={!deptId || assign.isPending}
          onClick={() => assign.mutate([unit.id])}
          className="rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40"
        >
          {assign.isPending ? "…" : "Assign"}
        </button>
      </div>
    </li>
  );
}
