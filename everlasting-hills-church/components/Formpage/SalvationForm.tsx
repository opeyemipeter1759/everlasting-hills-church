"use client";

import { useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/axios";

type Decision = "FIRST_TIME" | "REDEDICATION";

type FormValues = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  decision: Decision | "";
  location?: string;
  church_name?: string;
  interested_in_baptism?: boolean;
  message?: string;
};

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-black focus:border-church-maroon focus:outline-none";

function DecisionCard({
  value,
  label,
  description,
  register: reg,
  hasError,
}: {
  value: Decision;
  label: string;
  description: string;
  register: UseFormRegister<FormValues>;
  hasError?: boolean;
}) {
  return (
    <label
      className={
        "relative flex cursor-pointer select-none items-start gap-3 rounded-xl border-2 p-4 transition-all duration-150 has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6] " +
        (hasError ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white hover:border-gray-300")
      }
    >
      <input
        type="radio"
        value={value}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-church-maroon"
        {...reg("decision", { required: "Please tell us which this is" })}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-snug text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{description}</span>
      </span>
    </label>
  );
}

/**
 * A decision for Christ, recorded from the public site.
 *
 * Only the name and the decision itself are required. Someone responding in
 * the moment should not be turned away by a form — everything else is asked
 * because it helps the pastoral team reach them, not because it is needed to
 * accept the decision.
 */
export default function SalvationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const searchParams = useSearchParams();
  // Set when this was opened from an event page, so the team knows where the
  // decision came from. Absent everywhere else, which is fine.
  const eventSlug = searchParams.get("event") ?? undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onBlur" });

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    try {
      await apiClient.post("/forms/salvation", {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        decision: data.decision,
        ...(data.email?.trim() && { email: data.email.trim() }),
        ...(data.phone?.trim() && { phone: data.phone.trim() }),
        ...(data.location?.trim() && { location: data.location.trim() }),
        ...(data.church_name?.trim() && { church_name: data.church_name.trim() }),
        ...(data.interested_in_baptism !== undefined && {
          interested_in_baptism: Boolean(data.interested_in_baptism),
        }),
        ...(data.message?.trim() && { message: data.message.trim() }),
        ...(eventSlug && { event_slug: eventSlug }),
      });
      setSubmitted(true);
    } catch (err) {
      setServerError((err as { message?: string }).message ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="mt-5 flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-church-maroon/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#87102C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Welcome to the family</h2>
        <p className="max-w-sm leading-relaxed text-white/60">
          Heaven is rejoicing over you. Someone from the church will reach out personally — and if
          you gave us no contact details, you are still welcome at any gathering.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-5">
      <div className="mb-8 mt-20 text-center">
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">I Gave My Life to Christ</h1>
        <p className="text-sm text-white/70">
          Whether this is the first time or you are coming back to Him, tell us — we would love to
          walk with you from here.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 text-black sm:p-6"
      >
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">
            Which is this? <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
            <DecisionCard
              value="FIRST_TIME"
              label="Giving my life to Christ"
              description="For the first time."
              register={register}
              hasError={!!errors.decision}
            />
            <DecisionCard
              value="REDEDICATION"
              label="Rededicating my life"
              description="Coming back to Him."
              register={register}
              hasError={!!errors.decision}
            />
          </div>
          {errors.decision && (
            <p role="alert" className="text-sm text-red-500">
              {errors.decision.message}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="salvation-first" className="mb-2 block text-sm font-semibold">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              id="salvation-first"
              autoComplete="given-name"
              aria-invalid={!!errors.first_name}
              className={inputCls}
              {...register("first_name", { required: "Please tell us your first name" })}
            />
            {errors.first_name && (
              <p role="alert" className="mt-1 text-sm text-red-500">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="salvation-last" className="mb-2 block text-sm font-semibold">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              id="salvation-last"
              autoComplete="family-name"
              aria-invalid={!!errors.last_name}
              className={inputCls}
              {...register("last_name", { required: "Please tell us your last name" })}
            />
            {errors.last_name && (
              <p role="alert" className="mt-1 text-sm text-red-500">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="salvation-email" className="mb-2 block text-sm font-semibold">
              Email
            </label>
            <input id="salvation-email" type="email" autoComplete="email" className={inputCls} {...register("email")} />
          </div>
          <div>
            <label htmlFor="salvation-phone" className="mb-2 block text-sm font-semibold">
              Phone
            </label>
            <input id="salvation-phone" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} {...register("phone")} />
          </div>
        </div>

        <div>
          <label htmlFor="salvation-location" className="mb-2 block text-sm font-semibold">
            Where are you located?
          </label>
          <input
            id="salvation-location"
            autoComplete="address-level2"
            placeholder="City, state and country"
            className={inputCls}
            {...register("location")}
          />
        </div>

        <div>
          <label htmlFor="salvation-church" className="mb-2 block text-sm font-semibold">
            What church are you part of?
          </label>
          <input
            id="salvation-church"
            placeholder="Leave blank if you have none yet"
            className={inputCls}
            {...register("church_name")}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-gray-200 bg-white p-3.5 transition-colors has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6]">
          <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0 accent-church-maroon" {...register("interested_in_baptism")} />
          <span className="text-sm leading-snug text-gray-800">
            I would like to know about getting baptised.
          </span>
        </label>

        <div>
          <label htmlFor="salvation-message" className="mb-2 block text-sm font-semibold">
            Anything you would like to tell us?
          </label>
          <textarea
            id="salvation-message"
            rows={4}
            className={`${inputCls} resize-none`}
            {...register("message")}
          />
        </div>

        {serverError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-church-maroon px-6 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Tell the church"}
        </button>
      </form>
    </div>
  );
}
