"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useServices } from "./services-client/useServices";
import type { ServiceRow } from "./services-client/types";
import NewServicePanel from "./services-client/NewServicePanel";
import EditServiceModal from "./services-client/EditServiceModal";
import ServicesGrid from "./services-client/ServicesGrid";

export default function ServicesClient() {
  const { services, isLoading, create, update, remove, toggle, exportCsv } = useServices();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null);

  return (
    <div className="max-w-6xl mx-auto md:p-4 p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Services</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            Create sessions, open or close check-in, and export attendance.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors"
        >
          <Plus size={16} />
          New Service
        </button>
      </div>

      <NewServicePanel open={showForm} create={create} onClose={() => setShowForm(false)} />

      <ServicesGrid
        services={services}
        isLoading={isLoading}
        toggle={toggle}
        exportCsv={exportCsv}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      <EditServiceModal service={editTarget} onClose={() => setEditTarget(null)} update={update} />

      <ConfirmDialog
        open={!!deleteTarget}
        tone="danger"
        title="Delete service?"
        description={
          <>
            This permanently deletes <span className="font-semibold">{deleteTarget?.name}</span> and all its
            check-in records. This cannot be undone.
          </>
        }
        confirmLabel="Delete service"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
