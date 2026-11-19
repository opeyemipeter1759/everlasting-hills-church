import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Select } from "@/components/ui/select";
import { RELATIONSHIP_OPTIONS, lagosToday, type PreMaritalFormValues } from "@/lib/pre-marital/schema";
import { Field, borderFor, describedBy, inputCls } from "./Field";

/** About the two of them together, all optional, and their agreement to apply. */
export function CoupleFields({
  register,
  control,
  errors,
}: {
  register: UseFormRegister<PreMaritalFormValues>;
  control: Control<PreMaritalFormValues>;
  errors: FieldErrors<PreMaritalFormValues>;
}) {
  const e = (k: keyof PreMaritalFormValues) => errors[k]?.message as string | undefined;
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold text-gray-900">The two of you</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="pmc-weddingDate" label="Planned wedding date" error={e("weddingDate")} hint="Leave it blank if you have not set one">
          <input
            type="date"
            min={lagosToday()}
            {...describedBy("pmc-weddingDate", e("weddingDate"))}
            {...register("weddingDate")}
            className={`${inputCls} ${borderFor(e("weddingDate"))}`}
          />
        </Field>
        <Field id="pmc-relationshipLength" label="How long have you known each other?" error={e("relationshipLength")}>
          <Controller
            control={control}
            name="relationshipLength"
            render={({ field }) => (
              <Select
                id="pmc-relationshipLength"
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose one (optional)"
                aria-label="How long have you known each other?"
                options={[...RELATIONSHIP_OPTIONS]}
                className={`${inputCls} ${borderFor(e("relationshipLength"))} bg-white text-left text-[#111]`}
              />
            )}
          />
        </Field>
      </div>

      <Field id="pmc-message" label="Anything you would like the pastors to know?" error={e("message")} hint="Optional. Up to 1,000 characters.">
        <textarea rows={4} {...describedBy("pmc-message", e("message"))} {...register("message")} className={`${inputCls} ${borderFor(e("message"))}`} />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 flex-shrink-0 accent-church-maroon"
            aria-invalid={e("consent") ? true : undefined}
            aria-describedby={e("consent") ? "pmc-consent-error" : undefined}
            {...register("consent")}
          />
          <span>
            We are applying together, and we are happy for the pastoral team to contact us both about this application.
            <span className="text-red-500" aria-hidden="true"> *</span>
          </span>
        </label>
        {e("consent") && (
          <p id="pmc-consent-error" role="alert" className="mt-1 text-sm text-red-600">
            {e("consent")}
          </p>
        )}
      </div>
    </fieldset>
  );
}
