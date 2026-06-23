export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen dark:bg-[#0a0a0a] p-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-5 items-start">

        {/* ── Left Sidebar ── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
            {/* Title */}
            <div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
            {/* Subtitle */}
            <div className="h-3 w-40 bg-gray-100 dark:bg-white/5 rounded animate-pulse mt-1.5 mb-5" />

            {/* Nav items */}
            <nav className="space-y-1">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                >
                  <div className="w-4 h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse flex-shrink-0" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 space-y-6">

            {/* Section heading */}
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
            </div>

            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-40 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>

            {/* Full width field */}
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <div className="h-10 w-28 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}