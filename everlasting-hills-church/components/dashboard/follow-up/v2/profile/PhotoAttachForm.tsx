"use client";

import { useEffect, useId, useState } from "react";
import { ImagePlus } from "lucide-react";
import { photoErrorMessage, uploadFirstTimerPhoto } from "@/lib/api/first-timer-photo";
import { resizePhoto } from "@/lib/first-timer/photo-resize";
import { CONSENT_LABEL } from "@/lib/first-timer/photo-schema";

interface Props {
  visitorId: string;
  replacing: boolean;
  onDone: () => void;
  onCancel: () => void;
}

const button =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";

/**
 * Choose a photo, see it resized, tick consent, save. The photo is shrunk and
 * re-encoded on this device before it uploads, which also strips its location.
 */
export default function PhotoAttachForm({ visitorId, replacing, onDone, onCancel }: Props) {
  const inputId = useId();
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"preparing" | "uploading" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy("preparing");
    try {
      const resized = await resizePhoto(file);
      setPhoto(resized);
      setPreview(URL.createObjectURL(resized));
    } catch (err) {
      setPhoto(null);
      setPreview(null);
      setError(photoErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) return setError("Choose a photo first");
    if (!consent) return setError("Tick that they agreed to this photo being kept on their record");
    setError(null);
    setBusy("uploading");
    try {
      await uploadFirstTimerPhoto(visitorId, photo, consent);
      onDone();
    } catch (err) {
      setError(photoErrorMessage(err));
      setBusy(null);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-4" aria-label={replacing ? "Replace photo" : "Attach a photo"}>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview of the resized photo
          <img src={preview} alt="The photo as it will be saved" className="h-32 w-32 rounded-2xl object-cover" />
        )}
        <label
          htmlFor={inputId}
          className={`${button} cursor-pointer gap-2 border border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-white/75 dark:hover:bg-white/[0.06]`}
        >
          <ImagePlus size={17} aria-hidden="true" />
          {busy === "preparing" ? "Preparing photo" : preview ? "Choose a different photo" : "Take or choose a photo"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy !== null}
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-800 dark:bg-white/[0.05] dark:text-white/80">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#87102C]"
        />
        <span>
          {CONSENT_LABEL}
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-white/45">
            Ask them first. Only the follow-up team can see it, and its location data is removed.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={!photo || !consent || busy !== null} className={`${button} bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
          {busy === "uploading" ? "Saving photo" : replacing ? "Replace photo" : "Save photo"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy === "uploading"}
          className={`${button} text-gray-600 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/[0.06]`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
