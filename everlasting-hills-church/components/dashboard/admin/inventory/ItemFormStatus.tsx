import Field, { inputCls } from "./Field";
import { CONDITION_LABEL, STATUS_LABEL } from "./types";
import { useDepartmentOptions } from "./useDepartmentOptions";
import type { ItemFormData, SetItemField } from "./useAddItemForm";
import { Select } from "@/components/ui/select";

export default function ItemFormStatus({ data, set }: { data: ItemFormData; set: SetItemField }) {
  const departments = useDepartmentOptions();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Status">
        <Select
          aria-label="Status"
          value={data.status}
          onChange={(v) => set("status", v as ItemFormData["status"])}
          className={inputCls}
          options={Object.entries(STATUS_LABEL).map(([k, label]) => ({ value: k, label }))}
        />
      </Field>
      <Field label="Condition">
        <Select
          aria-label="Condition"
          value={data.condition}
          onChange={(v) => set("condition", v as ItemFormData["condition"])}
          className={inputCls}
          options={Object.entries(CONDITION_LABEL).map(([k, label]) => ({ value: k, label }))}
        />
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
        <Select
          aria-label="Assigned to (department)"
          value={data.assignedTo}
          onChange={(v) => set("assignedTo", v)}
          className={inputCls}
          options={[
            { value: "", label: "Unassigned" },
            ...departments.map((d) => ({ value: d.name, label: d.name })),
          ]}
        />
      </Field>
    </div>
  );
}
