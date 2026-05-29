/**
 * Loading state for a single sermon page.
 * Mirrors the rough layout of SermonDetail so the page doesn't jump on hydrate.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded mb-6 animate-pulse" />
        <div className="aspect-video bg-gray-200 dark:bg-white/10 rounded-2xl mb-6 animate-pulse" />
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-white/10 rounded mb-3 animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded mb-8 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
