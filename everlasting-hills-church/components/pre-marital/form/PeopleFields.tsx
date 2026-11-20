import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { PremaritalFormValues } from "@/lib/pre-marital/schema";
import { Field, borderFor, describedBy, inputCls } from "../Field";
import { ROLE_OPTIONS } from "@/lib/pre-marital/schema";
import { ChoiceGroup, Tick } from "./ChoiceGroup";

type Props = { register: UseFormRegister<PremaritalFormValues>; errors: FieldErrors<PremaritalFormValues>; role?: string };

/** What the other person is called on the form, once the applicant says which of the two they are. */
export function partnerTitle(role?: string) {
  return role === "GROOM" ? "The intending bride" : role === "BRIDE" ? "The intending groom" : "Your partner";
}
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
      <ChoiceGroup id="pmc-applicantRole" label="I am the" options={ROLE_OPTIONS} columns={2} error={err("applicantRole")} registration={props.register("applicantRole")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="pmc-applicantFirstName" label="Your first name" required error={err("applicantFirstName")}>
          <input type="text" autoComplete="given-name" {...input("applicantFirstName")} />
        </Field>
        <Field id="pmc-applicantLastName" label="Your last name" required error={err("applicantLastName")}>
          <input type="text" autoComplete="family-name" {...input("applicantLastName")} />
        </Field>
        <Field id="pmc-applicantEmail" label="Email address" required error={err("applicantEmail")} hint="You will sign in to your counselling dashboard with this">
          <input type="email" inputMode="email" autoComplete="email" {...input("applicantEmail")} />
        </Field>
        <Field id="pmc-applicantPhone" label="Phone number" required error={err("applicantPhone")} hint="Ideally on WhatsApp. It is also your first password">
          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" {...input("applicantPhone")} />
        </Field>
      </div>
    </fieldset>
  );
}

/** The person they plan to marry: name, their own email and phone (their dashboard sign-in), and their agreement to be contacted. */
export function PartnerFields(props: Props) {
  const { err, input } = fieldHelpers(props);
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold text-gray-900">{partnerTitle(props.role)}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="pmc-partnerFirstName" label="First name" required error={err("partnerFirstName")}>
          <input type="text" autoComplete="off" {...input("partnerFirstName")} />
        </Field>
        <Field id="pmc-partnerLastName" label="Last name" required error={err("partnerLastName")}>
          <input type="text" autoComplete="off" {...input("partnerLastName")} />
        </Field>
        <Field id="pmc-partnerEmail" label="Email address" required error={err("partnerEmail")} hint="Their own email. They sign in to their own dashboard with it">
          <input type="email" inputMode="email" autoComplete="off" {...input("partnerEmail")} />
        </Field>
        <Field id="pmc-partnerPhone" label="Phone number" required error={err("partnerPhone")} hint="Their own number. It is also their first password">
          <input type="tel" inputMode="tel" autoComplete="off" {...input("partnerPhone")} />
        </Field>
      </div>
      <p className="text-sm leading-relaxed text-gray-600">
        You will each get your own counselling dashboard, to follow the application and your sessions and to upload your documents. We will email you both how to sign in.
      </p>
      <Tick id="pmc-partnerConsentToContact" error={err("partnerConsentToContact")} registration={props.register("partnerConsentToContact")}>
        {props.role === "GROOM" ? "She knows" : props.role === "BRIDE" ? "He knows" : "My partner knows"} I am applying and is happy for the pastoral team to contact them.
      </Tick>
    </fieldset>
  );
}
