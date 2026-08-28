"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Cake, Check, Heart } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { FormInput, labelBase } from "@/components/ui/form/FormInput";
import { Select } from "@/components/ui/select";

export type ProfileDetailsUser = {
  gender: string | null;
  dateOfBirth: string | null;
  weddingAnniversary: string | null;
};

type FormValues = {
  gender: "Male" | "Female" | "";
  birthDay: string;
  birthMonth: string;
  maritalStatus: "single" | "married";
  weddingAnniversary: string;
};

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Date of birth is collected as day + month only (no year, since it's only ever
// used for birthday matching) — the year on the stored value is a carry-over
// sentinel, defaulted to 2000 for members who never had one.
function dayMonthFromIso(iso: string | null): { day: string; month: string } {
  if (!iso) return { day: "", month: "" };
  const d = new Date(iso);
  return { day: String(d.getUTCDate()), month: MONTH_NAMES[d.getUTCMonth()] };
}

function composeDobIso(day: string, month: string, year: number): string | null {
  const mi = MONTH_NAMES.indexOf(month);
  const d = parseInt(day, 10);
  if (mi === -1 || !d || d < 1 || d > 31) return null;
  return new Date(Date.UTC(year, mi, d)).toISOString();
}

const todayStr = new Date().toISOString().slice(0, 10);

const radioCardClass =
  "relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer select-none " +
  "transition-all duration-150 text-sm font-semibold capitalize " +
  "text-[#5A4A4D] dark:text-white/70 border-[#E7CDD3]/60 dark:border-white/[0.10] " +
  "has-[:checked]:border-[#87102C] has-[:checked]:bg-[#FFF4F6] has-[:checked]:text-[#87102C] " +
  "dark:has-[:checked]:border-[#87102C]/70 dark:has-[:checked]:bg-[#87102C]/15 dark:has-[:checked]:text-[#FFB3C1] " +
  "hover:border-[#E7CDD3] dark:hover:border-white/[0.18]";

interface Props {
  user: ProfileDetailsUser;
}

export default function ProfileDetailsForm({ user }: Props) {
  const router = useRouter();
  const { day: initialDay, month: initialMonth } = dayMonthFromIso(user.dateOfBirth);
  const initial: FormValues = {
    gender: (user.gender as "Male" | "Female" | null) ?? "",
    birthDay: initialDay,
    birthMonth: initialMonth,
    maritalStatus: user.weddingAnniversary ? "married" : "single",
    weddingAnniversary: toDateInputValue(user.weddingAnniversary),
  };
  // Year isn't shown or edited, but is preserved on submit so an existing accurate
  // birth year isn't silently overwritten by the sentinel used for new profiles.
  const dobYear = useRef(user.dateOfBirth ? new Date(user.dateOfBirth).getUTCFullYear() : 2000).current;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({ defaultValues: initial });

  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const maritalStatus = watch("maritalStatus");
  const birthDay = watch("birthDay");
  const birthMonth = watch("birthMonth");

  async function onSubmit(values: FormValues) {
    setSaved(false);
    setServerError(null);
    try {
      await apiClient.patch("/members/me", {
        gender: values.gender || null,
        dateOfBirth: composeDobIso(values.birthDay, values.birthMonth, dobYear),
        weddingAnniversary:
          values.maritalStatus === "married" ? values.weddingAnniversary || null : null,
      });
      setSaved(true);
      reset(values, { keepValues: true });
      router.refresh();
      window.setTimeout(() => router.push("/dashboard/profile"), 900);
    } catch (err) {
      setServerError(
        (err as { message?: string }).message ??
          "Couldn't save your details. Please try again.",
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
        <h2 className="text-lg font-bold text-[#111] dark:text-white">Profile Details</h2>
        <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">
          Gender, birthday and marital status — shown on your profile and used for ministry suggestions.
        </p>
      </div>

      {/* Fields */}
      <div className="px-6 sm:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelBase}>Gender</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["Male", "Female"] as const).map((g) => (
                <label key={g} className={radioCardClass}>
                  <input type="radio" value={g} {...register("gender")} className="sr-only" />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelBase}>Marital status</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["single", "married"] as const).map((m) => (
                <label key={m} className={radioCardClass}>
                  <input type="radio" value={m} {...register("maritalStatus")} className="sr-only" />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelBase}>
              <Cake size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />
              Date of birth
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                aria-label="Birth month"
                value={birthMonth}
                onChange={(v) => setValue("birthMonth", v, { shouldDirty: true })}
                placeholder="Month"
                className="w-full text-sm rounded-xl px-4 py-3 text-[#111] bg-white border border-[#E7CDD3]/60 focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 dark:text-white dark:bg-white/[0.06] dark:border-white/[0.10]"
                options={MONTH_NAMES.map((m) => ({ value: m, label: m }))}
              />
              <Select
                aria-label="Birth day"
                value={birthDay}
                onChange={(v) => setValue("birthDay", v, { shouldDirty: true })}
                placeholder="Day"
                className="w-full text-sm rounded-xl px-4 py-3 text-[#111] bg-white border border-[#E7CDD3]/60 focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 dark:text-white dark:bg-white/[0.06] dark:border-white/[0.10]"
                options={Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => ({ value: d, label: d }))}
              />
            </div>
          </div>

          {maritalStatus === "married" && (
            <FormInput
              label="Wedding anniversary"
              icon={Heart}
              type="date"
              max={todayStr}
              {...register("weddingAnniversary")}
            />
          )}
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
