import Field, { inputCls } from "./Field";
import type { ItemFormData, SetItemField } from "./useAddItemForm";

export default function ItemFormPurchase({ data, set }: { data: ItemFormData; set: SetItemField }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Purchase date">
        <input
          type="date"
          value={data.purchaseDate}
          onChange={(e) => set("purchaseDate", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Purchase value (₦)">
        <input
          type="number"
          min={0}
          value={data.purchaseValue}
          onChange={(e) => set("purchaseValue", e.target.value)}
          placeholder="450000"
          className={inputCls}
        />
      </Field>
      <Field label="Vendor / supplier">
        <input
          value={data.vendor}
          onChange={(e) => set("vendor", e.target.value)}
          placeholder="Gospel Music Store"
          className={inputCls}
        />
      </Field>
    </div>
  );
}
