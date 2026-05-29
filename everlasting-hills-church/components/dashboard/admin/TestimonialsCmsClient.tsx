"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  EyeOff,
  Pencil,
  Plus,
  Quote,
  Trash2,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";

/**
 * Testimonials CMS — full CRUD for the homepage "My Everlasting Hills Experience" slider.
 *
 * Pattern: single Client Component (one fetcher + one mutator pair per action) instead of
 * splitting into list / form / row — keeps state coherent and mutations trivial to wire.
 * For a larger CMS we'd move to TanStack Query, but for one resource it's overkill.
 *
 * UX:
 *   - List shows all testimonials (drafts + published) with a published/draft badge
 *   - "+ New" opens an inline form
 *   - Edit replaces a row with the form
 *   - Delete asks for confirmation
 *   - Successful create/update closes the form and reloads the list
 *
 * All requests go through apiClient (axios) which attaches the JWT cookie automatically and
 * unwraps the response envelope. PASTOR+ enforced by backend RolesGuard.
 */

interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  content: string;
  published: boolean;
  publishedAt: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

type EditingState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; testimonial: Testimonial };

const EMPTY_FORM = {
  authorName: "",
  authorRole: "",
  authorPhotoUrl: "",
  content: "",
  published: false,
  order: 0,
};

export default function TestimonialsCmsClient() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>({ kind: "closed" });

  async function loadAll() {
    setLoadError(null);
    try {
      const res = await apiClient.get<Testimonial[]>("/testimonials");
      setItems(res.data);
    } catch (err) {
      setLoadError((err as { message?: string }).message ?? "Failed to load");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleDelete(t: Testimonial) {
    if (!confirm(`Delete testimonial from ${t.authorName}? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/testimonials/${t.id}`);
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Delete failed");
    }
  }

  async function handleTogglePublish(t: Testimonial) {
    try {
      await apiClient.patch(`/testimonials/${t.id}`, { published: !t.published });
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Toggle failed");
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Homepage testimonials
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            These appear in the &quot;My Everlasting Hills Experience&quot; slider on the public homepage.
            {items && (
              <>
                {" "}· {items.filter((t) => t.published).length} published, {items.filter((t) => !t.published).length} drafts
              </>
            )}
          </p>
        </div>
        {editing.kind === "closed" && (
          <button
            type="button"
            onClick={() => setEditing({ kind: "create" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New testimonial
          </button>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          {loadError}
        </div>
      )}

      {/* Editor */}
      {editing.kind !== "closed" && (
        <TestimonialForm
          initial={editing.kind === "edit" ? editing.testimonial : null}
          onCancel={() => setEditing({ kind: "closed" })}
          onSaved={async () => {
            setEditing({ kind: "closed" });
            await loadAll();
          }}
        />
      )}

      {/* Skeleton */}
      {items === null && !loadError && <SkeletonList />}

      {/* Empty state */}
      {items !== null && items.length === 0 && editing.kind === "closed" && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <Quote size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No testimonials yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Click <span className="font-semibold text-[#87102C]">New testimonial</span> to add the first one.
          </p>
        </div>
      )}

      {/* List */}
      {items !== null && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((t) => (
            <li
              key={t.id}
              className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {t.authorPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.authorPhotoUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {t.authorName[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t.authorName}</p>
                      {t.published ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                          Draft
                        </span>
                      )}
                    </div>
                    {t.authorRole && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t.authorRole}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(t)}
                    title={t.published ? "Unpublish" : "Publish"}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {t.published ? <EyeOff size={15} /> : <CheckCircle2 size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ kind: "edit", testimonial: t })}
                    title="Edit"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    title="Delete"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <blockquote className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-[#87102C]/20 pl-4">
                {t.content}
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

interface FormProps {
  initial: Testimonial | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}

function TestimonialForm({ initial, onCancel, onSaved }: FormProps) {
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

const inputCls =
  "w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 animate-pulse"
        >
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          </div>
          <div className="space-y-2 pl-4">
            <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-5/6 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
