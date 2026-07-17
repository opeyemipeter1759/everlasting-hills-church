import { useState } from "react";
import type { InventoryCondition, InventoryStatus } from "./types";
import type { InventoryApi } from "./useInventory";

export interface ItemFormData {
  name: string;
  category: string;
  serialNumber: string;
  location: string;
  assignedTo: string;
  status: InventoryStatus;
  condition: InventoryCondition;
  quantity: string;
  purchaseDate: string;
  purchaseValue: string;
  vendor: string;
  photoUrl: string;
  notes: string;
}

export type SetItemField = <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void;

const EMPTY: ItemFormData = {
  name: "",
  category: "",
  serialNumber: "",
  location: "",
  assignedTo: "",
  status: "IN_USE",
  condition: "NEW",
  quantity: "1",
  purchaseDate: "",
  purchaseValue: "",
  vendor: "",
  photoUrl: "",
  notes: "",
};

export function useAddItemForm(create: InventoryApi["create"], onDone: () => void) {
  const [data, setData] = useState<ItemFormData>(EMPTY);
  const set: SetItemField = (key, value) => setData((d) => ({ ...d, [key]: value }));

  const canSave = data.name.trim().length >= 2 && data.category.trim().length >= 2 && !create.isPending;

  function submit() {
    create.mutate(
      {
        name: data.name.trim(),
        category: data.category.trim(),
        serialNumber: data.serialNumber.trim() || undefined,
        location: data.location.trim() || undefined,
        assignedTo: data.assignedTo.trim() || undefined,
        status: data.status,
        condition: data.condition,
        quantity: Number(data.quantity) || 1,
        purchaseDate: data.purchaseDate || undefined,
        purchaseValue: data.purchaseValue ? Number(data.purchaseValue) : undefined,
        vendor: data.vendor.trim() || undefined,
        photoUrl: data.photoUrl || undefined,
        notes: data.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setData(EMPTY);
          onDone();
        },
      },
    );
  }

  return { data, set, canSave, submit, saving: create.isPending };
}
