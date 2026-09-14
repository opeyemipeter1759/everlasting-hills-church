"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, RotateCcw, Upload } from "lucide-react";
import { useEmailSettings, useUpdateEmailSettings, uploadEmailFile } from "@/lib/api/emails";
import { showToast } from "@/components/ui/toast/toast";

/** The header logo every outgoing email renders with — templates, blasts,
 * receipts, welcome mails alike. Upload replaces it church-wide; reset goes
 * back to the site's own /logo.png. */
export default function EmailLogoCard() {
  const { data: settings, isLoading } = useEmailSettings();
  const update = useUpdateEmailSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const busy = uploading || update.isPending;

  async function handlePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadEmailFile(file);
      await update.mutateAsync({ logoUrl: url });
      showToast.success("Email logo updated");
    } catch (err) {
      showToast.error((err as Error).message || "Couldn't update the logo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.03] p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#87102C] to-[#6E0C24]">
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-white/70" />
        ) : settings?.effectiveLogoUrl ? (
          // Plain <img>: the logo lives on R2 / the public site, not a Next image domain.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.effectiveLogoUrl} alt="Email header logo" className="h-12 w-12 object-contain" />
        ) : (
          <ImageIcon size={18} className="text-white/70" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900 dark:text-white">Header logo</p>
        <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
          Shown at the top of every email the church sends.
          {settings && !settings.logoUrl && " Currently using the website logo."}
        </p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handlePicked} className="hidden" />
      <div className="flex items-center gap-2">
        {settings?.logoUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              update.mutate(
                { logoUrl: null },
                { onSuccess: () => showToast.success("Back to the website logo"), onError: () => showToast.error("Couldn't reset the logo") },
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7CDD3] dark:border-white/10 px-3 py-2 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFF4F6] dark:hover:bg-[#87102C]/15 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {settings?.logoUrl ? "Change logo" : "Upload logo"}
        </button>
      </div>
    </div>
  );
}
