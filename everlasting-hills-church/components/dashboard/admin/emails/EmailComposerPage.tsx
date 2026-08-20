"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useEmailTemplate, useCreateEmailTemplate, useUpdateEmailTemplate } from "@/lib/api/emails";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { textLength } from "@/components/dashboard/reports/report-text-utils";
import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";

// Tiptap is only needed once someone actually composes — split out of the
// initial bundle, same reasoning as ReportEditorPage.
const ReportEditor = dynamic(() => import("@/components/dashboard/reports/ReportEditor"), {
  ssr: false,
  loading: () => <SkeletonBlock className="h-[400px] w-full rounded-xl" />,
});

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

const BACK_HREF = "/dashboard/admin/emails";

/** Full-page template composer — mirrors ReportEditorPage's create/edit route
 * pattern (never a modal). The Subject/Message pair is laid out like a real
 * email compose pane, with the message body as rich text (Tiptap). */
export default function EmailComposerPage({ mode, templateId }: { mode: "create" | "edit"; templateId?: string }) {
  const router = useRouter();
  const { data: template, isLoading: templateLoading } = useEmailTemplate(mode === "edit" ? templateId : undefined);
  const create = useCreateEmailTemplate();
  const update = useUpdateEmailTemplate(templateId ?? "");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (mode === "edit" && template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [mode, template]);

  const pending = create.isPending || update.isPending;
  const canSave = name.trim().length >= 2 && subject.trim().length >= 2 && textLength(body) >= 2 && !pending;

  async function handleSave() {
    if (!canSave) return;
    const values = { name: name.trim(), subject: subject.trim(), body };
    try {
      if (mode === "create") {
        await create.mutateAsync(values);
        showToast.success("Template saved");
        router.push(BACK_HREF);
      } else {
        await update.mutateAsync(values);
        showToast.success("Template updated");
      }
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't save template"));
    }
  }

  if (mode === "edit" && templateLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-[560px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-3xl space-y-5 p-4 md:p-6"
    >
      <button
        type="button"
        onClick={() => router.push(BACK_HREF)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} /> Back to Emails
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        {/* Header — template name (internal label, not part of the email itself) */}
        <div className="border-b border-gray-100 dark:border-white/[0.06] px-6 pb-5 pt-7 sm:px-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            {mode === "create" ? "New Template" : "Edit Template"}
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled template"
            maxLength={140}
            className="w-full border-none bg-transparent p-0 text-2xl font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Body — laid out like a real email compose pane: Subject line, then message */}
        <div className="px-6 py-6 sm:px-8 space-y-5">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02] px-4 py-2.5">
              <label
                htmlFor="email-subject"
                className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40"
              >
                Subject
              </label>
              <input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What recipients see in their inbox"
                maxLength={200}
                className="flex-1 border-none bg-transparent p-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="px-1 py-1">
              <ReportEditor value={body} onChange={setBody} placeholder="Write your message…" minHeight={400} />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {pending ? "Saving…" : mode === "create" ? "Save Template" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(BACK_HREF)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
