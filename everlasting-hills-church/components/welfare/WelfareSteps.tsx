"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Briefcase, Mail, MapPin, Phone, User } from "lucide-react";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormTextarea } from "@/components/ui/form/FormTextarea";
import { URGENCY_OPTIONS, urgencyShortLabel, type WelfareFormValues } from "./welfare-schema";

type StepProps = {
  register: UseFormRegister<WelfareFormValues>;
  errors: FieldErrors<WelfareFormValues>;
};

function StepIntro({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-normal text-[#2B1114]" style={{ fontFamily: "var(--wf-serif)" }}>
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-sm text-[#8a7e80]">{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold tracking-wide text-[#5A4A4D]">
      {children} <span className="text-[#87102C]">*</span>
    </label>
  );
}

// ── Step 1 — Your details ──────────────────────────────────────────────────

export function WelfareStepDetails({ register, errors }: StepProps) {
  return (
    <div>
      <StepIntro title="Your details" />
      <div className="space-y-5">
        <FormInput
          label="Full name"
          required
          icon={User}
          placeholder="e.g. Ifeoma Chukwu"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput
            label="Phone number"
            required
            type="tel"
            icon={Phone}
            placeholder="e.g. 08012345678"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <FormInput
            label="Email"
            required
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <FormInput
          label="Home address"
          required
          icon={MapPin}
          placeholder="e.g. Bodija, Ibadan"
          error={errors.address?.message}
          {...register("address")}
        />

        <div>
          <FieldLabel>Are you a worker in the church</FieldLabel>
          <div className="flex gap-2.5">
            {[
              { value: "YES", label: "Yes" },
              { value: "NO", label: "No" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#E7CDD3]/70 bg-white px-4 py-3 text-sm font-medium text-[#2B1114] transition-all duration-150 has-[:checked]:border-[#87102C] has-[:checked]:bg-[#FFF4F6] hover:border-[#D9B8C0]"
              >
                <input type="radio" value={opt.value} className="h-4 w-4 accent-[#87102C]" {...register("isWorkerInChurch")} />
                {opt.label}
              </label>
            ))}
          </div>
          {errors.isWorkerInChurch?.message && <p className="mt-1.5 text-xs text-red-600">{errors.isWorkerInChurch.message}</p>}
        </div>

        <FormInput
          label="How long have you been attending Everlasting Hills"
          required
          placeholder="e.g. About 2 years"
          error={errors.attendanceLength?.message}
          {...register("attendanceLength")}
        />
      </div>
    </div>
  );
}

// ── Step 2 — Your need ─────────────────────────────────────────────────────

export function WelfareStepNeed({ register, errors }: StepProps) {
  return (
    <div>
      <StepIntro title="Your need" subtitle="Tell us what's going on. There's no need to feel awkward, we're here to help." />
      <div className="space-y-5">
        <FormInput
          label="What do you do for a living"
          required
          icon={Briefcase}
          placeholder="e.g. Tailor, Trader, Teacher, Student"
          error={errors.occupation?.message}
          {...register("occupation")}
        />

        <FormInput
          label="What do you need help with"
          required
          placeholder="e.g. Help with rent, School fees, Medical bill"
          error={errors.category?.message}
          {...register("category")}
        />

        <FormTextarea
          label="Tell us a bit more"
          rows={5}
          error={errors.description?.message}
          {...register("description")}
        />

        <div>
          <FieldLabel>How urgent is this</FieldLabel>
          <div className="space-y-2.5">
            {URGENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="relative flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#E7CDD3]/70 bg-white p-3.5 transition-all duration-150 has-[:checked]:border-[#87102C] has-[:checked]:bg-[#FFF4F6] hover:border-[#D9B8C0]"
              >
                <input
                  type="radio"
                  value={opt.value}
                  className="h-4 w-4 flex-shrink-0 accent-[#87102C]"
                  {...register("urgency")}
                />
                <span className="text-sm font-medium text-[#2B1114]">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.urgency?.message && <p className="mt-1.5 text-xs text-red-600">{errors.urgency.message}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Review ────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7e80]">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-medium text-[#2B1114]">{value}</span>
    </div>
  );
}

export function WelfareStepReview({
  values,
  consent,
  onConsentChange,
  consentError,
}: {
  values: WelfareFormValues;
  consent: boolean;
  onConsentChange: (checked: boolean) => void;
  consentError?: string;
}) {
  return (
    <div>
      <StepIntro title="Review and submit" subtitle="Take a look, then send it our way whenever you're ready." />

      <div className="rounded-2xl border border-[#E7CDD3]/60 bg-[#FFFBF9] px-4 divide-y divide-[#F0DDE1] sm:px-5">
        <SummaryRow label="Name" value={values.fullName} />
        <SummaryRow label="Phone" value={values.phone} />
        <SummaryRow label="Email" value={values.email} />
        <SummaryRow label="Worker in church" value={values.isWorkerInChurch === "YES" ? "Yes" : values.isWorkerInChurch === "NO" ? "No" : ""} />
        <SummaryRow label="Address" value={values.address} />
        <SummaryRow label="Attending for" value={values.attendanceLength} />
        <SummaryRow label="Occupation" value={values.occupation} />
        <SummaryRow label="Needs help with" value={values.category} />
        <SummaryRow label="Urgency" value={urgencyShortLabel(values.urgency)} />
      </div>

      <div className="mt-4 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFFBF9] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7e80]">What you shared</p>
        <p className="mt-2 text-sm leading-relaxed text-[#2B1114] whitespace-pre-wrap">{values.description}</p>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-[#E7CDD3]/70 bg-white p-4 transition-colors has-[:checked]:border-[#87102C] has-[:checked]:bg-[#FFF4F6]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#87102C]"
        />
        <span className="text-sm leading-relaxed text-[#2B1114]">
          I understand this request will be seen only by the welfare team, and I'd like someone to follow up with me.
        </span>
      </label>
      {consentError && <p className="mt-1.5 text-xs text-red-600">{consentError}</p>}
    </div>
  );
}
