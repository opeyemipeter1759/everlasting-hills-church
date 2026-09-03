"use client";

import { useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { apiClient } from "@/lib/api/axios";

type FormValues = {
  name?: string;
  phone_number?: string;
  content: string;
  is_anonymous: "true" | "false";
  share_physically: string;
};

// same RadioCard pattern you already use elsewhere
function RadioCard({
  value,
  label,
  fieldName,
  register,
  hasError,
}: {
  value: string;
  label: string;
  fieldName: "is_anonymous" | "share_physically";
  register: UseFormRegister<FormValues>;
  hasError?: boolean;
}) {
  return (
    <label
      className={
        "relative flex items-center gap-3 px-5 py-4 rounded-2xl border cursor-pointer transition-all " +
        "has-[:checked]:border-[#800020] has-[:checked]:bg-[#FFF4F6] " +
        (hasError ? "border-red-300 bg-red-50/30" : "border-gray-200")
      }
    >
      <input
        id={`testimony-${fieldName}-${value.toLowerCase()}`}
        type="radio"
        value={value}
        aria-invalid={hasError || undefined}
        className="w-4 h-4 accent-[#800020]"
        {...register(fieldName, { required: "Please choose an option" })}
      />

      <span className="text-[15px] font-semibold text-black">{label}</span>
    </label>
  );
}

export default function TestimonyForm() {
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
      // POST /forms/testimony is @Public. Backend's TestimonyDto expects:
      //   { title?, testimony, name?, email?, phone?, is_anonymous?, share_physically? }
      // This form's FormValues use `content` for the body and `phone_number` —
      // remap so the backend DTO validates. Anonymous submissions never send
      // name/phone at all, same as the prayer request form.
      const anonymous = data.is_anonymous === "true";
      const payload: Record<string, unknown> = {
        testimony: data.content,
        is_anonymous: anonymous,
        share_physically: data.share_physically === "Yes",
        ...(!anonymous && {
          name: data.name?.trim() || undefined,
          phone: data.phone_number?.trim() || undefined,
        }),
      };
      await apiClient.post("/forms/testimony", payload);
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

        <h3 className="text-xl font-bold text-white">
          Testimony submitted
        </h3>

        <p className="text-white/60 max-w-sm leading-relaxed">
          Thank you for sharing what God has done. Your testimony encourages the whole family.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-10 text-gray-800 dark:text-gray-100">

      {/* HEADER */}
      <div className="mb-8 text-center mt-20">
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">
          Share Your Testimony
        </h1>

        <p className="text-white/70 text-sm">
          At Everlasting Hills Church, we celebrate what God has done in your life.
          Share your testimony to encourage the family.
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white text-black border border-gray-200 rounded-xl p-5 shadow-sm space-y-5"
      >

        {/* ANONYMITY */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">
            Include your name? <span className="text-red-500">*</span>
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RadioCard
              value="false"
              label="Yes (Include my name)"
              fieldName="is_anonymous"
              register={register}
            />

            <RadioCard
              value="true"
              label="No, keep me anonymous"
              fieldName="is_anonymous"
              register={register}
            />
          </div>
        </fieldset>

        {/* INPUTS */}
        {!isAnonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="testimony-name" className="block text-sm font-semibold mb-2">Name</label>
              <input
                id="testimony-name"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
                {...register("name")}
              />
            </div>

            <div>
              <label htmlFor="testimony-phone" className="block text-sm font-semibold mb-2">Phone</label>
              <input
                id="testimony-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
                {...register("phone_number")}
              />
            </div>
          </div>
        )}

        {/* TEXTAREA FIXED */}
        <div>
          <label htmlFor="testimony-content" className="block text-sm font-semibold mb-2">
            What is your testimony? <span className="text-red-500">*</span>
          </label>

          <textarea
            id="testimony-content"
            rows={6}
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? "testimony-content-error" : undefined}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none resize-none"
            {...register("content", {
              required: "This field is required",
            })}
          />

          {errors.content && (
            <p id="testimony-content-error" role="alert" className="text-red-500 text-sm mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* RADIO FIXED (NOW FULLY CLICKABLE) */}
        <fieldset className="space-y-3" aria-describedby={errors.share_physically ? "testimony-share-error" : undefined}>
          <legend className="text-sm font-semibold">
            Do you want to share your testimony physically?
            <span className="text-red-500 ml-1">*</span>
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <RadioCard
              value="Yes"
              label="Yes"
              fieldName="share_physically"
              register={register}
              hasError={!!errors.share_physically}
            />

            <RadioCard
              value="No"
              label="No"
              fieldName="share_physically"
              register={register}
              hasError={!!errors.share_physically}
            />
          </div>
          {errors.share_physically && (
            <p id="testimony-share-error" role="alert" className="text-red-500 text-sm">
              {errors.share_physically.message}
            </p>
          )}
        </fieldset>

        {/* ERROR */}
        {serverError && (
          <p role="alert" className="text-red-500 text-sm">{serverError}</p>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light text-white font-semibold text-sm"
        >
          {isSubmitting ? "Submitting…" : "Share Testimony"}
        </button>
      </form>
    </div>
  );
}
