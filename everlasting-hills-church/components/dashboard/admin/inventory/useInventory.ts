import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { showToast } from "@/components/ui/toast/toast";
import type {
  InventoryCondition,
  InventoryFiltersData,
  InventoryItem,
  InventoryStatsData,
  InventoryStatus,
} from "./types";

export interface InventoryQuery {
  category?: string;
  status?: InventoryStatus | "";
  condition?: InventoryCondition | "";
  location?: string;
  search?: string;
}

export interface InventoryItemInput {
  name: string;
  category: string;
  serialNumber?: string;
  location?: string;
  status?: InventoryStatus;
  condition?: InventoryCondition;
  quantity?: number;
  purchaseDate?: string;
  purchaseValue?: number;
  assignedTo?: string;
  photoUrl?: string;
  notes?: string;
  vendor?: string;
}

function clean(params: InventoryQuery): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) out[k] = String(v);
  }
  return out;
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message ?? fallback;
}

export function useInventory(query: InventoryQuery) {
  const qc = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["inventory", "list", query],
    queryFn: () => api.get<InventoryItem[]>("/inventory", clean(query)),
  });

  const filtersQuery = useQuery({
    queryKey: ["inventory", "filters"],
    queryFn: () => api.get<InventoryFiltersData>("/inventory/filters"),
  });

  const statsQuery = useQuery({
    queryKey: ["inventory", "stats"],
    queryFn: () => api.get<InventoryStatsData>("/inventory/stats"),
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["inventory", "list"] });
    qc.invalidateQueries({ queryKey: ["inventory", "stats"] });
    qc.invalidateQueries({ queryKey: ["inventory", "filters"] });
  }

  const create = useMutation({
    mutationFn: (input: InventoryItemInput) => api.post("/inventory", input),
    onSuccess: () => {
      showToast.success("Item added");
      invalidateAll();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't add item")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      showToast.success("Item deleted");
      invalidateAll();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't delete item")),
  });

  return {
    items: itemsQuery.data ?? [],
    isLoading: itemsQuery.isLoading,
    filters: filtersQuery.data,
    stats: statsQuery.data,
    create,
    remove,
  };
}

export type InventoryApi = ReturnType<typeof useInventory>;
