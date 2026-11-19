import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { PreMaritalFormValues, Who } from "@/lib/pre-marital/schema";
import { Field, borderFor, describedBy, inputCls } from "./Field";

type Part = "FirstName" | "LastName" | "Phone" | "Email" | "IsMember";

/** One of the couple: name, how to reach them, and whether they are a member. */
export function PersonFields({
  who,
  register,
  errors,
}: {
  who: Who;
  register: UseFormRegister<PreMaritalFormValues>;
  errors: FieldErrors<PreMaritalFormValues>;
}) {
  const key = (part: Part) => `${who}${part}` as keyof PreMaritalFormValues;
  const err = (part: Part) => errors[key(part)]?.message as string | undefined;
  const id = (part: Part) => `pmc-${who}-${part}`;
  const input = (part: Part) => ({ ...describedBy(id(part), err(part)), ...register(key(part)), className: `${inputCls} ${borderFor(err(part))}` });

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold text-gray-900">{who === "groom" ? "The groom-to-be" : "The bride-to-be"}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id={id("FirstName")} label="First name" required error={err("FirstName")}>
          <input type="text" {...input("FirstName")} />
        </Field>
        <Field id={id("LastName")} label="Last name" required error={err("LastName")}>
          <input type="text" {...input("LastName")} />
        </Field>
        <Field id={id("Phone")} label="Phone number" required error={err("Phone")} hint="Ideally the number on WhatsApp">
          <input type="tel" inputMode="tel" placeholder="0803 123 4567" {...input("Phone")} />
        </Field>
        <Field id={id("Email")} label="Email address" required error={err("Email")}>
          <input type="email" inputMode="email" {...input("Email")} />
        </Field>
      </div>

      <div role="radiogroup" aria-labelledby={`${id("IsMember")}-label`} aria-describedby={err("IsMember") ? `${id("IsMember")}-error` : undefined}>
        <p id={`${id("IsMember")}-label`} className="mb-1.5 text-sm font-semibold text-gray-900">
          Member of Everlasting Hills Church?<span className="text-red-500" aria-hidden="true"> *</span>
        </p>
        <div className="flex gap-3">
          {(["YES", "NO"] as const).map((answer) => (
            <label
              key={answer}
              className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 text-sm font-medium text-gray-900 has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6] ${err("IsMember") ? "border-red-300" : "border-gray-200"}`}
            >
              <input type="radio" value={answer} className="h-4 w-4 accent-church-maroon" {...register(key("IsMember"))} />
              {answer === "YES" ? "Yes" : "No"}
            </label>
          ))}
        </div>
        {err("IsMember") && (
          <p id={`${id("IsMember")}-error`} role="alert" className="mt-1 text-sm text-red-600">
            {err("IsMember")}
          </p>
        )}
      </div>
    </fieldset>
  );
}
