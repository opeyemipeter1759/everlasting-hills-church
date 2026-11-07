"use client";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/api/articles";
import { readLocal, writeLocal, type LocalDraft, type Scripture } from "./article-form";
import { useUnsavedWarning } from "./useUnsavedWarning";

/**
 * The story being written: its fields, whether they differ from what is saved
 * (`dirty`), and a copy kept on this device a moment after each change, so a
 * dropped connection or a closed tab never loses the words.
 */
export function useArticleDraft(localKey: string, existing: Article | undefined, editing: boolean, prefill: Scripture | null) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [scripture, setScripture] = useState<Scripture | null>(prefill);
  const [loaded, setLoaded] = useState(!editing);
  const [revision, setRevision] = useState<number | undefined>();
  const [restorable, setRestorable] = useState<LocalDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [localSavedAt, setLocalSavedAt] = useState<number | null>(null);

  // Loaded once. Re-syncing on every refetch would throw away what somebody is typing.
  useEffect(() => {
    if (!existing || loaded) return;
    setTitle(existing.title);
    setSubtitle(existing.subtitle ?? "");
    setBody(existing.body);
    setCover(existing.coverImageUrl ?? null);
    setRevision(existing.revision);
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

  useUnsavedWarning(dirty);

  /** Wraps a setter so the change also marks the story as unsaved. */
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const restore = () => {
    if (!restorable) return;
    setTitle(restorable.title);
    setSubtitle(restorable.subtitle);
    setBody(restorable.body);
    setCover(restorable.coverImageUrl);
    setDirty(true);
    setRestorable(null);
  };
  const discardLocal = () => {
    writeLocal(localKey, null);
    setRestorable(null);
  };
  /** After a save: the server has it, so the device copy can go. */
  const markSaved = () => {
    writeLocal(localKey, null);
    setDirty(false);
  };

  return {
    fields: { title, subtitle, body, cover, scripture },
    set: { title: change(setTitle), subtitle: change(setSubtitle), body: change(setBody), cover: change(setCover), scripture: change(setScripture) },
    revision, restorable, dirty, localSavedAt, restore, discardLocal, markSaved,
  };
}

export type ArticleDraftState = ReturnType<typeof useArticleDraft>;
