"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { pastedImages, prepareImage } from "@/lib/image-upload";

/** Upload one picture of any type to /uploads/image and return its URL. */
async function uploadPicture(file: File): Promise<string> {
  const ready = await prepareImage(file);
  const fd = new FormData();
  fd.append("file", ready);
  const res = await apiClient.post<{ url?: string }>("/uploads/image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000,
  });
  const url = res.data?.url ?? "";
  if (!url) throw new Error("Upload succeeded but returned no URL");
  return url;
}

/**
 * Upload state plus paste and drop handlers for a CMS image field. Takes one or
 * several pictures at once (up to `limit`); they upload one after another and
 * `onUploaded` gets the URLs that worked. A picture that fails is reported and
 * the rest still go up.
 */
export function usePictureUpload(onUploaded: (urls: string[]) => void, limit = 1) {
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function take(files: File[] | FileList | null | undefined) {
    const list = Array.from(files ?? []).slice(0, Math.max(0, limit));
    if (list.length === 0 || uploading) return;
    setError(null);
    const urls: string[] = [];
    const failed: string[] = [];
    for (let i = 0; i < list.length; i++) {
      setUploading({ done: i, total: list.length });
      try {
        urls.push(await uploadPicture(list[i]));
      } catch (err) {
        failed.push(`${list[i].name}: ${(err as { message?: string }).message ?? "upload failed"}`);
      }
    }
    setUploading(null);
    if (urls.length) onUploaded(urls);
    if (failed.length) setError(failed.join(" · "));
  }

  const zone = {
    onPaste: (e: React.ClipboardEvent) => {
      const files = pastedImages(e);
      if (files.length) {
        e.preventDefault();
        void take(files);
      }
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void take(e.dataTransfer.files);
    },
  };

  const label = uploading ? (uploading.total > 1 ? `Uploading ${uploading.done + 1} of ${uploading.total}…` : "Uploading…") : null;
  return { uploading: !!uploading, label, error, dragging, take, zone };
}
