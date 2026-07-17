import Field, { inputCls } from "./Field";
import { CONDITION_LABEL, STATUS_LABEL } from "./types";
import { useDepartmentOptions } from "./useDepartmentOptions";
import type { ItemFormData, SetItemField } from "./useAddItemForm";

export default function ItemFormStatus({ data, set }: { data: ItemFormData; set: SetItemField }) {
  const departments = useDepartmentOptions();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Status">
        <select value={data.status} onChange={(e) => set("status", e.target.value as ItemFormData["status"])} className={inputCls}>
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Condition">
        <select
          value={data.condition}
          onChange={(e) => set("condition", e.target.value as ItemFormData["condition"])}
          className={inputCls}
        >
          {Object.entries(CONDITION_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Quantity">
        <input
          type="number"
          min={1}
          value={data.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Assigned to (department)">
        <select value={data.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} className={inputCls}>
          <option value="">Unassigned</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
