"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  name?: string;
  phone_number?: string;
  content: string;
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
  fieldName: keyof FormValues;
  register: any;
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
        type="radio"
        value={value}
        className="w-4 h-4 accent-[#800020]"
        {...register(fieldName)}
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setServerError("");

    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "TESTIMONY", ...data }),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Network error. Please try again.");
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

        {/* INPUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
              {...register("name")}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Phone</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none"
              {...register("phone_number")}
            />
          </div>
        </div>

        {/* TEXTAREA FIXED */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            What is your testimony? <span className="text-red-500">*</span>
          </label>

          <textarea
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-church-maroon focus:outline-none resize-none"
            {...register("content", {
              required: "This field is required",
            })}
          />

          {errors.content && (
            <p className="text-red-500 text-sm mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* RADIO FIXED (NOW FULLY CLICKABLE) */}
        <fieldset className="space-y-3">
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
        </fieldset>

        {/* ERROR */}
        {serverError && (
          <p className="text-red-500 text-sm">{serverError}</p>
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