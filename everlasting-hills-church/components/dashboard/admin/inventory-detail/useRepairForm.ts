import { useState } from "react";
import type { RepairStatus } from "../inventory/types";
import type { InventoryDetailApi } from "./useInventoryDetail";

export interface RepairFormData {
  description: string;
  resolution: string;
  cost: string;
  performedBy: string;
  status: RepairStatus;
}

export type SetRepairField = <K extends keyof RepairFormData>(key: K, value: RepairFormData[K]) => void;

const EMPTY: RepairFormData = {
  description: "",
  resolution: "",
  cost: "",
  performedBy: "",
  status: "PENDING",
};

export function useRepairForm(logRepair: InventoryDetailApi["logRepair"], onDone: () => void) {
  const [data, setData] = useState<RepairFormData>(EMPTY);
  const set: SetRepairField = (key, value) => setData((d) => ({ ...d, [key]: value }));

  const canSave = data.description.trim().length >= 2 && !logRepair.isPending;

  function submit() {
    logRepair.mutate(
      {
        description: data.description.trim(),
        resolution: data.resolution.trim() || undefined,
        cost: data.cost ? Number(data.cost) : undefined,
        performedBy: data.performedBy.trim() || undefined,
        status: data.status,
      },
      {
        onSuccess: () => {
          setData(EMPTY);
          onDone();
        },
      },
    );
  }

  return { data, set, canSave, submit, saving: logRepair.isPending };
}
