"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookMarked, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import RichText from "@/components/ui/display/RichText";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { uploadArticleCover, useArticle, useCreateArticle, useDeleteArticle, useUpdateArticle } from "@/lib/api/articles";
import { MediumPage } from "./ArticleTabs";

/** Matches the DTO, so the server never has to reject something the form allowed. */
export const TITLE_MIN = 3;
export const TITLE_MAX = 160;
export const SUBTITLE_MAX = 200;
export const BODY_MIN = 20;
export const BODY_MAX = 40_000;

const FORMATTING_HINT = "**bold** · *italic* · ## heading · - list · > quote · [link](url)";
const LOCAL_PREFIX = "ehc.article-draft.";

interface LocalDraft {
  title: string;
  subtitle: string;
  body: string;
  coverImageUrl: string | null;
  savedAt: number;
}

export function validateArticle(title: string, body: string): string | null {
  if (title.trim().length < TITLE_MIN) return "Give it a title of at least three characters.";
  if (title.trim().length > TITLE_MAX) return `The title is longer than ${TITLE_MAX} characters.`;
  if (body.trim().length < BODY_MIN) return "Write a little more before saving: at least a couple of sentences.";
  if (body.length > BODY_MAX) return "This is longer than the editor can hold. Try splitting it in two.";
  return null;
}

function readLocal(key: string): LocalDraft | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFIX + key);
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}
function writeLocal(key: string, draft: LocalDraft | null) {
  try {
    if (draft) window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(draft));
    else window.localStorage.removeItem(LOCAL_PREFIX + key);
  } catch {
    // Storage full or blocked: the server copy is still the safe one.
  }
}

/**
 * The writing screen, as Medium's: nothing on the page but the title, a
 * subtitle, an optional cover and the story. A copy is kept on this device as
 * you type, so a dropped connection or a closed tab never loses the words.
 * Submitting sends it to the head of comms or an admin for approval.
 */
