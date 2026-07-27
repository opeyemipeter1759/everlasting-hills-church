import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";

/** Loading state for ReportEditorPage — mirrors its actual shape (back link,
 * bordered card with header + full-height editor body + correction thread)
 * so the swap-in on load doesn't jump, and pulses obviously while fetching. */
export default function ReportEditorSkeleton() {
  return (
    <div className="mx-auto max-w-8xl space-y-5">
      <SkeletonBlock className="h-4 w-32" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-100 dark:border-white/[0.06] px-6 pb-5 pt-7 sm:px-8">
          <SkeletonBlock className="h-7 w-2/3 max-w-md" />
          <div className="flex items-center gap-2.5">
            <SkeletonBlock className="h-5 w-20 rounded-full" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>

        {/* Body — sized to echo the full-height editor */}
        <div className="space-y-3 px-6 py-6 sm:px-8">
          <SkeletonBlock className="h-10 w-full rounded-xl" />
          <SkeletonBlock className="h-[420px] w-full rounded-xl" />
        </div>

        {/* Correction thread */}
        <div className="space-y-3 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 px-6 py-6 dark:bg-white/[0.015] sm:px-8">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
