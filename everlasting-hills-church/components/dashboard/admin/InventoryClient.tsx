"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useInventory, type InventoryQuery } from "./inventory/useInventory";
import InventoryStats from "./inventory/InventoryStats";
import InventoryFilters from "./inventory/InventoryFilters";
import InventoryGrid from "./inventory/InventoryGrid";
import SkeletonGrid from "./inventory/SkeletonGrid";
import EmptyState from "./inventory/EmptyState";
import AddItemModal from "./inventory/AddItemModal";

export default function InventoryClient() {
  const router = useRouter();
  const [query, setQuery] = useState<InventoryQuery>({});
  const [showAdd, setShowAdd] = useState(false);
  const { items, isLoading, filters, stats, create } = useInventory(query);

  function patch(next: Partial<InventoryQuery>) {
    setQuery((q) => ({ ...q, ...next }));
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track church equipment, furniture, AV gear, and every repair made on them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
        >
          <Plus size={15} />
          New Item
        </button>
      </div>

      <InventoryStats stats={stats} />

      <InventoryFilters query={query} onChange={patch} filters={filters} />

      {isLoading ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <EmptyState hasAny={Object.values(query).some(Boolean)} />
      ) : (
        <InventoryGrid items={items} onOpen={(item) => router.push(`/dashboard/admin/inventory/${item.id}`)} />
      )}

      <AddItemModal open={showAdd} onClose={() => setShowAdd(false)} create={create} />
    </div>
  );
}
