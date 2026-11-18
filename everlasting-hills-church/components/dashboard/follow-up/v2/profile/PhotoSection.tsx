"use client";

import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { photoErrorMessage, removeFirstTimerPhoto } from "@/lib/api/first-timer-photo";
import PhotoAttachForm from "./PhotoAttachForm";
import type { ProfileSectionProps } from "./types";

const action =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] disabled:opacity-50";

/**
 * Their photo, so the team can put a face to the name on Sunday. Staff attach
 * or replace it here; it also becomes their avatar
 * in every list.
 */
export default function PhotoSection({ profile, refresh }: ProfileSectionProps) {
  const { person } = profile;
  const [attaching, setAttaching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPhoto = !!person.photoKey;

  async function remove() {
    setRemoving(true);
    setError(null);
    try {
      await removeFirstTimerPhoto(person.visitorId);
      setConfirming(false);
      refresh();
    } catch (err) {
      setError(photoErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-labelledby="photo-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="photo-heading" className="text-sm font-semibold text-[#111] dark:text-white">
          Photo
        </h2>
        {!attaching && (
          <div className="flex gap-1">
            <button type="button" onClick={() => setAttaching(true)} className={`${action} text-[#87102C] hover:bg-[#FFE8ED] dark:text-[#FFB3C1] dark:hover:bg-[#87102C]/20`}>
              <Camera size={16} aria-hidden="true" />
              {hasPhoto ? "Replace" : "Add photo"}
            </button>
            {hasPhoto && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={`${action} text-gray-600 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/[0.06]`}
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {hasPhoto && person.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not for the image optimiser
        <img src={person.photoUrl} alt={`Photo of ${person.firstName}`} className="mt-3 h-40 w-40 rounded-2xl object-cover sm:h-48 sm:w-48" />
      )}
      {hasPhoto && !person.photoUrl && (
        <p className="mt-2 text-sm text-gray-500 dark:text-white/50">Their photo is on file but could not be loaded just now. Refresh the page to try again.</p>
      )}
      {!hasPhoto && !attaching && (
        <p className="mt-2 text-sm text-gray-500 dark:text-white/50">No photo yet. One helps the team recognise them on their next visit.</p>
      )}

      {attaching && (
        <PhotoAttachForm
          visitorId={person.visitorId}
          replacing={hasPhoto}
          onCancel={() => setAttaching(false)}
          onDone={() => {
            setAttaching(false);
            refresh();
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        tone="danger"
        title="Remove this photo?"
        description={`The photo of ${person.firstName} is deleted from their record and from storage. You can add a new one later.`}
        confirmLabel="Remove photo"
        loading={removing}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
