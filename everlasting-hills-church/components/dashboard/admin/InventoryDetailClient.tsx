"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Wrench } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useInventoryDetail } from "./inventory-detail/useInventoryDetail";
import ItemHero from "./inventory-detail/ItemHero";
import ItemMeta from "./inventory-detail/ItemMeta";
import SpendSummary from "./inventory-detail/SpendSummary";
import HistoryTimeline from "./inventory-detail/HistoryTimeline";
import LogRepairModal from "./inventory-detail/LogRepairModal";

export default function InventoryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { item, isLoading, error, logRepair, remove } = useInventoryDetail(id);
  const [showRepair, setShowRepair] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-5">
        <div className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        </div>
        <div className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm text-red-600 dark:text-red-400">
          {(error as { message?: string } | null)?.message ?? "Item not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <ItemHero item={item} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowRepair(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
        >
          <Wrench size={15} />
          Log Repair
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={15} />
          Delete Item
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <ItemMeta item={item} />
        <SpendSummary item={item} />
      </div>

      <HistoryTimeline history={item.history} />

      <LogRepairModal open={showRepair} onClose={() => setShowRepair(false)} logRepair={logRepair} />

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Delete this item?"
        description={
          <>
            This permanently deletes <span className="font-semibold">{item.name}</span> and its entire history. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete item"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.push("/dashboard/admin/inventory") })}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
