"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ChevronLeft, HeartHandshake, Loader2 } from "lucide-react";
import { useSubmitWelfareRequest } from "@/lib/api/welfare";
import WelfareProgress from "./WelfareProgress";
import WelfareSuccess from "./WelfareSuccess";
import { WelfareStepDetails, WelfareStepNeed, WelfareStepReview } from "./WelfareSteps";
import {
  WELFARE_FORM_DEFAULTS,
  stepOneSchema,
  stepTwoSchema,
  stepThreeSchema,
  type WelfareFormValues,
} from "./welfare-schema";

const EASE = [0.22, 1, 0.36, 1] as const;
type Step = 1 | 2 | 3;

export default function WelfareRequestPage() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = useSubmitWelfareRequest();

  const {
    register,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<WelfareFormValues>({ defaultValues: WELFARE_FORM_DEFAULTS, mode: "onBlur" });

  function goBack() {
    setServerError(null);
    setDirection(-1);
    setStep((s) => (s - 1) as Step);
  }

  function goNext() {
    setServerError(null);
    const values = getValues();
    const schema = step === 1 ? stepOneSchema : stepTwoSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof WelfareFormValues;
        setError(field, { message: issue.message });
      }
      return;
    }
    clearErrors();
    setDirection(1);
    setStep((s) => (s + 1) as Step);
  }

  async function handleFinalSubmit() {
    setServerError(null);
    const consentParsed = stepThreeSchema.safeParse({ consent: getValues("consent") });
    if (!consentParsed.success) {
      setError("consent", { message: consentParsed.error.issues[0]?.message });
      return;
    }
    clearErrors("consent");

    const values = getValues();

    try {
      const result = await submit.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        isWorkerInChurch: values.isWorkerInChurch === "YES",
        address: values.address.trim(),
        attendanceLength: values.attendanceLength.trim(),
        occupation: values.occupation.trim(),
        category: values.category.trim(),
        description: values.description.trim(),
        urgency: values.urgency,
      });
      setReferenceCode(result.referenceCode);
    } catch (err) {
      setServerError(
        (err as { message?: string }).message ??
          "Something went wrong on our end. Please try again, or reach out to us directly.",
      );
    }
  }

  const values = watch();

  return (
    <main
      style={{ fontFamily: "var(--wf-sans)" }}
      className="relative min-h-screen overflow-hidden bg-[#FFFBF9] pb-20 pt-14 text-[#2B1114] sm:pt-20"
    >
      {/* Soft decorative backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-[70%] rounded-full bg-[#FFD9E0]/40 blur-3xl" />
        <div className="absolute -top-10 right-0 h-[360px] w-[360px] translate-x-1/3 rounded-full bg-[#87102C]/[0.06] blur-3xl" />
        <div className="bg-grain absolute inset-0 opacity-60" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4F6] text-[#87102C] shadow-sm shadow-[#87102C]/10">
          <HeartHandshake size={24} aria-hidden="true" />
        </span>
        <h1
          className="mt-5 text-4xl font-normal leading-[1.05] tracking-tight text-[#2B1114] sm:text-5xl"
          style={{ fontFamily: "var(--wf-serif)" }}
        >
          We're here for you.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#6d565b]">
          Whatever season you're in, you don't have to carry it alone. Tell us what's going on and let our welfare
          team walk with you.
        </p>
      </section>

      {/* Form card */}
      <section className="mx-auto mt-10 max-w-2xl px-4 xs:px-5 sm:mt-12">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#E7CDD3]/60 bg-white shadow-xl shadow-[#87102C]/5">
          <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-[#87102C] via-[#c93860] to-[#f2b84b]" />
          <div className="p-5 xs:p-6 sm:p-10">
            {referenceCode ? (
              <WelfareSuccess />
            ) : (
              <>
                <WelfareProgress step={step} />

                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.div
                      key={step}
                      custom={direction}
                      initial={{ opacity: 0, x: 24 * direction }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 * direction }}
                      transition={{ duration: 0.38, ease: EASE }}
                    >
                      {step === 1 && <WelfareStepDetails register={register} errors={errors} />}
                      {step === 2 && <WelfareStepNeed register={register} errors={errors} />}
                      {step === 3 && (
                        <WelfareStepReview
                          values={values}
                          consent={values.consent}
                          onConsentChange={(checked) => {
                            setValue("consent", checked);
                            if (checked) clearErrors("consent");
                          }}
                          consentError={errors.consent?.message}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {serverError && (
                  <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {serverError}
                  </p>
                )}

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#F0DDE1] pt-6">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex min-h-12 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-[#2B1114] transition-colors hover:bg-[#FFF4F6]"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                      Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex min-h-12 flex-1 max-w-[200px] items-center justify-center rounded-xl bg-[#87102C] px-6 text-sm font-bold text-white transition-colors hover:bg-[#6f0d24] sm:flex-none"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={submit.isPending}
                      className="inline-flex min-h-12 flex-1 max-w-[200px] items-center justify-center gap-2 rounded-xl bg-[#87102C] px-6 text-sm font-bold text-white transition-colors hover:bg-[#6f0d24] disabled:opacity-60 sm:flex-none"
                    >
                      {submit.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                      {submit.isPending ? "Sending…" : "Submit request"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
