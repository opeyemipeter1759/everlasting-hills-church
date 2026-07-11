import Field, { inputCls } from "./Field";
import type { ItemFormData, SetItemField } from "./useAddItemForm";

export default function ItemFormBasics({ data, set }: { data: ItemFormData; set: SetItemField }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Name *">
        <input
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Yamaha Keyboard"
          className={inputCls}
          maxLength={140}
        />
      </Field>
      <Field label="Category *">
        <input
          value={data.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="Musical Instruments"
          className={inputCls}
          maxLength={80}
        />
      </Field>
      <Field label="Serial number / asset tag">
        <input
          value={data.serialNumber}
          onChange={(e) => set("serialNumber", e.target.value)}
          placeholder="Optional — for high-value items"
          className={inputCls}
        />
      </Field>
      <Field label="Location">
        <input
          value={data.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Main Auditorium"
          className={inputCls}
        />
      </Field>
    </div>
  );
}
