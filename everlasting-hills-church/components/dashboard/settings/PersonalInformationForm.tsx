"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, Phone, ShieldCheck, User, FileText, Check } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { patchFrontendSession } from "@/lib/auth/frontend-session";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormTextarea } from "@/components/ui/form/FormTextarea";

export type PersonalFormUser = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  /** Display-only role badge (e.g. MEMBER, ADMIN). */
  role: string | null;
};

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  bio: string;
};

const BIO_MAX = 300;

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(120, "Name is too long"),
  phone: z.string().trim().max(40, "Phone is too long").optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email"),
  bio: z
    .string()
    .max(BIO_MAX, `Bio must be ${BIO_MAX} characters or fewer`)
    .optional()
    .or(z.literal("")),
});

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

interface Props {
  user: PersonalFormUser;
}

export default function PersonalInformationForm({ user }: Props) {
  const initial = {
    fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    phone: user.phone ?? "",
    email: user.email ?? "",
    bio: user.bio ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ defaultValues: initial, mode: "onBlur" });

  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setSaved(false);
    setServerError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormValues;
        setError(field, { message: issue.message });
      }
      return;
    }

    const [firstName, ...rest] = parsed.data.fullName.split(/\s+/);
    const lastName = rest.join(" ");

    try {
      await apiClient.patch("/members/me", {
        firstName,
        lastName: lastName || null,
        phone: parsed.data.phone || null,
        bio: parsed.data.bio || null,
      });
      patchFrontendSession({ fullName: parsed.data.fullName });
      setSaved(true);
      reset(values, { keepValues: true });
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setServerError(
        (err as { message?: string }).message ??
          "Profile editing is coming soon. Please reach out to an admin for now.",
      );
    }
  }

  function handleCancel() {
    reset(initial);
    setSaved(false);
    setServerError(null);
  }

  const roleLabel = user.role ? ROLE_LABEL[user.role] ?? user.role : "Member";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl shadow-[0_1px_2px_rgba(135,16,44,0.04)] dark:shadow-none"
    >
      {/* Card header */}
      <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
        <h2 className="text-lg font-bold text-[#111] dark:text-white">Personal Information</h2>
        <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">
          Update how the church family sees you.
        </p>
      </div>

      {/* Fields */}
      <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormInput
          label="Full Name"
          required
          icon={User}
          placeholder="Opeyemi Peter"
          autoComplete="name"
          {...register("fullName", { required: true })}
          error={errors.fullName?.message}
        />

        <FormInput
          label="Phone Number"
          icon={Phone}
          type="tel"
          placeholder="+234 801 234 5678"
          autoComplete="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />

        <FormInput
          label="Email Address"
          icon={Mail}
          type="email"
          autoComplete="email"
          disabled
          {...register("email")}
          hint="Your sign-in email — contact an admin to change it"
          className="!bg-[#FFF4F6] dark:!bg-white/[0.03]"
        />

        {/* Role badge */}
        <div>
          <label className="block text-xs font-semibold text-[#5A4A4D] dark:text-white/60 mb-2 tracking-wide">
            Role
          </label>
          <div className="w-full text-sm bg-[#FFF4F6] dark:bg-white/[0.04] border border-[#E7CDD3]/60 dark:border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-[#87102C] dark:text-[#FFB3C1] inline-flex items-center gap-2">
              <ShieldCheck size={14} />
              {roleLabel}
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#8a7e80] dark:text-white/35 font-semibold">
              Read-only
            </span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <FormTextarea
            label="BIO"
            icon={FileText}
            placeholder="A short line about your walk, your tribe at EHC, or what you carry in this season…"
            maxLengthHint={BIO_MAX}
            value={watch("bio") ?? ""}
            {...register("bio")}
            error={errors.bio?.message}
          />
        </div>
      </div>

      {/* Card footer */}
      <div className="px-6 sm:px-8 pb-7 pt-2">
        {(saved || serverError) && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 ${
              serverError
                ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
                : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            }`}
            role={serverError ? "alert" : "status"}
          >
            {!serverError && <Check size={16} className="mt-0.5 flex-shrink-0" />}
            <span>{serverError ?? "Profile saved successfully."}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || !isDirty}
            className="px-5 py-2.5 rounded-xl border border-[#E7CDD3] dark:border-white/[0.14] text-[#5A4A4D] dark:text-white/70 text-sm font-semibold hover:bg-[#FFF4F6] dark:hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold tracking-wide hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
