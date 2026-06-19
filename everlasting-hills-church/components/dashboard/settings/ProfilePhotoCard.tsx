"use client";

import { useState } from "react";
import { Check, Trash2, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { patchFrontendSession } from "@/lib/auth/frontend-session";
import { UploadDropzone } from "@/components/ui/form/UploadDropzone";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";

interface Props {
  initialPhotoUrl: string | null;
  fallbackInitials: string;
  displayName: string;
}

const ACCEPT = "image/png,image/jpeg,image/jpg";
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

export default function ProfilePhotoCard({
  initialPhotoUrl,
  fallbackInitials,
  displayName,
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleFile(file: File) {
    setError(null);
    setSaved(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleCancel() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setError(null);
    setSaved(false);
  }

  async function handleSave() {
    if (!pendingFile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const res = await apiClient.post<{ photoUrl: string }>(
        "/members/me/avatar",
        fd,
        { headers: { "Content-Type": undefined as unknown as string } },
      );
      const next = res.data.photoUrl;
      setPhotoUrl(next);
      patchFrontendSession({ picture: next });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setPreviewUrl(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        (err as { message?: string }).message ??
          "Photo upload is coming soon. Please reach out to an admin for now.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiClient.delete("/members/me/avatar");
      setPhotoUrl(null);
      patchFrontendSession({ picture: null });
      setConfirmDelete(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        (err as { message?: string }).message ??
          "Photo removal is coming soon. Please reach out to an admin for now.",
      );
    } finally {
      setSaving(false);
    }
  }

  const currentPreview = previewUrl ?? photoUrl;

  return (
    <>
      <ConfirmDialog
        open={confirmDelete}
        title="Remove your profile photo?"
        description="Your photo will be cleared and replaced with your initials until you upload a new one."
        confirmLabel="Yes, remove"
        tone="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => !saving && setConfirmDelete(false)}
      />

      <section
        aria-labelledby="photo-card-title"
        className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl shadow-[0_1px_2px_rgba(135,16,44,0.04)] dark:shadow-none"
      >
        {/* Card header */}
        <div className="px-6 sm:px-7 pt-7 pb-5 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
          <h2 id="photo-card-title" className="text-lg font-bold text-[#111] dark:text-white">
            Your Photo
          </h2>
          <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">
            A square PNG or JPG looks best.
          </p>
        </div>

        {/* Current avatar row */}
        <div className="px-6 sm:px-7 pt-6">
          <div className="flex items-center gap-4">
            {currentPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPreview}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#E7CDD3]/70 dark:ring-white/[0.14]"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] flex items-center justify-center text-base font-bold ring-2 ring-[#E7CDD3]/70 dark:ring-white/[0.10]"
              >
                {fallbackInitials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111] dark:text-white">Edit your photo</p>
              <div className="flex items-center gap-4 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!photoUrl && !pendingFile) return;
                    if (pendingFile) {
                      handleCancel();
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                  disabled={!photoUrl && !pendingFile}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:text-[#6E0C24] dark:hover:text-white disabled:text-[#cbb9bd] dark:disabled:text-white/25 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>(
                      'input[type="file"][accept="image/png,image/jpeg,image/jpg"]',
                    );
                    input?.click();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:text-[#6E0C24] dark:hover:text-white transition-colors"
                >
                  <RefreshCw size={12} />
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div className="px-6 sm:px-7 py-6">
          <UploadDropzone
            accept={ACCEPT}
            maxSizeBytes={MAX_BYTES}
            onFile={handleFile}
            selectedName={pendingFile?.name ?? null}
            hint="PNG, JPG or JPEG (max 1 MB)"
            disabled={saving}
          />
        </div>

        {/* Status + footer actions */}
        <div className="px-6 sm:px-7 pb-7">
          {(saved || error) && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 ${
                error
                  ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
                  : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              }`}
              role={error ? "alert" : "status"}
            >
              {!error && <Check size={16} className="mt-0.5 flex-shrink-0" />}
              <span>{error ?? "Photo saved."}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!pendingFile || saving}
              className="px-5 py-2.5 rounded-xl border border-[#E7CDD3] dark:border-white/[0.14] text-[#5A4A4D] dark:text-white/70 text-sm font-semibold hover:bg-[#FFF4F6] dark:hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!pendingFile || saving}
              className="px-6 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold tracking-wide hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
