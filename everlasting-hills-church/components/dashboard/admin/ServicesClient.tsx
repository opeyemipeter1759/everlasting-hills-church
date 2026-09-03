"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";
import { useServices } from "./services-client/useServices";
import type { ServiceRow } from "./services-client/types";
import NewServicePanel from "./services-client/NewServicePanel";
import EditServiceModal from "./services-client/EditServiceModal";
import ServicesGrid from "./services-client/ServicesGrid";

const PAGE_SIZE_OPTIONS = [12, 24, 48];
const DEFAULT_PAGE_SIZE = 12;

export default function ServicesClient() {
  const { services, isLoading, create, update, remove, toggle, exportCsv } = useServices();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const pageCount = Math.max(1, Math.ceil(services.length / pageSize));
  // Clamp back if creating/deleting a service shrinks the list below the page
  // we were sitting on.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const paged = useMemo(
    () => services.slice((page - 1) * pageSize, page * pageSize),
    [services, page, pageSize],
  );

  return (
    <div className="max-w-full mx-auto md:p-4 p-6 space-y-6">
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
        services={paged}
        isLoading={isLoading}
        toggle={toggle}
        exportCsv={exportCsv}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      {!isLoading && services.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-white/40 order-2 sm:order-1">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, services.length)} of {services.length}
          </p>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            <Select
              aria-label="Rows per page"
              value={String(pageSize)}
              onChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer"
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
            />
          </div>
        </div>
      )}

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
