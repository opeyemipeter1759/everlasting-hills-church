"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api/axios";

type FormValues = {
  request: string;
  name?: string;
  email?: string;
  phone?: string;
  is_anonymous: "true" | "false";
};

// ── RadioCard (fixed + reusable) ─────────────────────────────
function RadioCard({
  value,
  label,
  fieldName,
  register,
  validation,
  hasError,
}: {
  value: string;
  label: string;
  fieldName: keyof FormValues;
  register: any;
  validation?: object;
  hasError?: boolean;
}) {
  return (
    <label
      className={
        "relative flex items-center gap-3 px-5 py-4 rounded-2xl border cursor-pointer transition-all " +
        "has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6] " +
        "hover:opacity-90 " +
        (hasError ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white")
      }
    >
      <input
        type="radio"
        value={value}
        className="w-4 h-4 accent-church-maroon cursor-pointer"
        {...register(fieldName, validation)}
      />

      <span className="text-[15px] font-semibold text-black">
        {label}
      </span>
    </label>
  );
}

export default function PrayerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      is_anonymous: "false",
    },
  });

  const isAnonymous = watch("is_anonymous") === "true";

  const onSubmit = async (data: FormValues) => {
    setServerError("");

    try {
      const anonymous = String(data.is_anonymous) === "true";
      // Contact fields stay mounted-then-hidden when switching to anonymous, so
      // react-hook-form still carries their last value (often "") — never send
      // them at all for an anonymous submission, and drop empty strings
      // otherwise (an empty "email" fails @IsEmail on the backend).
      await apiClient.post("/forms/prayer-request", {
        request: data.request,
        is_anonymous: anonymous,
        ...(!anonymous && {
          name: data.name?.trim() || undefined,
          email: data.email?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        }),
      });

      setSubmitted(true);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setServerError(msg ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5 mt-5 flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-church-maroon/10 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#87102C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white">Prayer received</h3>

        <p className="text-white/60 max-w-sm leading-relaxed">
          Your request has been submitted. Our intercessors will stand with you in faith.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-10 text-gray-800 dark:text-gray-100">

      {/* HEADER */}
      <div className="mb-8 text-center mt-20">
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">
          Prayer Request
        </h1>

        <p className="text-white/70 text-sm">
          Send your prayer request(s), knowing that whatever we ask in His name,
          He will do it. Let&apos;s together glorify the Father through the power of prayer.
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white text-black border border-gray-200 rounded-xl p-5 shadow-sm space-y-5"
      >
        {/* TEXTAREA */}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            What would you like to ask? <span className="text-red-500">*</span>
          </label>

          <textarea
            rows={6}
            placeholder="Type your prayer request here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none resize-none"
            {...register("request", { required: "This field is required" })}
          />

          {errors.request && (
            <p className="text-red-500 text-sm mt-1">
              {errors.request.message}
            </p>
          )}
        </div>

        {/* RADIO (UPDATED TO RADIO CARD) */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-black">
            Submit anonymously? <span className="text-red-500">*</span>
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RadioCard
              value="false"
              label="No — include my name"
              fieldName="is_anonymous"
              register={register}
              validation={{ required: true }}
              hasError={!!errors.is_anonymous}
            />

            <RadioCard
              value="true"
              label="Yes — keep it anonymous"
              fieldName="is_anonymous"
              register={register}
              validation={{ required: true }}
              hasError={!!errors.is_anonymous}
            />
          </div>
        </fieldset>

        {/* CONDITIONAL FIELDS */}
        {!isAnonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
                {...register("name")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Phone
              </label>
              <input
                type="text"
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
                {...register("phone")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
                {...register("email")}
              />
            </div>
          </div>
        )}

        {/* ERROR */}
        {serverError && (
          <p className="text-red-500 text-sm">{serverError}</p>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light text-white font-semibold text-sm hover:from-burgundy-dark hover:to-church-maroon transition-all active:scale-95 disabled:opacity-60 shadow-lg"
        >
          {isSubmitting ? "Submitting…" : "Submit Prayer Request"}
        </button>
      </form>
    </div>
  );
}