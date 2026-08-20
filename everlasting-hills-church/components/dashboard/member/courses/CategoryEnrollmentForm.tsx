"use client";

import { useForm } from "react-hook-form";
import { ScrollText } from "lucide-react";
import toast from "react-hot-toast";
import FormModal, { fieldCls, btnPrimary, btnGhost } from "@/components/ui/overlay/FormModal";
import { useEnrollCategory } from "@/lib/api/courses";

// Site-wide policy text — same for every category (per the current requirement).
// Easy follow-up: move this into the SiteSettings CMS pattern if it ever needs to
// be admin-editable without a code change.
const RULES_AND_REQUIREMENTS = [
  "Complete each course's lessons and modules at your own pace, but within a reasonable timeframe once enrolled.",
  "Score 100% on a course's exam to mark it complete — you can retake an exam as many times as you need.",
  "Engage respectfully with instructors and fellow members throughout the courses in this category.",
];

interface FormValues {
  reason: string;
  commitmentConfirmed: boolean;
  agreedToRules: boolean;
}

export default function CategoryEnrollmentForm({
  open,
  onClose,
  categoryId,
  categoryName,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}) {
  const enrollCategory = useEnrollCategory();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { reason: "", commitmentConfirmed: false, agreedToRules: false } });

  const canSubmit = watch("commitmentConfirmed") && watch("agreedToRules");

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(values: FormValues) {
    try {
      await enrollCategory.mutateAsync({
        categoryId,
        body: {
          reason: values.reason.trim(),
          commitmentConfirmed: true,
          agreedToRules: true,
        },
      });
      toast.success(`You're enrolled in ${categoryName}!`, { icon: "🎓" });
      handleClose();
    } catch (err) {
      toast.error((err as Error).message || "Couldn't enroll — try again");
    }
  }

  return (
    <FormModal
      open={open}
      title={`Enroll in ${categoryName}`}
      subtitle="A quick form before you can start courses in this category."
      onClose={handleClose}
      footer={
        <>
          <button type="button" onClick={handleClose} className={btnGhost}>
            Cancel
          </button>
          <button
            type="submit"
            form="category-enroll-form"
            disabled={!canSubmit || enrollCategory.isPending}
            className={btnPrimary}
          >
            {enrollCategory.isPending ? "Enrolling…" : "Enroll"}
          </button>
        </>
      }
    >
      <form id="category-enroll-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
            Why do you want to take these courses?
          </label>
          <textarea
            rows={3}
            placeholder="A sentence or two is fine…"
            className={`${fieldCls} resize-none`}
            {...register("reason", { required: "This field is required", minLength: { value: 5, message: "A bit more detail, please" }, maxLength: 500 })}
          />
          {errors.reason && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.reason.message}</p>}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
            <ScrollText size={13} /> Rules &amp; requirements
          </div>
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-white/60">
            {RULES_AND_REQUIREMENTS.map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded accent-[#87102C]"
            {...register("commitmentConfirmed", { required: true })}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I can commit to completing the courses in this category within a reasonable timeframe.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded accent-[#87102C]"
            {...register("agreedToRules", { required: true })}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I have read and agree to the rules and requirements above.
          </span>
        </label>
      </form>
    </FormModal>
  );
}
