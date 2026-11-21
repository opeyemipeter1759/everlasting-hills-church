import type { FieldErrors, UseFormRegister } from "react-hook-form";
import {
  CONTACT_OPTIONS,
  MEMBERSHIP_OPTIONS,
  lagosToday,
  type PremaritalFormValues,
} from "@/lib/pre-marital/schema";
import { Field, borderFor, describedBy, inputCls } from "../Field";
import { ChoiceGroup, Tick } from "./ChoiceGroup";

/** Membership, the wedding date, how to reach them, a short hello, and agreeing to the privacy policy. */
export function DetailsFields({
  register,
  errors,
}: {
  register: UseFormRegister<PremaritalFormValues>;
  errors: FieldErrors<PremaritalFormValues>;
}) {
  const err = (k: keyof PremaritalFormValues) =>
    errors[k]?.message as string | undefined;
  return (
    <fieldset className="space-y-5">
      <legend className="text-lg font-bold text-gray-900">
        The two of you
      </legend>
      <ChoiceGroup
        id="pmc-membership"
        label="Are you members of Everlasting Hills?"
        options={MEMBERSHIP_OPTIONS}
        error={err("membership")}
        registration={register("membership")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="pmc-weddingDate"
          label="Planned wedding date"
          error={err("weddingDate")}
          hint="Leave it blank if you have not set one"
        >
          <input
            type="date"
            min={lagosToday()}
            {...describedBy("pmc-weddingDate", err("weddingDate"))}
            {...register("weddingDate")}
            className={`${inputCls} ${borderFor(err("weddingDate"))}`}
          />
        </Field>
      </div>

      <ChoiceGroup
        id="pmc-preferredContact"
        label="How should we contact you?"
        options={CONTACT_OPTIONS}
        columns={3}
        error={err("preferredContact")}
        registration={register("preferredContact")}
      />

      <Field
        id="pmc-intro"
        label="Tell us a little about yourselves"
        error={err("intro")}
        hint="Optional, up to 500 characters. Please keep it brief and do not share anything sensitive here; you can talk about that in person."
      >
        <textarea
          rows={3}
          maxLength={500}
          {...describedBy("pmc-intro", err("intro"))}
          {...register("intro")}
          className={`${inputCls} ${borderFor(err("intro"))}`}
        />
      </Field>

      <Tick
        id="pmc-privacyAcknowledged"
        error={err("privacyAcknowledged")}
        registration={register("privacyAcknowledged")}
      >
        I agree to the church&apos;s{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-church-maroon underline"
        >
          Privacy Policy
        </a>
        .
      </Tick>
    </fieldset>
  );
}