export default function ArticleEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const editingSlug = params.get("slug");
  const localKey = editingSlug ?? "new";
  const { data: existing, isLoading, error: loadError } = useArticle(editingSlug ?? undefined);

  const create = useCreateArticle();
  const update = useUpdateArticle();
  const remove = useDeleteArticle();

  // Pre-filled from "Write about this" on the reading screen.
  const prefillStart = Number(params.get("start")) || undefined;
  const prefillEnd = Number(params.get("end")) || undefined;
  const prefillLabel = params.get("label") ?? undefined;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scripture, setScripture] = useState<{ label: string; startVerseId?: number; endVerseId?: number } | null>(
    prefillLabel ? { label: prefillLabel, startVerseId: prefillStart, endVerseId: prefillEnd } : null,
  );
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loaded, setLoaded] = useState(!editingSlug);
  const [loadedRevision, setLoadedRevision] = useState<number | undefined>();
  const [restorable, setRestorable] = useState<LocalDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [localSavedAt, setLocalSavedAt] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bodyBox = useRef<HTMLTextAreaElement>(null);

  // Loaded once. Re-syncing on every refetch would throw away what somebody is typing.
  useEffect(() => {
    if (!existing || loaded) return;
    setTitle(existing.title);
    setSubtitle(existing.subtitle ?? "");
    setBody(existing.body);
    setCover(existing.coverImageUrl ?? null);
    setLoadedRevision(existing.revision);
    setScripture(
      existing.scriptureLabel
        ? { label: existing.scriptureLabel, startVerseId: existing.startVerseId ?? undefined, endVerseId: existing.endVerseId ?? undefined }
        : null,
    );
    setLoaded(true);
  }, [existing, loaded]);

  // A copy left on this device that differs from what is saved: offer it back.
  useEffect(() => {
    if (!loaded) return;
    const local = readLocal(localKey);
    if (!local) return;
    const same = local.title === (existing?.title ?? "") && local.body === (existing?.body ?? "") && local.subtitle === (existing?.subtitle ?? "");
    if (same || (!local.title.trim() && !local.body.trim())) writeLocal(localKey, null);
    else setRestorable(local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, localKey]);

  // Keep a copy on this device a moment after each change.
  useEffect(() => {
    if (!loaded || !dirty) return;
    const timer = window.setTimeout(() => {
      const savedAt = Date.now();
      writeLocal(localKey, { title, subtitle, body, coverImageUrl: cover, savedAt });
      setLocalSavedAt(savedAt);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [title, subtitle, body, cover, loaded, dirty, localKey]);

  // Warn before leaving with changes not yet saved to the church.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // The story box grows with the story.
  useEffect(() => {
    const el = bodyBox.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(320, el.scrollHeight)}px`;
  }, [body, preview]);

  const words = useMemo(() => body.split(/\s+/).filter(Boolean).length, [body]);
  const minutes = Math.max(1, Math.round(words / 200));
  const busy = create.isPending || update.isPending || remove.isPending || uploading;
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  async function save(publish: boolean) {
    const problem = validateArticle(title, body);
    if (problem) return setError(problem);
    setError(null);
    try {
      if (existing) {
        const result = await update.mutateAsync({
          id: existing.id,
          revision: loadedRevision,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          coverImageUrl: cover,
          body,
          // Explicit null, so removing the citation actually removes it.
          scriptureLabel: scripture?.label ?? null,
          startVerseId: scripture?.startVerseId ?? null,
          endVerseId: scripture?.endVerseId ?? null,
          status: publish ? "PENDING_REVIEW" : "DRAFT",
        });
        writeLocal(localKey, null);
        setDirty(false);
        router.push(`/dashboard/articles/${result.slug}`);
      } else {
        const result = await create.mutateAsync({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          coverImageUrl: cover,
          body,
          scriptureLabel: scripture?.label,
          startVerseId: scripture?.startVerseId,
          endVerseId: scripture?.endVerseId,
          publish,
        });
        writeLocal(localKey, null);
        setDirty(false);
        router.push(publish ? `/dashboard/articles/${result.slug}` : "/dashboard/articles/mine");
      }
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 409
          ? "This story was changed somewhere else since you opened it. Your words are kept on this device: copy them, reload the page, and paste them back."
          : err instanceof Error
            ? err.message
            : "That did not save. Your words are kept on this device; check your connection and try again.",
      );
    }
  }

  // Ctrl/Cmd+S keeps a draft without leaving the page's flow.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!busy && existing?.status !== "PUBLISHED") void save(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function chooseCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Choose a JPG, PNG or WebP picture for the cover.");
    if (file.size > 5 * 1024 * 1024) return setError("Choose a cover picture under 5 MB.");
    setError(null);
    setUploading(true);
    try {
      change(setCover)(await uploadArticleCover(file));
    } catch (err) {
      setError((err as { message?: string }).message ?? "The cover could not upload. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function unpublish() {
    if (!existing) return;
    try {
      await update.mutateAsync({ id: existing.id, revision: loadedRevision, status: "DRAFT" });
      setDirty(false);
      router.push("/dashboard/articles/mine");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The story could not be withdrawn. Please try again.");
    }
  }

  async function destroy() {
    if (!existing) return;
    await remove.mutateAsync(existing.id);
    writeLocal(localKey, null);
    setDirty(false);
    router.push("/dashboard/articles/mine");
  }

  if (editingSlug && isLoading) {
    return (
      <MediumPage>
        <div className="mx-auto max-w-[740px] space-y-5 pt-12" aria-busy="true">
          <div className="m-paper h-12 w-3/4 animate-pulse" />
          <div className="m-paper h-72 animate-pulse" />
        </div>
      </MediumPage>
    );
  }

  if (editingSlug && (loadError || !existing || !existing.isAuthor)) {
    return (
      <MediumPage>
        <p role="alert" className="m-ink mx-auto max-w-[740px] py-12 text-sm">
          This story could not be opened for editing.{" "}
          <Link href="/dashboard/articles/mine" className="underline">
            Back to your stories
          </Link>
        </p>
      </MediumPage>
    );
  }

  const isPublished = existing?.status === "PUBLISHED";
  const isPending = existing?.status === "PENDING_REVIEW";
  const statusLine = isPending ? "Waiting for approval" : isPublished ? "Published" : "Draft";

  return (
    <MediumPage>
      <header className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-3 border-b m-rule pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard/articles/mine" className="m-muted inline-flex min-h-11 items-center gap-1.5 text-sm hover:text-[var(--m-ink)]">
            <ArrowLeft size={15} aria-hidden="true" /> Your stories
          </Link>
          <span className="m-muted truncate text-sm" aria-live="polite">
            {statusLine}
            {dirty && localSavedAt ? " · Saved on this device" : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPreview((p) => !p)} className="m-icon-btn px-2 text-sm">
            {preview ? "Edit" : "Preview"}
          </button>
          {!isPublished && (
            <button type="button" onClick={() => save(false)} disabled={busy} className="m-pill-outline !min-h-9 !px-4">
              {isPending ? "Withdraw to draft" : "Save draft"}
            </button>
          )}
          {isPublished && (
            <button type="button" onClick={unpublish} disabled={busy} className="m-pill-outline !min-h-9 !px-4">
              Unpublish
            </button>
          )}
          <button type="button" onClick={() => save(true)} disabled={busy} className="m-pill !min-h-9 !px-4">
            {(create.isPending || update.isPending) && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {isPending ? "Update submission" : isPublished ? "Submit changes" : "Submit for review"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[740px] pb-10 pt-8">
        {restorable && (
          <div role="status" className="m-paper m-ink mb-6 flex flex-wrap items-center justify-between gap-3 border m-rule px-4 py-3 text-sm">
            <span>You have unsaved words from {new Date(restorable.savedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} on this device.</span>
            <span className="flex gap-2">
              <button
                type="button"
                className="m-pill !min-h-9 !px-4"
                onClick={() => {
                  setTitle(restorable.title);
                  setSubtitle(restorable.subtitle);
                  setBody(restorable.body);
                  setCover(restorable.coverImageUrl);
                  setDirty(true);
                  setRestorable(null);
                }}
              >
                Restore
              </button>
              <button
                type="button"
                className="m-pill-outline !min-h-9 !px-4"
                onClick={() => {
                  writeLocal(localKey, null);
                  setRestorable(null);
                }}
              >
                Discard
              </button>
            </span>
          </div>
        )}

        <p className="m-muted mb-6 text-[13px]">
          {isPending
            ? "Waiting for the head of comms or an admin. You can update it, or withdraw it to a draft."
            : isPublished
              ? "Submitting changes takes this story off the site until they are approved: it moves to Waiting for approval in Your stories, and someone other than you (the head of comms, a pastor or an admin) approves it."
              : "When you submit, the head of comms or an admin reads it first. Once approved it appears to the church and on the public blog."}
        </p>
        {existing?.status === "DRAFT" && existing.reviewNote && (
          <p className="m-paper m-ink mb-6 border-l-2 border-[var(--m-ink)] px-4 py-3 text-sm">
            <strong>Changes requested:</strong> {existing.reviewNote}
          </p>
        )}

        {cover ? (
          <figure className="relative mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="Cover" className="w-full object-cover" />
            <button type="button" onClick={() => change(setCover)(null)} aria-label="Remove the cover" className="m-pill absolute right-3 top-3 !min-h-9 !px-3">
              <X size={14} aria-hidden="true" /> Remove
            </button>
          </figure>
        ) : (
          !preview && (
            <>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseCover} aria-label="Cover picture" />
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="m-icon-btn mb-6 text-sm">
                {uploading ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={17} aria-hidden="true" />}
                {uploading ? "Uploading cover…" : "Add a cover image"}
              </button>
            </>
          )
        )}

        {scripture && (
          <div className="m-muted mb-6 flex items-center gap-2 text-[13px]">
            <BookMarked size={14} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">About {scripture.label}</span>
            <button type="button" onClick={() => change(setScripture)(null)} aria-label="Remove the passage" className="m-icon-btn !min-h-8 !min-w-8">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        {preview ? (
          <article>
            <h1 className="m-display m-ink text-[34px] leading-[1.12] sm:text-[44px]">{title || "Untitled"}</h1>
            {subtitle.trim() && <p className="m-muted mt-3 text-[22px] leading-snug">{subtitle}</p>}
            <p className="m-muted mt-4 text-sm">
              {minutes} min read · {words} words
            </p>
            <div className="mt-8">
              {body.trim() ? (
                <RichText text={body} density="comfortable" className="m-article" emphasisClassName="m-ink" />
              ) : (
                <p className="m-muted italic">Nothing written yet.</p>
              )}
            </div>
          </article>
        ) : (
          <>
            <label htmlFor="article-title" className="sr-only">
              Title
            </label>
            <textarea
              id="article-title"
              rows={1}
              value={title}
              onChange={(e) => change(setTitle)(e.target.value.replace(/\n/g, " "))}
              placeholder="Title"
              maxLength={TITLE_MAX}
              className="m-display m-ink w-full resize-none border-0 bg-transparent p-0 text-[40px] leading-[1.12] outline-none placeholder:text-[var(--m-gray)] placeholder:opacity-60 focus:ring-0 sm:text-[48px]"
            />
            <label htmlFor="article-subtitle" className="sr-only">
              Subtitle
            </label>
            <input
              id="article-subtitle"
              value={subtitle}
              onChange={(e) => change(setSubtitle)(e.target.value)}
              placeholder="Subtitle (optional)"
              maxLength={SUBTITLE_MAX}
              className="m-muted mt-3 w-full border-0 bg-transparent p-0 text-[22px] leading-snug outline-none placeholder:opacity-60 focus:ring-0"
            />
            <label htmlFor="article-body" className="sr-only">
              Your story
            </label>
            <textarea
              id="article-body"
              ref={bodyBox}
              value={body}
              onChange={(e) => change(setBody)(e.target.value)}
              placeholder="Tell your story…"
              maxLength={BODY_MAX}
              className="m-article mt-8 w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-[var(--m-gray)] placeholder:opacity-60 focus:ring-0"
            />
            <div className="m-muted mt-4 flex flex-wrap items-center justify-between gap-2 border-t m-rule pt-3 text-[12px]">
              <span>{FORMATTING_HINT}</span>
              <span className="tabular-nums">
                {words} words · {minutes} min read
              </span>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="m-paper m-ink mt-6 border-l-2 border-[var(--m-ink)] px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {existing && (
          <div className="mt-10 border-t m-rule pt-6">
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="m-icon-btn text-sm">
              <Trash2 size={15} aria-hidden="true" /> Delete this story
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this story?"
        description="It will be gone for good, with its likes and responses. Unpublishing keeps it as a draft instead."
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={destroy}
        onCancel={() => setConfirmDelete(false)}
      />
    </MediumPage>
  );
}
