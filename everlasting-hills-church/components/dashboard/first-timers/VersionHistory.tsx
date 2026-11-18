"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useRevertOpeningTemplate, type TemplateVersion } from "@/lib/api/opening-message";
import { churchTime } from "./SendsList";

/**
 * Every saved version, newest first, with who saved it and when. Going back
 * is one tap: the old words are saved again as the newest version, so the
 * history itself never changes.
 */
export function VersionHistory({ versions, onReverted }: { versions: TemplateVersion[]; onReverted: (version: TemplateVersion) => void }) {
  const revert = useRevertOpeningTemplate();

  async function use(version: number) {
    try {
      const saved = await revert.mutateAsync(version);
      showToast.success(`Back to the words of version ${version}, saved as version ${saved.version}`);
      onReverted(saved);
    } catch (err) {
      showToast.error((err as ApiError)?.message || "Could not go back to that version");
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5" aria-label="Version history">
      <h2 className="text-sm font-semibold text-[#111] dark:text-white">Version history</h2>
      {versions.length === 0 && <p className="mt-2 text-sm text-gray-500 dark:text-white/50">Nothing saved yet.</p>}
      <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
        {versions.map((v) => {
          const busy = revert.isPending && revert.variables === v.version;
          return (
            <li key={v.version} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
                    Version {v.version}
                    {v.active && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">In use</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/45">
                    Saved {churchTime(v.createdAt)}
                    {v.editedByName ? ` by ${v.editedByName}` : ""}
                  </p>
                </div>
                {!v.active && (
                  <button
                    type="button"
                    onClick={() => use(v.version)}
                    disabled={revert.isPending}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={13} aria-hidden="true" />}
                    Use this version
                  </button>
                )}
              </div>
              <details className="mt-1.5">
                <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-white/55">See the words</summary>
                <p className="mt-1.5 whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-white/[0.03] dark:text-white/70">{v.whatsappBody}</p>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
