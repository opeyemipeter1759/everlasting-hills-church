"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useArticle } from "@/lib/api/articles";
import { MediumPage } from "./ArticleTabs";
import { readingStats, type Scripture } from "./editor/article-form";
import { CoverAndPassage } from "./editor/CoverAndPassage";
import { EditorFooter } from "./editor/EditorFooter";
import { EditorHeader } from "./editor/EditorHeader";
import { EditorNotices } from "./editor/EditorNotices";
import { EditorLoading, EditorNotFound } from "./editor/EditorStates";
import { StoryFields } from "./editor/StoryFields";
import { StoryPreview } from "./editor/StoryPreview";
import { useArticleActions } from "./editor/useArticleActions";
import { useArticleDraft } from "./editor/useArticleDraft";
import { useCoverUpload } from "./editor/useCoverUpload";

export { BODY_MAX, BODY_MIN, SUBTITLE_MAX, TITLE_MAX, TITLE_MIN, validateArticle } from "./editor/article-form";

/**
 * The writing screen, as Medium's: nothing on the page but the title, a
 * subtitle, an optional cover and the story. A copy is kept on this device as
 * you type, so a dropped connection or a closed tab never loses the words.
 * Submitting sends it to the head of comms or an admin for approval.
 */
export default function ArticleEditor() {
  const params = useSearchParams();
  const editingSlug = params.get("slug");
  const { data: existing, isLoading, error: loadError } = useArticle(editingSlug ?? undefined);
  // Pre-filled from "Write about this" on the reading screen.
  const label = params.get("label");
  const prefill: Scripture | null = label
    ? { label, startVerseId: Number(params.get("start")) || undefined, endVerseId: Number(params.get("end")) || undefined }
    : null;

  const draft = useArticleDraft(editingSlug ?? "new", existing, Boolean(editingSlug), prefill);
  const actions = useArticleActions(existing, draft);
  const coverUpload = useCoverUpload(draft.set.cover, actions.setError);
  const [preview, setPreview] = useState(false);
  const { title, subtitle, body, cover, scripture } = draft.fields;
  const { words, minutes } = useMemo(() => readingStats(body), [body]);
  const busy = actions.busy || coverUpload.uploading;

  if (editingSlug && isLoading) return <EditorLoading />;
  if (editingSlug && (loadError || !existing || !existing.isAuthor)) return <EditorNotFound />;

  return (
    <MediumPage>
      <EditorHeader
        status={existing?.status}
        savedOnDevice={Boolean(draft.dirty && draft.localSavedAt)}
        preview={preview}
        busy={busy}
        saving={actions.saving}
        onTogglePreview={() => setPreview((p) => !p)}
        onSave={actions.save}
        onUnpublish={actions.unpublish}
      />

      <div className="mx-auto max-w-[900px] pb-10 pt-8">
        <EditorNotices
          restorable={draft.restorable}
          status={existing?.status}
          reviewNote={existing?.reviewNote}
          onRestore={draft.restore}
          onDiscard={draft.discardLocal}
        />
        <CoverAndPassage
          cover={cover}
          scripture={scripture}
          preview={preview}
          uploading={coverUpload.uploading}
          onChooseCover={coverUpload.choose}
          onRemoveCover={() => draft.set.cover(null)}
          onRemovePassage={() => draft.set.scripture(null)}
        />
        {preview ? (
          <StoryPreview title={title} subtitle={subtitle} body={body} words={words} minutes={minutes} />
        ) : (
          <StoryFields
            {...{ title, subtitle, body, words, minutes }}
            onTitle={draft.set.title}
            onSubtitle={draft.set.subtitle}
            onBody={draft.set.body}
          />
        )}
        <EditorFooter
          existing={existing}
          body={body}
          error={actions.error}
          busy={busy}
          deleting={actions.deleting}
          onBody={draft.set.body}
          onDelete={actions.destroy}
        />
      </div>
    </MediumPage>
  );
}
