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
  const [error, setError] = useState("");

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
    setError("");
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "FIRST_TIMER", ...data }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
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
    <main className="min-h-screen bg-gradient-to-br from-church-dark to-[#0f0f1e] py-12 px-4 sm:px-5">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-center text-3xl sm:text-4xl font-bold mb-2">
            Welcome to Everlasting Hills
          </h1>
          <p className="text-white/60 text-center text-sm">
            Help us know you better by filling out this form
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`h-2 w-full rounded-full transition-all duration-500 ${
                    i <= currentStep
                      ? "bg-gradient-to-r from-church-maroon to-pink-600"
                      : "bg-white/10"
                  }`}
                />
                <p className="text-xs text-white/40 mt-2 text-center hidden sm:block">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-white/50 text-xs font-medium">
              Step {currentStep + 1} of {STEP_LABELS.length}
            </p>
            <p className="text-white/60 text-xs">
              {Math.round(((currentStep + 1) / STEP_LABELS.length) * 100)}% complete
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm border border-white/10 mb-6">
            {stepComponents[currentStep]}
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 backdrop-blur-sm">
              <p className="text-sm text-red-400 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 sm:gap-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex-1 py-3.5 rounded-xl border-2 border-white/20 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/40 transition-all duration-200 active:scale-95"
              >
                ← Back
              </button>
            )}

            {currentStep < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-pink-600 text-white text-sm font-semibold hover:from-[#6E0C24] hover:to-pink-700 transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-pink-600 text-white text-sm font-semibold hover:from-[#6E0C24] hover:to-pink-700 transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-church-maroon disabled:hover:to-pink-600"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  <span>Submit ✓</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
