"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import TextAreaForm from "@/components/form/TextAreaForm";
import InputForm from "@/components/form/useForm/InputForm";
import RadioForm from "@/components/form/useForm/RadioForm";

type FormValues = {
  request: string;
  name?: string;
  email?: string;
  phone?: string;
  is_anonymous: boolean;
};

export default function PrayerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { is_anonymous: false } });

  const isAnonymous = watch("is_anonymous");

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    try {
      const res = await fetch("/api/prayer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#87102C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="space-y-5 mt-5 text-gray-800 dark:text-gray-100">
      <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
        Prayer Request
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        Send your prayer request(s), knowing that whatever we ask in His name,
        He will do it. Let&apos;s together glorify the Father through the power of
        prayer.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm space-y-5"
      >
        <TextAreaForm
          label="What is your prayer request?"
          name="request"
          register={register}
          rows={6}
          placeholder="Type your prayer request here..."
          error={errors.request?.message}
          required
        />

        <RadioForm
          label="Submit anonymously?"
          name="is_anonymous"
          register={register}
          layout="grid"
          options={[
            { label: "No — include my name", value: false },
            { label: "Yes — keep it anonymous", value: true },
          ]}
        />

        {!isAnonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputForm label="Name" name="name" register={register} />
            <InputForm label="Phone" name="phone" register={register} />
            <div className="sm:col-span-2">
              <InputForm label="Email" name="email" type="email" register={register} />
            </div>
          </div>
        )}

        {serverError && (
          <p className="text-red-500 text-sm">{serverError}</p>
        )}

        <Button
          className="mt-2 w-full md:w-auto"
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting…" : "Submit Prayer Request"}
        </Button>
      </form>
    </div>
  );
}
