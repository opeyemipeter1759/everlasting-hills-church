"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  PLEDGE_METHOD_LABEL,
  formatNaira,
  useSubmitPledge,
  type Pledge,
  type PledgeInput,
  type PledgeMethod,
} from "@/lib/api/pledges";
import { userMessageForError } from "@/lib/api/user-message";

/**
 * The Financial Pledge Form for the Sound & Media Project, with the church's
 * own wording. Opened from the appeal on the member home page.
 */

export const PLEDGE_INTRO =
  "We are inviting members, friends, and partners of the church to prayerfully support the Sound & Media Project financially. Your support will help strengthen our sound, media, recording, streaming, and technical facilities for effective worship and ministry. Please complete this form to indicate your financial pledge and expected timeline for fulfilling it.";

export const PLEDGE_CONFIRMATION =
  "I confirm that the amount stated above represents my intended financial support towards the Sound & Media Project. I have provided my expected timeline for fulfilling this pledge and will communicate with the project team if my circumstances change.";

const METHODS: PledgeMethod[] = ["ONE_TIME", "WEEKLY", "MONTHLY", "OTHER"];

interface Values {
  fullName: string;
  phone: string;
  email: string;
  amount: string;
  method: PledgeMethod | "";
  methodOther: string;
  installmentAmount: string;
  completeBy: string;
  contactMe: "yes" | "no" | "";
  confirmed: boolean;
}

type Errors = Partial<Record<keyof Values, string>>;

const FIELD_ORDER: (keyof Values)[] = [
  "fullName", "phone", "email", "amount", "method", "methodOther",
  "installmentAmount", "completeBy", "contactMe", "confirmed",
];

const inInstallments = (method: Values["method"]) => method === "WEEKLY" || method === "MONTHLY";

/** Today in Lagos, as YYYY-MM-DD. */
export const lagosToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function validate(values: Values, today: string): Errors {
  const errors: Errors = {};
  const amount = Number(values.amount);
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name";
  if (!/^\+?[0-9][0-9 ()-]{6,19}$/.test(values.phone.trim())) {
    errors.phone = "Enter your WhatsApp number, for example 0810 235 5043";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email address";
  if (!amount) errors.amount = "Enter the amount you would like to pledge";
  else if (amount > 10_000_000_000) errors.amount = "The maximum pledge is ₦10 billion";
  if (!values.method) errors.method = "Choose how you intend to redeem your pledge";
  if (values.method === "OTHER" && !values.methodOther.trim()) {
    errors.methodOther = "Tell us how you intend to redeem your pledge";
  }
  if (inInstallments(values.method)) {
    const each = Number(values.installmentAmount);
    if (!each) errors.installmentAmount = "Enter the amount you expect to give per installment";
    else if (amount && each > amount) errors.installmentAmount = "An installment can't be more than the whole pledge";
  }
  if (!values.completeBy) errors.completeBy = "Choose your expected completion date";
  else if (values.completeBy < today) errors.completeBy = "Choose a date from today onwards";
  if (!values.contactMe) errors.contactMe = "Choose yes or no";
  if (!values.confirmed) errors.confirmed = "Please tick the pledge confirmation";
  return errors;
}

const digitsOnly = (value: string) => value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11);
const grouped = (digits: string) => (digits ? Number(digits).toLocaleString("en-NG") : "");

function errorMessage(error: unknown) {
  return userMessageForError(
    error,
    "Your pledge couldn't be sent. Check your connection and try again.",
  );
}

const inputClassFor = (publicView: boolean) =>
  publicView
    ? "block min-h-12 w-full rounded-xl border bg-white px-3.5 text-base text-gray-900 outline-none transition focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/20"
    : "block min-h-12 w-full rounded-xl border bg-white px-3.5 text-base text-gray-900 outline-none transition focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/20 dark:bg-white/5 dark:text-white";
const borderFor = (error: string | undefined, publicView: boolean) =>
  error
    ? publicView ? "border-red-400" : "border-red-400 dark:border-red-400/70"
    : publicView ? "border-gray-300" : "border-gray-300 dark:border-white/15";
