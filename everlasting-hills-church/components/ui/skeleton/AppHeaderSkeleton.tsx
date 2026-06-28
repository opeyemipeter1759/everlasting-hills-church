'use client';

function Bone({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/60 ${className}`} />
  );
}

export function AppHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 flex py-1.5 w-full shrink-0 items-center gap-4
      border-b border-gray-200/80 justify-between bg-white backdrop-blur-sm px-2
      dark:border-gray-800 dark:bg-gray-900
      shadow-[0_1px_3px_rgba(0,0,0,0.04)]
      transition-colors duration-300 lg:px-6">

      {/* Left: menu button + title + date */}
      <div className="flex items-center gap-3 mr-auto min-w-0">
        {/* Menu button placeholder */}
        <Bone className="h-9 w-9 rounded-lg shrink-0" />

        {/* Page title + date — hidden on mobile, matches sm:flex */}
        <div className="hidden sm:flex flex-col gap-1.5 min-w-0">
          <Bone className="h-3.5 w-28" />
          <Bone className="h-2.5 w-20" />
        </div>
      </div>

      {/* Right: theme + bell + avatar */}
      <div className="flex shrink-0 items-center gap-1">
        <Bone className="h-9 w-9 rounded-lg" />
        <Bone className="h-9 w-9 rounded-lg" />
        {/* Session action menu / avatar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Bone className="h-8 w-8 rounded-full" />
          <Bone className="h-3 w-20 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
