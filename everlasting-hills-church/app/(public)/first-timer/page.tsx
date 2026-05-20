"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FormValues,
  Step1PersonalInfo,
  Step2FriendFamilyLocation,
  Step3Interest,
  Step4Details,
  Step5Experience,
} from "./_steps";

const STEP_LABELS = [
  "Personal Info",
  "How You Found Us",
  "Interest",
  "Details",
  "Experience",
];

export default function FirstTimerPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onBlur" });

  const goNext = async () => {
    const valid = await trigger();
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/first-timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSubmitted(true);
    } catch {
      // TODO: surface error state to user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-church-dark flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#FFE8ED] flex items-center justify-center mx-auto mb-6">
            <svg
              width="28"
              height="28"
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
          <h1 className="text-white font-bold text-2xl mb-3">Welcome home!</h1>
          <p className="text-white/60 leading-relaxed">
            Thank you for filling this out. Our team will be in touch with you
            shortly.
          </p>
        </div>
      </main>
    );
  }

  const stepComponents = [
    <Step1PersonalInfo key="s1" register={register} errors={errors} />,
    <Step2FriendFamilyLocation
      key="s2"
      register={register}
      errors={errors}
      watch={watch}
      setValue={setValue}
    />,
    <Step3Interest key="s3" register={register} errors={errors} />,
    <Step4Details key="s4" register={register} errors={errors} />,
    <Step5Experience key="s5" register={register} errors={errors} />,
  ];

  return (
    <main className="min-h-screen bg-church-dark py-16 px-5">
      <div className="max-w-xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-3">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= currentStep ? "bg-church-maroon" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <p className="text-white/40 text-xs">
            Step {currentStep + 1} of {STEP_LABELS.length} —{" "}
            {STEP_LABELS[currentStep]}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
            {stepComponents[currentStep]}
          </div>

          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex-1 py-3.5 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Back
              </button>
            )}

            {currentStep < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-3.5 rounded-full bg-church-maroon text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-full bg-church-maroon text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
