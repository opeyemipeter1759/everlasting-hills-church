import { useState } from "react";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { Field, inputCls } from "./atoms";
import type { Testimonial } from "./types";

const EMPTY_FORM = {
  authorName: "",
  authorRole: "",
  authorPhotoUrl: "",
  content: "",
  published: false,
  order: 0,
};

export default function TestimonialForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Testimonial | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [data, setData] = useState({
    authorName: initial?.authorName ?? EMPTY_FORM.authorName,
    authorRole: initial?.authorRole ?? EMPTY_FORM.authorRole,
    authorPhotoUrl: initial?.authorPhotoUrl ?? EMPTY_FORM.authorPhotoUrl,
    content: initial?.content ?? EMPTY_FORM.content,
    published: initial?.published ?? EMPTY_FORM.published,
    order: initial?.order ?? EMPTY_FORM.order,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial;
  const charCount = data.content.length;
  const minChars = 20;
  const maxChars = 1500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (charCount < minChars) {
      setError(`Testimonial must be at least ${minChars} characters.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Drop empty optional strings so the backend doesn't validate "" as a non-empty URL
      const payload = {
        authorName: data.authorName.trim(),
        content: data.content.trim(),
        published: data.published,
        order: data.order,
        ...(data.authorRole.trim() && { authorRole: data.authorRole.trim() }),
        ...(data.authorPhotoUrl.trim() && { authorPhotoUrl: data.authorPhotoUrl.trim() }),
      };
      if (isEdit) {
        await apiClient.patch(`/testimonials/${initial.id}`, payload);
      } else {
        await apiClient.post("/testimonials", payload);
      }
      await onSaved();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit testimonial" : "New testimonial"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Author name *">
          <input
            required
            type="text"
            maxLength={120}
            value={data.authorName}
            onChange={(e) => setData({ ...data, authorName: e.target.value })}
            placeholder="Sade Adeyemi"
            className={inputCls}
          />
        </Field>
        <Field label="Author role">
          <input
            type="text"
            maxLength={120}
            value={data.authorRole}
            onChange={(e) => setData({ ...data, authorRole: e.target.value })}
            placeholder="Member since 2018"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Photo URL (optional)">
        <input
          type="url"
          maxLength={500}
          value={data.authorPhotoUrl}
          onChange={(e) => setData({ ...data, authorPhotoUrl: e.target.value })}
          placeholder="https://…/portrait.jpg"
          className={inputCls}
        />
      </Field>

      <Field label={`Testimonial *  (${charCount}/${maxChars})`}>
        <textarea
          required
          rows={6}
          minLength={minChars}
          maxLength={maxChars}
          value={data.content}
          onChange={(e) => setData({ ...data, content: e.target.value })}
          placeholder="What has being part of Everlasting Hills meant to you?"
          className={`${inputCls} resize-none`}
        />
        {charCount > 0 && charCount < minChars && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            {minChars - charCount} more characters needed.
          </p>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Display order (lower = appears first)">
          <input
            type="number"
            value={data.order}
            onChange={(e) => setData({ ...data, order: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2.5 mt-7 cursor-pointer">
          <input
            type="checkbox"
            checked={data.published}
            onChange={(e) => setData({ ...data, published: e.target.checked })}
            className="w-4 h-4 rounded text-[#87102C] focus:ring-[#87102C]/30"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Publish to homepage immediately
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create testimonial"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
