"use client";

import { useState } from "react";
import { uploadArticleCover } from "@/lib/api/articles";

/** Checks and uploads a cover picture, reporting problems through `onError`. */
export function useCoverUpload(onUploaded: (url: string) => void, onError: (message: string | null) => void) {
  const [uploading, setUploading] = useState(false);

  async function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return onError("Choose a JPG, PNG or WebP picture for the cover.");
    if (file.size > 5 * 1024 * 1024) return onError("Choose a cover picture under 5 MB.");
    onError(null);
    setUploading(true);
    try {
      onUploaded(await uploadArticleCover(file));
    } catch (err) {
      onError((err as { message?: string }).message ?? "The cover could not upload. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return { uploading, choose };
}
