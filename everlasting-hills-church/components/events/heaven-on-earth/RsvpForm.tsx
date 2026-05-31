"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * RSVP form — premium Elevated Card on the blush section. Full-Bleed CTA at the
 * bottom; spring-animated success state replaces the form on submit.
 *
 * Wires to POST /forms/register on the backend (the existing first-timer form) so
 * RSVPs land in the same Visitor table — the team sees them on the dashboard.
 * Backend rejects duplicates by email/phone with a clear error message.
 *
 * If you'd rather a dedicated /forms/rsvp endpoint, swap the URL — the response
 * shape from the existing endpoint is compatible.
 */

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  attendees: number;
}

interface RegisterResponse {
  success?: boolean;
  message?: string;
  visitor?: unknown;
}

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
  "/api";

export default function RsvpForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { attendees: 1 } });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const [first, ...rest] = data.fullName.trim().split(/\s+/);
      const payload = {
        first_name: first || data.fullName.trim(),
        last_name: rest.join(" ") || "Guest",
        phone_number: data.phone.trim(),
        email: data.email.trim(),
        type: "RSVP_HEAVEN_ON_EARTH",
        // Stash extras in fields that exist on the Visitor model
        service_experience: `RSVP for ${HEAVEN_ON_EARTH.title} on ${HEAVEN_ON_EARTH.dateDisplay}. ${data.attendees} attendee(s).`,
      };

      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/forms/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Server wraps responses in { data, meta } / { error } envelopes
      const body = (await res.json().catch(() => null)) as
        | { data?: RegisterResponse; error?: { message?: string } }
        | null;

      if (!res.ok) {
        const msg = body?.error?.message ?? `RSVP failed (${res.status})`;
        throw new Error(msg);
      }
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(
        (err as Error).message ??
          "Couldn't send your RSVP. Please try again, or call us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="rsvp" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <ScrollReveal>
          <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3 text-center">
            Reserve your seat
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance text-center">
            Tell us you&apos;re{" "}
            <span className="text-[#87102C] font-serif italic">coming</span>.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed text-center">
            It&apos;s free. RSVPing helps us prepare a seat for you — and we love
            knowing who&apos;s coming.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-12 rounded-3xl bg-white border border-[#E7CDD3]/60 shadow-[0_24px_80px_-30px_rgba(135,16,44,0.2)] p-6 sm:p-10 relative overflow-hidden">
            {/* ── Success state ── */}
            {success ? (
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="text-center py-8 sm:py-12"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#111] mb-3">
                  Your seat is reserved.
                </h3>
                <p className="text-[#555] max-w-md mx-auto leading-relaxed">
                  We&apos;ve received your RSVP for{" "}
                  <span className="font-semibold text-[#87102C]">
                    {HEAVEN_ON_EARTH.title}
                  </span>{" "}
                  on {HEAVEN_ON_EARTH.dateDisplay}. A confirmation is on its way
                  to your email.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] hover:gap-3 transition-all"
                >
                  Add another RSVP →
                </button>
              </motion.div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <Field
                  label="Full name"
                  htmlFor="rsvp-name"
                  error={errors.fullName?.message}
                >
                  <input
                    id="rsvp-name"
                    type="text"
                    autoComplete="name"
                    {...register("fullName", {
                      required: "Please tell us your name",
                      maxLength: { value: 120, message: "That's a long name…" },
                    })}
                    placeholder="Jane Doe"
                    className={inputClass(!!errors.fullName)}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    label="Phone number"
                    htmlFor="rsvp-phone"
                    error={errors.phone?.message}
                  >
                    <input
                      id="rsvp-phone"
                      type="tel"
                      autoComplete="tel"
                      {...register("phone", {
                        required: "We use this if we need to reach you",
                        minLength: { value: 7, message: "Looks too short" },
                      })}
                      placeholder="+234 801 234 5678"
                      className={inputClass(!!errors.phone)}
                    />
                  </Field>

                  <Field
                    label="Email address"
                    htmlFor="rsvp-email"
                    error={errors.email?.message}
                  >
                    <input
                      id="rsvp-email"
                      type="email"
                      autoComplete="email"
                      {...register("email", {
                        required: "We'll send a confirmation here",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "That email doesn't look right",
                        },
                      })}
                      placeholder="you@example.com"
                      className={inputClass(!!errors.email)}
                    />
                  </Field>
                </div>

                <Field
                  label="Number of attendees"
                  htmlFor="rsvp-attendees"
                  error={errors.attendees?.message}
                >
                  <input
                    id="rsvp-attendees"
                    type="number"
                    min={1}
                    max={20}
                    {...register("attendees", {
                      valueAsNumber: true,
                      required: "At least one!",
                      min: { value: 1, message: "Bring at least one person 😉" },
                      max: { value: 20, message: "Call us if it's more than 20" },
                    })}
                    className={inputClass(!!errors.attendees)}
                  />
                </Field>

                {serverError && (
                  <p
                    role="alert"
                    className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                  >
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-full bg-[#87102C] text-white text-sm font-bold tracking-wide hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-[#87102C]/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2.5"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending RSVP…
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Reserve My Seat
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#888]">
                  By RSVPing you agree to receive event reminders. We&apos;ll never
                  share your details.
                </p>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Form primitives ──────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  const base =
    "w-full px-4 py-3.5 rounded-xl border bg-[#FFF4F6]/40 text-[#111] text-sm placeholder:text-[#aaa] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#87102C]/15 transition-all";
  return hasError
    ? `${base} border-red-300 focus:border-red-400 focus:bg-red-50/30`
    : `${base} border-[#E7CDD3] focus:border-[#87102C] focus:bg-white`;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-bold text-[#444] mb-2 tracking-wide"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
