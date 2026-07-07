"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { submitEventRsvp, getRsvpErrorMessage } from "@/lib/api/events";

/**
 * Generic event RSVP form — posts to POST /events/:slug/rsvp. Premium Elevated Card
 * on the blush section with a spring-animated success state, matching the bespoke
 * Heaven on Earth form. One RSVP per person — no attendee/party-size count.
 */

interface Props {
  slug: string;
  eventTitle: string;
  dateLabel: string;
}

export default function EventRsvpForm({ slug, eventTitle, dateLabel }: Props) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitEventRsvp(slug, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(getRsvpErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="rsvp" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3 text-center">
          Reserve your seat
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance text-center">
          Tell us you&apos;re{" "}
          <span className="text-[#87102C] font-serif italic">coming</span>.
        </h2>
        <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed text-center">
          It&apos;s free. RSVPing helps us prepare a seat for you.
        </p>

        <div className="mt-12 rounded-3xl bg-white border border-[#E7CDD3]/60 shadow-[0_24px_80px_-30px_rgba(135,16,44,0.2)] p-6 sm:p-10">
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
                <span className="font-semibold text-[#87102C]">{eventTitle}</span>
                {dateLabel ? ` on ${dateLabel}` : ""}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setForm({ fullName: "", email: "", phone: "" });
                }}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] hover:gap-3 transition-all"
              >
                Add another RSVP →
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Field label="Full name" htmlFor="rsvp-name">
                <input
                  id="rsvp-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Jane Doe"
                  className={inputClass}
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Phone number" htmlFor="rsvp-phone">
                  <input
                    id="rsvp-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+234 801 234 5678"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email address" htmlFor="rsvp-email">
                  <input
                    id="rsvp-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </Field>
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                >
                  {error}
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
      </div>
    </section>
  );
}

const inputClass =
  "w-full px-4 py-3.5 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/40 text-[#111] text-sm placeholder:text-[#aaa] focus:outline-none focus:border-[#87102C] focus:bg-white focus-visible:ring-4 focus-visible:ring-[#87102C]/15 transition-all";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
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
    </div>
  );
}
