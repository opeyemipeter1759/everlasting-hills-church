"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Check, Facebook, Instagram, Linkedin, Music2, Twitter, type LucideIcon } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { FormInput } from "@/components/ui/form/FormInput";

export type SocialLinksUser = {
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  tiktok: string | null;
};

type FormValues = {
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  tiktok: string;
};

const FIELDS: { key: keyof FormValues; label: string; icon: LucideIcon }[] = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "twitter", label: "Twitter / X", icon: Twitter },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "tiktok", label: "TikTok", icon: Music2 },
];

interface Props {
  user: SocialLinksUser;
}

export default function SocialLinksForm({ user }: Props) {
  const router = useRouter();
  const initial: FormValues = {
    instagram: user.instagram ?? "",
    facebook: user.facebook ?? "",
    twitter: user.twitter ?? "",
    linkedin: user.linkedin ?? "",
    tiktok: user.tiktok ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({ defaultValues: initial });

  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setSaved(false);
    setServerError(null);
    try {
      await apiClient.patch("/members/me", {
        instagram: values.instagram.trim() || null,
        facebook: values.facebook.trim() || null,
        twitter: values.twitter.trim() || null,
        linkedin: values.linkedin.trim() || null,
        tiktok: values.tiktok.trim() || null,
      });
      setSaved(true);
      reset(values, { keepValues: true });
      window.setTimeout(() => router.push("/dashboard/profile"), 900);
    } catch (err) {
      setServerError(
        (err as { message?: string }).message ??
          "Couldn't save your social links. Please try again.",
      );
    }
  }

  function handleCancel() {
    reset(initial);
    setSaved(false);
    setServerError(null);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl shadow-[0_1px_2px_rgba(135,16,44,0.04)] dark:shadow-none"
    >
      {/* Card header */}
      <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
        <h2 className="text-lg font-bold text-[#111] dark:text-white">Social Media</h2>
        <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">
          Let your church family find and connect with you. Leave blank to keep a platform hidden.
        </p>
      </div>

      {/* Fields */}
      <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FIELDS.map((f) => (
          <FormInput
            key={f.key}
            label={f.label}
            icon={f.icon}
            placeholder="@yourhandle"
            {...register(f.key)}
          />
        ))}
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
            <span>{serverError ?? "Social links saved successfully."}</span>
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
