"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookMarked,
  Eye,
  Loader2,
  PencilLine,
  Send,
  Trash2,
  X,
} from "lucide-react";
import RichText from "@/components/ui/display/RichText";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  useArticle,
  useCreateArticle,
  useDeleteArticle,
  useUpdateArticle,
} from "@/lib/api/articles";

/** Matches the DTO, so the server never has to reject something the form allowed. */
const TITLE_MIN = 3;
const TITLE_MAX = 160;
const BODY_MIN = 20;
const BODY_MAX = 40_000;

const FORMATTING_HINT =
  "**bold**  ·  *italic*  ·  ## heading  ·  - list  ·  > quote  ·  [link](url)";

/**
 * The writing screen.
 *
 * Two modes on one route: a new piece, or an existing one loaded by slug. The
 * scripture citation can arrive pre-filled from the reading screen, which is
 * the whole path this feature was built for — a member finishes Romans 8 and
 * writes about Romans 8 without having to say which passage twice.
 *
 * Drafts are the default. Publishing is a separate, deliberate button, and
 * nothing here waits for approval.
 */
export default function ArticleEditor() {
  const router = useRouter();
  const params = useSearchParams();

  const editingSlug = params.get("slug");
  const { data: existing, isLoading } = useArticle(editingSlug ?? undefined);

  const create = useCreateArticle();
  const update = useUpdateArticle();
  const remove = useDeleteArticle();

  // Pre-filled from "Write about this" on the reading screen.
  const prefillStart = Number(params.get("start")) || undefined;
  const prefillEnd = Number(params.get("end")) || undefined;
  const prefillLabel = params.get("label") ?? undefined;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scripture, setScripture] = useState<{
    label: string;
    startVerseId?: number;
    endVerseId?: number;
  } | null>(prefillLabel ? { label: prefillLabel, startVerseId: prefillStart, endVerseId: prefillEnd } : null);

  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Loaded once. Re-syncing on every refetch would throw away what somebody is
  // in the middle of typing.
  useEffect(() => {
    if (!existing || loaded) return;
    setTitle(existing.title);
    setBody(existing.body);
    setScripture(
      existing.scriptureLabel
        ? {
            label: existing.scriptureLabel,
            startVerseId: existing.startVerseId ?? undefined,
            endVerseId: existing.endVerseId ?? undefined,
          }
        : null,
    );
    setLoaded(true);
  }, [existing, loaded]);

  const words = useMemo(() => body.split(/\s+/).filter(Boolean).length, [body]);
  const minutes = Math.max(1, Math.round(words / 200));
  const busy = create.isPending || update.isPending || remove.isPending;

  function validate(): string | null {
    if (title.trim().length < TITLE_MIN) return "Give it a title of at least three characters.";
    if (title.trim().length > TITLE_MAX) return `The title is longer than ${TITLE_MAX} characters.`;
    if (body.trim().length < BODY_MIN) return "Write a little more before saving — at least a couple of sentences.";
    if (body.length > BODY_MAX) return "This is longer than the editor can hold. Try splitting it in two.";
    return null;
  }

  async function save(publish: boolean) {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);

    try {
      if (existing) {
        const result = await update.mutateAsync({
          id: existing.id,
          title: title.trim(),
          body,
          // Explicit null, so removing the citation actually removes it.
          scriptureLabel: scripture?.label ?? null,
          startVerseId: scripture?.startVerseId ?? null,
          endVerseId: scripture?.endVerseId ?? null,
          ...(publish ? { status: "PUBLISHED" as const } : {}),
        });
        router.push(`/dashboard/articles/${result.slug}`);
      } else {
        const result = await create.mutateAsync({
          title: title.trim(),
          body,
          scriptureLabel: scripture?.label,
          startVerseId: scripture?.startVerseId,
          endVerseId: scripture?.endVerseId,
          publish,
        });
        router.push(publish ? `/dashboard/articles/${result.slug}` : "/dashboard/articles/mine");
      }
    } catch {
      setError("That did not save. Check your connection and try again.");
    }
  }

  async function unpublish() {
    if (!existing) return;
    await update.mutateAsync({ id: existing.id, status: "DRAFT" });
    router.push("/dashboard/articles/mine");
  }

  async function destroy() {
    if (!existing) return;
    await remove.mutateAsync(existing.id);
    router.push("/dashboard/articles/mine");
  }

  if (editingSlug && isLoading) {
    return (
      <div className="mx-auto max-w-full space-y-4 md:px-5 py-10">
        <div className="h-9 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  const isPublished = existing?.status === "PUBLISHED";

  return (
    <div className="mx-auto max-w-full md:px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/articles/mine"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#87102C] dark:text-white/45 dark:hover:text-[#FFB3C1]"
        >
          <ArrowLeft size={14} /> My writing
        </Link>

        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-600 hover:border-[#87102C]/30 hover:text-[#87102C] dark:border-white/10 dark:text-white/55 dark:hover:text-[#FFB3C1]"
        >
          {preview ? <PencilLine size={11} /> : <Eye size={11} />}
          {preview ? "Keep writing" : "Preview"}
        </button>
      </div>

      {/* The passage this came from. Removable, because not everything somebody
          wants to write is about a specific chapter. */}
      {scripture && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <BookMarked size={13} className="flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
          <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#87102C] dark:text-[#FFB3C1]">
            About {scripture.label}
          </span>
          <button
            type="button"
            onClick={() => setScripture(null)}
            aria-label="Remove the passage"
            className="rounded p-0.5 text-gray-400 hover:text-gray-700 dark:text-white/35 dark:hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {preview ? (
        <article className="mt-6">
          <h1 className="font-serif text-3xl font-bold leading-[1.15] tracking-tight text-[#111] dark:text-white">
            {title || "Untitled"}
          </h1>
          <p className="mt-2 text-[11px] text-[#8a7e80] dark:text-white/40">
            {minutes} min read · {words} words
          </p>
          <div className="mt-6">
            {body.trim() ? (
              <RichText
                text={body}
                density="comfortable"
                className="text-[17px] leading-[1.75] text-gray-800 dark:text-white/75"
                emphasisClassName="text-[#111] dark:text-white"
              />
            ) : (
              <p className="text-sm italic text-gray-400 dark:text-white/35">Nothing written yet.</p>
            )}
          </div>
        </article>
      ) : (
        <div className="mt-6">
          <label htmlFor="article-title" className="sr-only">
            Title
          </label>
          <input
            id="article-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you learn?"
            maxLength={TITLE_MAX}
            className="w-full border-0 bg-transparent p-0 font-serif text-3xl font-bold leading-tight tracking-tight text-[#111] outline-none placeholder:text-gray-300 focus:ring-0 dark:text-white dark:placeholder:text-white/20"
          />

          <label htmlFor="article-body" className="sr-only">
            Your article
          </label>
          <textarea
            id="article-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Start where it started for you.\n\nWhat did the passage say, and what did it change?"}
            rows={18}
            maxLength={BODY_MAX}
            className="mt-5 w-full resize-y border-0 bg-transparent p-0 text-[17px] leading-[1.75] text-gray-800 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-white/80 dark:placeholder:text-white/20"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
            <p className="text-[11px] text-gray-400 dark:text-white/30">{FORMATTING_HINT}</p>
            <p className="text-[11px] tabular-nums text-gray-400 dark:text-white/30">
              {words} words · {minutes} min
            </p>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6 dark:border-white/10">
        <button
          type="button"
          onClick={() => save(true)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24] disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {create.isPending || update.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          {isPublished ? "Save and republish" : "Publish"}
        </button>

        {!isPublished && (
          <button
            type="button"
            onClick={() => save(false)}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:border-gray-300 disabled:opacity-60 dark:border-white/10 dark:text-white/70"
          >
            Save draft
          </button>
        )}

        {isPublished && (
          <button
            type="button"
            onClick={unpublish}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:border-gray-300 disabled:opacity-60 dark:border-white/10 dark:text-white/70"
          >
            Unpublish
          </button>
        )}

        {existing && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-600 disabled:opacity-60 dark:text-white/35 dark:hover:text-red-400"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this article?"
        description="It will be gone for good, along with the likes it has collected. Unpublishing keeps it as a draft instead."
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={destroy}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
