import FileUpload from "@/components/ui/form/FileUpload";
import Field from "./Field";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormFlyer({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <Field label="Flyer image">
      <FileUpload
        type="image"
        endpoint="/uploads/image"
        value={data.flyerImageUrl}
        onChange={(url) => set("flyerImageUrl", url)}
      />
      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">
        Used as the hero background and the card thumbnail.
      </p>
    </Field>
  );
}