const labelClassFor = (publicView: boolean) =>
  publicView
    ? "block text-sm font-semibold text-gray-800"
    : "block text-sm font-semibold text-gray-800 dark:text-white/90";
const requiredClassFor = (publicView: boolean) =>
  publicView ? "text-[#87102C]" : "text-[#87102C] dark:text-rose-300";
const errorClassFor = (publicView: boolean) =>
  publicView
    ? "text-sm font-medium text-red-600"
    : "text-sm font-medium text-red-600 dark:text-red-300";

function Field({
  id,
  label,
  hint,
  error,
  publicView,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  publicView: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClassFor(publicView)}>
        {label} <span className={requiredClassFor(publicView)} aria-hidden="true">*</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className={publicView ? "text-xs text-gray-500" : "text-xs text-gray-500 dark:text-white/50"}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className={errorClassFor(publicView)}>
          {error}
        </p>
      )}
    </div>
  );
}

interface PledgeFormProps {
  existing: Pledge | null;
  prefill: { fullName: string; phone: string; email: string };
  onSaved: (pledge: Pledge) => void;
  access?: "member" | "public";
}

export default function PledgeForm({ existing, prefill, onSaved, access = "member" }: PledgeFormProps) {
  const today = lagosToday();
  const publicView = access === "public";
  const submit = useSubmitPledge(undefined, access);
  const [values, setValues] = useState<Values>(() =>
    existing
      ? {
          fullName: existing.fullName,
          phone: existing.phone,
          email: existing.email,
          amount: String(existing.amount),
          method: existing.method,
          methodOther: existing.methodOther ?? "",
          installmentAmount: existing.installmentAmount ? String(existing.installmentAmount) : "",
          // A pledge updated after its old date passed needs a new one.
          completeBy: existing.completeBy >= today ? existing.completeBy : "",
          contactMe: existing.contactMe ? "yes" : "no",
          confirmed: false,
        }
      : {
          ...prefill,
          amount: "",
          method: "",
          methodOther: "",
          installmentAmount: "",
          completeBy: "",
          contactMe: "",
          confirmed: false,
        },
  );
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(values, today) : {};

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const describedBy = (id: string, error?: string, hint?: boolean) =>
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

  const amount = Number(values.amount);
  const each = Number(values.installmentAmount);
  const installmentCount = inInstallments(values.method) && amount && each && each <= amount
    ? Math.ceil(amount / each)
    : 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(values, today);
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) {
      document.getElementById(`pledge-${first}`)?.focus();
      return;
    }
    const input: PledgeInput = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      amount,
      method: values.method as PledgeMethod,
      ...(values.method === "OTHER" ? { methodOther: values.methodOther.trim() } : {}),
      ...(inInstallments(values.method) ? { installmentAmount: each } : {}),
      completeBy: values.completeBy,
      contactMe: values.contactMe === "yes",
      confirmed: true,
    };
    try {
      onSaved(await submit.mutateAsync(input));
    } catch {
      // Shown below the submit button.
    }
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="space-y-6 p-5 sm:p-7"
      style={publicView ? { colorScheme: "light" } : undefined}
    >
      <Field id="pledge-fullName" label="Full Name" error={errors.fullName} publicView={publicView}>
        <input
          id="pledge-fullName"
          autoComplete="name"
          value={values.fullName}
          onChange={(event) => set("fullName", event.target.value)}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy("pledge-fullName", errors.fullName)}
          className={`${inputClassFor(publicView)} ${borderFor(errors.fullName, publicView)}`}
        />
      </Field>

      <Field id="pledge-phone" label="Phone Number (WhatsApp Number)" error={errors.phone} publicView={publicView}>
        <input
          id="pledge-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(event) => set("phone", event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("pledge-phone", errors.phone)}
          className={`${inputClassFor(publicView)} ${borderFor(errors.phone, publicView)}`}
        />
      </Field>

      <Field id="pledge-email" label="Email Address" error={errors.email} publicView={publicView}>
        <input
          id="pledge-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => set("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("pledge-email", errors.email)}
          className={`${inputClassFor(publicView)} ${borderFor(errors.email, publicView)}`}
        />
      </Field>

      <Field
        id="pledge-amount"
        label="How much would you like to pledge towards the project?"
        error={errors.amount}
        publicView={publicView}
      >
        <div className="relative">
          <span className={publicView ? "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-bold text-gray-500" : "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-bold text-gray-500 dark:text-white/50"}>
            ₦
          </span>
          <input
            id="pledge-amount"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={grouped(values.amount)}
            onChange={(event) => set("amount", digitsOnly(event.target.value))}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("pledge-amount", errors.amount)}
            className={`${inputClassFor(publicView)} ${borderFor(errors.amount, publicView)} pl-8 text-lg font-bold tabular-nums`}
          />
        </div>
      </Field>

      <fieldset className="space-y-2" aria-describedby={errors.method ? "pledge-method-error" : undefined}>
        <legend className={labelClassFor(publicView)}>
          How do you intend to redeem your pledge?{" "}
          <span className={requiredClassFor(publicView)} aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {METHODS.map((method, index) => (
            <label
              key={method}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm font-medium transition ${
                values.method === method
                  ? publicView
                    ? "border-[#87102C] bg-[#FFF4F6] text-[#5c0a1e]"
                    : "border-[#87102C] bg-[#FFF4F6] text-[#5c0a1e] dark:border-rose-300/60 dark:bg-[#87102C]/20 dark:text-white"
                  : publicView
                    ? "border-gray-300 text-gray-700 hover:border-gray-400"
                    : "border-gray-300 text-gray-700 hover:border-gray-400 dark:border-white/15 dark:text-white/80"
              }`}
            >
              <input
                id={index === 0 ? "pledge-method" : undefined}
                type="radio"
                name="pledge-method"
                value={method}
                checked={values.method === method}
                onChange={() => set("method", method)}
                className="h-4 w-4 accent-[#87102C]"
              />
              {PLEDGE_METHOD_LABEL[method]}
            </label>
          ))}
        </div>
        {errors.method && (
          <p id="pledge-method-error" className={errorClassFor(publicView)}>
            {errors.method}
          </p>
        )}
      </fieldset>

      {values.method === "OTHER" && (
        <Field id="pledge-methodOther" label="Tell us how you intend to redeem it" error={errors.methodOther} publicView={publicView}>
          <input
            id="pledge-methodOther"
            value={values.methodOther}
            maxLength={160}
            onChange={(event) => set("methodOther", event.target.value)}
            aria-invalid={Boolean(errors.methodOther)}
            aria-describedby={describedBy("pledge-methodOther", errors.methodOther)}
            className={`${inputClassFor(publicView)} ${borderFor(errors.methodOther, publicView)}`}
          />
        </Field>
      )}

      {inInstallments(values.method) && (
        <Field
          id="pledge-installmentAmount"
          label="If you intend to pay in installments, what amount do you expect to give per installment?"
          error={errors.installmentAmount}
          publicView={publicView}
        >
          <div className="relative">
            <span className={publicView ? "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-bold text-gray-500" : "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-bold text-gray-500 dark:text-white/50"}>
              ₦
            </span>
            <input
              id="pledge-installmentAmount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={grouped(values.installmentAmount)}
              onChange={(event) => set("installmentAmount", digitsOnly(event.target.value))}
              aria-invalid={Boolean(errors.installmentAmount)}
              aria-describedby={describedBy("pledge-installmentAmount", errors.installmentAmount)}
              className={`${inputClassFor(publicView)} ${borderFor(errors.installmentAmount, publicView)} pl-8 font-bold tabular-nums`}
            />
          </div>
          {installmentCount > 0 && (
            <p className={publicView ? "text-xs text-gray-500" : "text-xs text-gray-500 dark:text-white/55"}>
              That&apos;s about {installmentCount} {values.method === "WEEKLY" ? "weekly" : "monthly"}{" "}
              {installmentCount === 1 ? "installment" : "installments"} of {formatNaira(each)}.
            </p>
          )}
        </Field>
      )}

      <Field
        id="pledge-completeBy"
        label="What is your expected date for completing/redeeming your pledge?"
        error={errors.completeBy}
        publicView={publicView}
      >
        <input
          id="pledge-completeBy"
          type="date"
          min={today}
          value={values.completeBy}
          onChange={(event) => set("completeBy", event.target.value)}
          aria-invalid={Boolean(errors.completeBy)}
          aria-describedby={describedBy("pledge-completeBy", errors.completeBy)}
          className={`${inputClassFor(publicView)} ${borderFor(errors.completeBy, publicView)}`}
        />
      </Field>

      <fieldset className="space-y-2" aria-describedby={errors.contactMe ? "pledge-contactMe-error" : undefined}>
        <legend className={labelClassFor(publicView)}>
          Would you like the project team to contact you regarding your pledge?{" "}
          <span className={requiredClassFor(publicView)} aria-hidden="true">*</span>
        </legend>
        <div className="flex gap-2">
          {(["yes", "no"] as const).map((answer, index) => (
            <label
              key={answer}
              className={`flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm font-medium transition sm:flex-none sm:px-6 ${
                values.contactMe === answer
                  ? publicView
                    ? "border-[#87102C] bg-[#FFF4F6] text-[#5c0a1e]"
                    : "border-[#87102C] bg-[#FFF4F6] text-[#5c0a1e] dark:border-rose-300/60 dark:bg-[#87102C]/20 dark:text-white"
                  : publicView
                    ? "border-gray-300 text-gray-700 hover:border-gray-400"
                    : "border-gray-300 text-gray-700 hover:border-gray-400 dark:border-white/15 dark:text-white/80"
              }`}
            >
              <input
                id={index === 0 ? "pledge-contactMe" : undefined}
                type="radio"
                name="pledge-contactMe"
                value={answer}
                checked={values.contactMe === answer}
                onChange={() => set("contactMe", answer)}
                className="h-4 w-4 accent-[#87102C]"
              />
              {answer === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
        {errors.contactMe && (
          <p id="pledge-contactMe-error" className={errorClassFor(publicView)}>
            {errors.contactMe}
          </p>
        )}
      </fieldset>

      <div
        className={`rounded-2xl border p-4 ${
          errors.confirmed
            ? publicView
              ? "border-red-400 bg-red-50/60"
              : "border-red-400 bg-red-50/60 dark:border-red-400/60 dark:bg-red-500/10"
            : publicView
              ? "border-[#f2b84b]/60 bg-[#fff8e8]"
              : "border-[#f2b84b]/60 bg-[#fff8e8] dark:border-[#f2b84b]/30 dark:bg-[#f2b84b]/10"
        }`}
      >
        <p className={publicView ? "text-xs font-black uppercase tracking-[0.14em] text-[#8a5a00]" : "text-xs font-black uppercase tracking-[0.14em] text-[#8a5a00] dark:text-[#f2c86b]"}>
          Pledge Confirmation
        </p>
        <label htmlFor="pledge-confirmed" className={publicView ? "mt-2 flex cursor-pointer gap-3 text-sm leading-relaxed text-gray-800" : "mt-2 flex cursor-pointer gap-3 text-sm leading-relaxed text-gray-800 dark:text-white/85"}>
          <input
            id="pledge-confirmed"
            type="checkbox"
            checked={values.confirmed}
            onChange={(event) => set("confirmed", event.target.checked)}
            aria-invalid={Boolean(errors.confirmed)}
            aria-describedby={errors.confirmed ? "pledge-confirmed-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#87102C]"
          />
          <span>{PLEDGE_CONFIRMATION}</span>
        </label>
        {errors.confirmed && (
          <p id="pledge-confirmed-error" className={`mt-2 ${errorClassFor(publicView)}`}>
            {errors.confirmed}
          </p>
        )}
      </div>

      <div className="space-y-3 pb-2">
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#87102C] px-6 text-base font-black text-white shadow-lg shadow-[#87102C]/25 transition hover:bg-[#6f0d24] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C]"
        >
          {submit.isPending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {submit.isPending ? "Sending your pledge…" : existing ? "Update my pledge" : "Submit my pledge"}
        </button>
        {submit.isError && (
          <p role="alert" className={errorClassFor(publicView)}>
            {errorMessage(submit.error)}
          </p>
        )}
      </div>
    </form>
  );
}
