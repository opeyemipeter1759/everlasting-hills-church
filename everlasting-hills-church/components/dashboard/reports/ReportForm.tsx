"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import ReportAttachmentUpload from "./ReportAttachmentUpload";

export interface ReportFormValues {
  title: string;
  content: string;
  attachmentUrl: string;
  attachmentName: string;
}

/** Shared submit/resubmit form — used both for a brand-new report and for
 * editing one that came back with a correction request. */
export default function ReportForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ReportFormValues>;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ReportFormValues) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(initial?.attachmentUrl ?? "");
  const [attachmentName, setAttachmentName] = useState(initial?.attachmentName ?? "");

  const canSubmit = title.trim().length > 0 && content.trim().length >= 5 && !pending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), content: content.trim(), attachmentUrl, attachmentName });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekly update — July 14"
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">What&apos;s going on</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="Attendance, activities, needs, wins, concerns…"
          className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Attachment (optional)</label>
        <ReportAttachmentUpload
          url={attachmentUrl}
          name={attachmentName}
          onChange={(url, name) => { setAttachmentUrl(url); setAttachmentName(name); }}
          disabled={pending}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40"
        >
          <Send size={14} /> {pending ? "Sending…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
