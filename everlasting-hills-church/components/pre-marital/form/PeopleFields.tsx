import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { PremaritalFormValues } from "@/lib/pre-marital/schema";
import { Field, borderFor, describedBy, inputCls } from "../Field";
import { Tick } from "./ChoiceGroup";

type Props = { register: UseFormRegister<PremaritalFormValues>; errors: FieldErrors<PremaritalFormValues> };
type Key = keyof PremaritalFormValues;

function fieldHelpers({ register, errors }: Props) {
  const err = (k: Key) => errors[k]?.message as string | undefined;
  const input = (k: Key) => ({ ...describedBy(`pmc-${k}`, err(k)), ...register(k), className: `${inputCls} ${borderFor(err(k))}` });
  return { err, input };
}

/** The person filling in the form. */
export function ApplicantFields(props: Props) {
  const { err, input } = fieldHelpers(props);
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold text-gray-900">About you</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="pmc-applicantFirstName" label="First name" required error={err("applicantFirstName")}>
          <input type="text" autoComplete="given-name" {...input("applicantFirstName")} />
        </Field>
        <Field id="pmc-applicantLastName" label="Last name" required error={err("applicantLastName")}>
          <input type="text" autoComplete="family-name" {...input("applicantLastName")} />
        </Field>
        <Field id="pmc-applicantEmail" label="Email address" required error={err("applicantEmail")}>
          <input type="email" inputMode="email" autoComplete="email" {...input("applicantEmail")} />
        </Field>
        <Field id="pmc-applicantPhone" label="Phone number" required error={err("applicantPhone")} hint="Ideally the number on WhatsApp">
          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" {...input("applicantPhone")} />
        </Field>
      </div>
    </fieldset>
  );
}

/** The person they plan to marry: a name, one way to reach them, and their agreement to be contacted. */
export function PartnerFields(props: Props) {
  const { err, input } = fieldHelpers(props);
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold text-gray-900">Your partner</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="pmc-partnerFirstName" label="First name" required error={err("partnerFirstName")}>
          <input type="text" autoComplete="off" {...input("partnerFirstName")} />
        </Field>
        <Field id="pmc-partnerLastName" label="Last name" required error={err("partnerLastName")}>
          <input type="text" autoComplete="off" {...input("partnerLastName")} />
        </Field>
        <Field id="pmc-partnerPhone" label="Phone number" error={err("partnerPhone")} hint="A phone number or an email, whichever they prefer">
          <input type="tel" inputMode="tel" autoComplete="off" {...input("partnerPhone")} />
        </Field>
        <Field id="pmc-partnerEmail" label="Email address" error={err("partnerEmail")}>
          <input type="email" inputMode="email" autoComplete="off" {...input("partnerEmail")} />
        </Field>
      </div>
      <Tick id="pmc-partnerConsentToContact" error={err("partnerConsentToContact")} registration={props.register("partnerConsentToContact")}>
        My partner knows I am applying and is happy for the pastoral team to contact them.
      </Tick>
    </fieldset>
  );
}
