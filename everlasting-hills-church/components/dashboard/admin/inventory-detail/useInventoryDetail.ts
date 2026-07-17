import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { showToast } from "@/components/ui/toast/toast";
import type { InventoryItemDetail, RepairStatus } from "../inventory/types";

export interface RepairInput {
  description: string;
  resolution?: string;
  cost?: number;
  performedBy?: string;
  status: RepairStatus;
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message ?? fallback;
}

export function useInventoryDetail(id: string) {
  const qc = useQueryClient();

  const itemQuery = useQuery({
    queryKey: ["inventory", "item", id],
    queryFn: () => api.get<InventoryItemDetail>(`/inventory/${id}`),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["inventory", "item", id] });
    qc.invalidateQueries({ queryKey: ["inventory", "list"] });
    qc.invalidateQueries({ queryKey: ["inventory", "stats"] });
  }

  const logRepair = useMutation({
    mutationFn: (input: RepairInput) => api.post(`/inventory/${id}/repairs`, input),
    onSuccess: () => {
      showToast.success("Repair logged");
      invalidate();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't log repair")),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      showToast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["inventory", "list"] });
      qc.invalidateQueries({ queryKey: ["inventory", "stats"] });
      qc.removeQueries({ queryKey: ["inventory", "item", id] });
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't delete item")),
  });

  return {
    item: itemQuery.data,
    isLoading: itemQuery.isLoading,
    error: itemQuery.error,
    logRepair,
    remove,
  };
}

export type InventoryDetailApi = ReturnType<typeof useInventoryDetail>;
