import FileUpload from "@/components/ui/form/FileUpload";
import Field, { inputCls } from "./Field";
import type { ItemFormData, SetItemField } from "./useAddItemForm";

export default function ItemFormPhotoNotes({ data, set }: { data: ItemFormData; set: SetItemField }) {
  return (
    <>
      <Field label="Photo">
        <FileUpload type="image" endpoint="/uploads/image" value={data.photoUrl} onChange={(url) => set("photoUrl", url)} />
      </Field>
      <Field label="Notes">
        <textarea
          rows={3}
          value={data.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anything else worth noting about this item…"
          className={`${inputCls} resize-y`}
          maxLength={2000}
        />
      </Field>
    </>
  );
}
