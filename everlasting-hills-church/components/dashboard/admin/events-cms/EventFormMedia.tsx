import FileUpload from "@/components/ui/form/FileUpload";
import Field from "./Field";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormMedia({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Field label="Cover / poster image">
        <FileUpload type="image" endpoint="/uploads/image" value={data.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} />
        <p className="mt-1.5 text-[11px] text-gray-400">Shown in full with its original aspect ratio. Best for artwork containing text.</p>
      </Field>
      <Field label="Hero / banner image">
        <FileUpload type="image" endpoint="/uploads/image" value={data.heroImageUrl} onChange={(url) => set("heroImageUrl", url)} />
        <p className="mt-1.5 text-[11px] text-gray-400">Optional wide image. It may be cropped responsively.</p>
      </Field>
      <Field label="Social sharing image">
        <FileUpload type="image" endpoint="/uploads/image" value={data.socialImageUrl} onChange={(url) => set("socialImageUrl", url)} />
        <p className="mt-1.5 text-[11px] text-gray-400">Optional. Falls back to the hero or poster image.</p>
      </Field>
    </div>
  );
}
