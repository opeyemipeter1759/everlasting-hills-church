"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api/axios";
import {
  FormValues,
  Step1PersonalInfo,
  Step2FriendFamilyLocation,
  Step3Interest,
  Step5Details,
  Step6Experience,
} from "./_steps";

const STEP_LABELS = [
  "Personal Info",
  "How You Found Us",
  "Interest",
  "Details",
  "Experience",
];

// Validate only the fields belonging to each step
const STEP_FIELDS: (keyof FormValues)[][] = [
  ["first_name", "last_name", "phone_number", "email", "attendance_type", "gender"],
  ["how_did_you_learn", "invited_by"],
  ["located_in_ibadan", "membership_interest"],
  ["address", "birth_month", "birth_day", "occupation", "born_again"],
  ["service_experience", "whatsapp_interest"],
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

  const isOnline = watch("attendance_type") === "Online";
  const firstName = watch("first_name") ?? "";
  const lastName = watch("last_name") ?? "";
  const membershipInterest = watch("membership_interest");

  // Step 3 (Details) is skipped when user answers "No" to attending another service
  const INTEREST_STEP = 2;
  const EXPERIENCE_STEP = 4;

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (!valid) return;
    if (currentStep === INTEREST_STEP && membershipInterest === "No") {
      setCurrentStep(EXPERIENCE_STEP);
    } else {
      setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
    }
  };

  const goBack = () => {
    if (currentStep === EXPERIENCE_STEP && membershipInterest === "No") {
      setCurrentStep(INTEREST_STEP);
    } else {
      setCurrentStep((s) => s - 1);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError("");
    try {
      // POST /forms/register is @Public — no auth needed. Coerce string radio values.
      await apiClient.post("/forms/register", {
        type: "FIRST_TIMER",
        ...data,
        located_in_ibadan: String(data.located_in_ibadan) === "true",
        whatsapp_interest: String(data.whatsapp_interest) === "true",
      });
      setSubmitted(true);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon relative overflow-x-hidden flex items-center justify-center px-5">
        {/* Cinematic Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/90 to-church-dark" />
          <div className="absolute inset-0 bg-gradient-to-b from-church-dark via-transparent to-church-dark/80" />
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-church-maroon/20 blur-[130px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-church-accent/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />
        </div>
        <div className="text-center max-w-md relative z-10">
          <div className="w-16 h-16 rounded-full bg-[#FFE8ED] flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#87102C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-2xl mb-3">Welcome home!</h1>
          <p className="text-white/60 leading-relaxed text-sm">
            Thank you for filling this out. Our team will be in touch with you shortly. We're so glad you came!
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
    <Step3Interest key="s3" register={register} errors={errors} isOnline={isOnline} firstName={firstName} lastName={lastName} />,
    <Step5Details key="s4" register={register} errors={errors} />,
    <Step6Experience key="s5" register={register} errors={errors} />,
  ];

  const progress = Math.round(((currentStep + 1) / STEP_LABELS.length) * 100);

  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon relative overflow-x-hidden py-12 px-4 sm:px-5">
      {/* Cinematic Background with Fade Gradients (copied from Connect page) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/images/church_congregation_3_1779193624434.png" 
          alt="Everlasting Hills Community" 
          className="w-full h-full object-cover opacity-40 scale-105"
        />
        {/* The Fade-In/Out Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/40 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark/80 via-transparent to-church-dark/80" />
        <div className="absolute inset-0 bg-church-dark/20 backdrop-brightness-[0.8]" />
      </div>
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center mt-20">
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">
            Welcome to Everlasting Hills
          </h1>
          <p className="text-white/50 text-sm">
            Help us know you better — it only takes a few minutes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          {/* Step bars */}
          <div className="flex gap-1.5 mb-3">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < currentStep
                    ? "bg-church-maroon"
                    : i === currentStep
                    ? "bg-gradient-to-r from-church-maroon to-burgundy-light"
                    : "bg-white/15"
                }`}
              />
            ))}
          </div>

          {/* Step labels (desktop only) */}
          <div className="hidden sm:flex justify-between">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className={`text-[11px] font-medium transition-colors ${
                  i <= currentStep ? "text-white/60" : "text-white/25"
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Mobile progress text */}
          <div className="sm:hidden flex justify-between items-center mt-1">
            <p className="text-white/50 text-xs">
              Step {currentStep + 1} of {STEP_LABELS.length} — {STEP_LABELS[currentStep]}
            </p>
            <p className="text-white/40 text-xs">{progress}%</p>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl mb-5">
            {stepComponents[currentStep]}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4">
              <p className="text-sm text-red-400 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 sm:gap-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-3.5 rounded-xl border-2 border-white/20 text-white text-sm font-semibold
                  hover:bg-white/10 hover:border-white/40 transition-all duration-200 active:scale-95"
              >
                ← Back
              </button>
            )}

            {currentStep < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light
                  text-white text-sm font-semibold hover:from-burgundy-dark hover:to-church-maroon
                  transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light
                  text-white text-sm font-semibold hover:from-burgundy-dark hover:to-church-maroon
                  transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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
                  "Submit ✓"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}