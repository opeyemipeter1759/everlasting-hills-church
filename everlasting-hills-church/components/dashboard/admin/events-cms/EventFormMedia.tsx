import FileUpload from "@/components/ui/form/FileUpload";
import Field from "./Field";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormMedia({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Field label="Cover / poster image">
        <FileUpload type="image" endpoint="/uploads/image" value={data.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} />
        <p className="mt-1.5 text-[11px] text-gray-400">The main event artwork. Shown whole, never cropped, so wording on the design stays readable. Upload this one first.</p>
      </Field>
      <Field label="Hero / banner image">
        <FileUpload type="image" endpoint="/uploads/image" value={data.heroImageUrl} onChange={(url) => set("heroImageUrl", url)} />
        <p className="mt-1.5 text-[11px] text-gray-400">Optional wide photo for the top of the page. Leave it empty and the poster is used instead, blurred behind the title — so most events only need the poster above.</p>
      </Field>
      <Field label="Social sharing image">
        <FileUpload type="image" endpoint="/uploads/image" value={data.socialImageUrl} onChange={(url) => set("socialImageUrl", url)} />
        <p className="mt-1.5 text-[11px] text-gray-400">Optional. The picture shown when the event is shared on WhatsApp or Facebook — falls back to the banner, then the poster.</p>
      </Field>
    </div>
  );
}
