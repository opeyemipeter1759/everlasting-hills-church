"use client";

import Modal from "@/components/ui/overlay/Modal";
import Loader from "@/components/ui/feedback/Loader";
import ItemFormBasics from "./ItemFormBasics";
import ItemFormStatus from "./ItemFormStatus";
import ItemFormPurchase from "./ItemFormPurchase";
import ItemFormPhotoNotes from "./ItemFormPhotoNotes";
import type { InventoryApi } from "./useInventory";
import { useAddItemForm } from "./useAddItemForm";

export default function AddItemModal({
  open,
  onClose,
  create,
}: {
  open: boolean;
  onClose: () => void;
  create: InventoryApi["create"];
}) {
  const { data, set, canSave, submit, saving } = useAddItemForm(create, onClose);

  return (
    <Modal open={open} onClose={onClose} title="Add inventory item" maxWidth="lg">
      <div className="space-y-5">
        <ItemFormBasics data={data} set={set} />
        <ItemFormStatus data={data} set={set} />
        <ItemFormPurchase data={data} set={set} />
        <ItemFormPhotoNotes data={data} set={set} />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader size="xs" />}
            {saving ? "Adding…" : "Add Item"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
