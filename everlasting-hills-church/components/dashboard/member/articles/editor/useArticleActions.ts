"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateArticle, useDeleteArticle, useUpdateArticle, type Article } from "@/lib/api/articles";
import { validateArticle } from "./article-form";
import type { ArticleDraftState } from "./useArticleDraft";

function saveError(err: unknown): string {
  if ((err as { status?: number }).status === 409) {
    return "This story was changed somewhere else since you opened it. Your words are kept on this device: copy them, reload the page, and paste them back.";
  }
  return err instanceof Error ? err.message : "That did not save. Your words are kept on this device; check your connection and try again.";
}

/** Save a draft, submit for review, unpublish and delete; Ctrl/Cmd+S saves a draft. */
export function useArticleActions(existing: Article | undefined, draft: ArticleDraftState) {
  const router = useRouter();
  const create = useCreateArticle();
  const update = useUpdateArticle();
  const remove = useDeleteArticle();
  const [error, setError] = useState<string | null>(null);
  const saving = create.isPending || update.isPending;
  const { title, subtitle, body, cover, scripture } = draft.fields;

  async function save(publish: boolean) {
    const problem = validateArticle(title, body);
    if (problem) return setError(problem);
    setError(null);
    const fields = { title: title.trim(), subtitle: subtitle.trim() || null, coverImageUrl: cover, body };
    try {
      if (existing) {
        const result = await update.mutateAsync({
          id: existing.id, revision: draft.revision, ...fields,
          // Explicit null, so removing the citation actually removes it.
          scriptureLabel: scripture?.label ?? null,
          startVerseId: scripture?.startVerseId ?? null,
          endVerseId: scripture?.endVerseId ?? null,
          status: publish ? "PENDING_REVIEW" : "DRAFT",
        });
        draft.markSaved();
        router.push(`/dashboard/articles/${result.slug}`);
      } else {
        const result = await create.mutateAsync({
          ...fields, scriptureLabel: scripture?.label, startVerseId: scripture?.startVerseId, endVerseId: scripture?.endVerseId, publish,
        });
        draft.markSaved();
        router.push(publish ? `/dashboard/articles/${result.slug}` : "/dashboard/articles/mine");
      }
    } catch (err) {
      setError(saveError(err));
    }
  }

  async function unpublish() {
    if (!existing) return;
    try {
      await update.mutateAsync({ id: existing.id, revision: draft.revision, status: "DRAFT" });
      draft.markSaved();
      router.push("/dashboard/articles/mine");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The story could not be withdrawn. Please try again.");
    }
  }

  async function destroy() {
    if (!existing) return;
    await remove.mutateAsync(existing.id);
    draft.markSaved();
    router.push("/dashboard/articles/mine");
  }

  const busy = saving || remove.isPending;
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

  return { save, unpublish, destroy, error, setError, saving, busy, deleting: remove.isPending };
}
