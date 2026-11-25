"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { useUploadMedia } from "@/lib/api/cms";
import { pastedImages, prepareImage } from "@/lib/image-upload";

type Pending = { id: string; file: File; preview: string; alt: string; error?: string };

const input =
  "w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40";

function imageDims(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * The media library's upload area: pick, drop or paste one or many pictures of
 * any type, give each its alt text, then upload them all together.
 */
export default function MediaUploadZone() {
  const upload = useUploadMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const busy = progress !== null;

  async function add(files: File[] | FileList | null | undefined) {
    setError(null);
    const problems: string[] = [];
    const ready: Pending[] = [];
    for (const raw of Array.from(files ?? [])) {
      try {
        const file = await prepareImage(raw);
        ready.push({ id: `${Date.now()}-${Math.random()}`, file, preview: URL.createObjectURL(file), alt: "" });
      } catch (err) {
        problems.push(`${raw.name}: ${(err as Error).message}`);
      }
    }
    if (ready.length) setPending((list) => [...list, ...ready]);
    if (problems.length) setError(problems.join(" · "));
  }

  function remove(id: string) {
    setPending((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return list.filter((p) => p.id !== id);
    });
  }

  async function uploadAll() {
    let left = pending;
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      setProgress(`Uploading ${i + 1} of ${pending.length}…`);
      try {
        const dims = await imageDims(item.preview);
        await upload.mutateAsync({ file: item.file, alt: item.alt.trim(), width: dims?.width, height: dims?.height });
        URL.revokeObjectURL(item.preview);
        left = left.filter((p) => p.id !== item.id);
      } catch (err) {
        left = left.map((p) => (p.id === item.id ? { ...p, error: (err as { message?: string }).message ?? "Upload failed" } : p));
      }
    }
    setPending(left);
    setProgress(null);
  }

  const allNamed = pending.length > 0 && pending.every((p) => p.alt.trim());

  return (
    <div
      onPaste={(e) => { const files = pastedImages(e); if (files.length && !busy) { e.preventDefault(); void add(files); } }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (!busy) void add(e.dataTransfer.files); }}
      className="rounded-2xl border border-dashed border-[#E7CDD3] bg-[#FFF4F6]/40 p-4 dark:border-white/15 dark:bg-white/[0.02] xs:p-6"
    >
      <input ref={fileRef} type="file" multiple accept="image/*,.heic,.heif,.tif,.tiff" className="hidden"
        onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
        className={`flex w-full flex-col items-center justify-center gap-2 text-[#87102C] disabled:opacity-60 dark:text-[#e8768a] ${pending.length ? "py-3" : "py-6"}`}>
        <UploadCloud size={pending.length ? 22 : 28} />
        <span className="text-sm font-semibold">
          {pending.length ? "Add more pictures" : "Click to choose pictures (several at once), drop them here, or click here and paste (Ctrl+V)"}
        </span>
        <span className={`text-xs ${error ? "text-red-600" : "text-gray-400 dark:text-white/40"}`}>{error ?? "Any image type · alt text required for each"}</span>
      </button>

      {pending.length > 0 && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-2">
            {pending.map((p, i) => (
              <li key={p.id} className="flex items-start gap-3 rounded-xl bg-white p-2.5 ring-1 ring-[#E7CDD3]/70 dark:bg-white/[0.03] dark:ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <input autoFocus={i === 0} value={p.alt} disabled={busy} aria-label={`Alt text for ${p.file.name}`}
                    onChange={(e) => setPending((list) => list.map((x) => (x.id === p.id ? { ...x, alt: e.target.value, error: undefined } : x)))}
                    placeholder="Alt text: describe the picture, e.g. Congregation worshipping on Sunday"
                    className={input} />
                  <p className={`mt-1 truncate text-[11px] ${p.error ? "text-red-600" : "text-gray-400 dark:text-white/40"}`}>{p.error ?? p.file.name}</p>
                </div>
                <button type="button" onClick={() => remove(p.id)} disabled={busy} aria-label={`Remove ${p.file.name}`}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/10">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!allNamed || busy} onClick={uploadAll}
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              {progress ?? (pending.length > 1 ? `Upload all ${pending.length}` : "Upload")}
            </button>
            <button type="button" disabled={busy} onClick={() => { pending.forEach((p) => URL.revokeObjectURL(p.preview)); setPending([]); }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-white/60 dark:hover:bg-white/5">
              <X size={15} /> Cancel
            </button>
            {!allNamed && !busy && <span className="text-xs text-gray-400 dark:text-white/40">Add alt text to every picture to upload.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
