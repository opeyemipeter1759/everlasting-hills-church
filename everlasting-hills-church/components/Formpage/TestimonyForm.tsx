"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import InputForm from "@/components/form/useForm/InputForm";
import Button from "../ui/Button";
import TextAreaForm from "@/components/form/TextAreaForm";

type FormValues = {
  name?: string;
  phone_number?: string;
  content: string;
  share_physically: string;
};

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
      <div className="mt-5 flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-church-maroon/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#87102C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Testimony submitted!</h3>
        <p className="text-white/60 max-w-sm leading-relaxed">
          Thank you for sharing what God has done. Your testimony encourages the whole family.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-5 text-gray-800 dark:text-gray-100">
      <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
        Hi Friend
      </h3>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        At Everlasting Hills Church, we have a culture of sharing with the family of God
        what the Lord has done.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputForm
            label="Name"
            name="name"
            type="text"
            register={register}
            placeholder="Enter Your Name"
          />
          <InputForm
            label="Phone Number"
            name="phone_number"
            type="text"
            register={register}
            placeholder="Enter Your Phone Number"
          />
        </div>

        <TextAreaForm
          label="What are your testimonies?"
          name="content"
          register={register}
          rows={6}
          placeholder="Type your testimonies here..."
          error={errors.content?.message}
          required
        />

        <fieldset>
          <legend className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            Do you want to share your testimony physically?{" "}
            <span className="text-red-500" aria-hidden="true">*</span>
          </legend>
          <div className="flex gap-6" role="radiogroup">
            {["Yes", "No"].map((value) => (
              <label
                key={value}
                htmlFor={`share_physically_${value}`}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <input
                  id={`share_physically_${value}`}
                  type="radio"
                  value={value}
                  {...register("share_physically")}
                  className="w-4 h-4 text-church-maroon border-gray-300 focus:ring-church-maroon"
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {serverError && (
          <p className="text-red-500 text-sm">{serverError}</p>
        )}

        <Button type="submit" variant="primary" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Share Testimony"}
        </Button>
      </form>
    </div>
  );
}
